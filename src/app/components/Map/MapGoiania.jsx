'use client'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRouter } from 'next/navigation'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const GOIANIA_CENTER = [-16.6869, -49.2648]
const GOIANIA_ZOOM = 12
const GOIANIA_MIN_ZOOM = 10.40
const GOIANIA_BOUNDS = [[-16.90, -49.50], [-16.45, -49.05]]
const IBGE_GOIANIA = 5208707

// Setores com hospitais próximos → área vermelha
const SETORES_HOSPITAIS = [
    'Setor Leste Universitário',
    'Setor Norte Ferroviário',
    'Setor Norte Ferroviário II',
]

const ICONES_TIPO = {
    'Buraco na via': { emoji: '🕳️', bg: '#78350F' },
    'Iluminação':    { emoji: '💡', bg: '#D97706' },
    'Saneamento':    { emoji: '💧', bg: '#1D4ED8' },
    'Segurança':     { emoji: '🚨', bg: '#DC2626' },
    'Transporte':    { emoji: '🚌', bg: '#15803D' },
}

// Remove acentos para comparação
function normalizar(str) {
    return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function ehHospital(nome) {
    const n = normalizar(nome)
    return SETORES_HOSPITAIS.some(s => normalizar(s) === n)
}

const hospitalStyle = {
    color: '#E53935',
    weight: 40,
    opacity: 0.3,
    fillColor: '#E53935',
    fillOpacity: 0.45,
    lineJoin: 'round',
    lineCap: 'round',
}

function criarIcone(tipo, validado) {
    const { emoji } = ICONES_TIPO[tipo] || { emoji: '📍' }
    const bg = validado === true ? '#15803D' : '#DC2626'
    return L.divIcon({
        className: '',
        html: `
            <div style="display:flex;flex-direction:column;align-items:center;width:40px;">
                <div style="
                    width:36px;height:36px;
                    background:${bg};
                    border-radius:50%;
                    display:flex;align-items:center;justify-content:center;
                    font-size:18px;line-height:1;
                    border:3px solid #fff;
                    box-shadow:0 3px 8px rgba(0,0,0,0.4);
                ">${emoji}</div>
                <div style="
                    width:0;height:0;
                    border-left:7px solid transparent;
                    border-right:7px solid transparent;
                    border-top:9px solid ${bg};
                    margin-top:-1px;
                "></div>
            </div>
        `,
        iconSize: [40, 47],
        iconAnchor: [20, 47],
        popupAnchor: [0, -50],
    })
}

function coordsIguais(a, b) {
    return Math.abs(a[0] - b[0]) < 0.000001 && Math.abs(a[1] - b[1]) < 0.000001
}

// Junta segmentos de vias em anéis fechados
function montarAneis(segmentos) {
    const aneis = []
    let restantes = segmentos.map(s => [...s])

    while (restantes.length > 0) {
        let anel = [...restantes[0]]
        restantes = restantes.slice(1)

        let mudou = true
        while (mudou) {
            mudou = false
            for (let i = 0; i < restantes.length; i++) {
                const seg = restantes[i]
                const fim = anel[anel.length - 1]
                const ini = anel[0]

                if (coordsIguais(fim, seg[0])) {
                    anel = [...anel, ...seg.slice(1)]
                } else if (coordsIguais(fim, seg[seg.length - 1])) {
                    anel = [...anel, ...[...seg].reverse().slice(1)]
                } else if (coordsIguais(ini, seg[seg.length - 1])) {
                    anel = [...seg, ...anel.slice(1)]
                } else if (coordsIguais(ini, seg[0])) {
                    anel = [...[...seg].reverse(), ...anel.slice(1)]
                } else {
                    continue
                }
                restantes.splice(i, 1)
                mudou = true
                break
            }
        }

        aneis.push(anel)
    }

    return aneis
}

function overpassParaGeoJSON(data) {
    const features = []
    for (const el of data.elements) {
        if (!el.tags?.name || !ehHospital(el.tags.name)) continue

        let geometry = null

        if (el.type === 'way' && el.geometry) {
            geometry = { type: 'Polygon', coordinates: [el.geometry.map(g => [g.lon, g.lat])] }
        } else if (el.type === 'relation' && el.members) {
            const segmentos = el.members
                .filter(m => m.role === 'outer' && m.geometry)
                .map(m => m.geometry.map(g => [g.lon, g.lat]))

            const aneis = montarAneis(segmentos)

            if (aneis.length === 1) {
                geometry = { type: 'Polygon', coordinates: aneis }
            } else if (aneis.length > 1) {
                geometry = { type: 'MultiPolygon', coordinates: aneis.map(r => [r]) }
            }
        }

        if (geometry) {
            features.push({
                type: 'Feature',
                properties: { name: el.tags.name },
                geometry,
            })
        }
    }

    return { type: 'FeatureCollection', features }
}

const bordaStyle = {
    color: '#1565C0',
    weight: 2.5,
    fillColor: '#1976D2',
    fillOpacity: 0.06,
}

/**
 * @param {{ pontos: Array<{ lat: number, lng: number, titulo?: string, descricao?: string, tipo?: string }> }} props
 * tipo: 'Buraco na via' | 'Iluminação' | 'Saneamento' | 'Segurança' | 'Transporte'
 */
export default function MapGoiania({ pontos = [] }) {
    const router = useRouter()
    const [bordaGoiania, setBordaGoiania] = useState(null)
    const [setores, setSetores] = useState(null)
    const overpassBuscado = useRef(false)

    useEffect(() => {
        fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${IBGE_GOIANIA}?formato=application/vnd.geo%2Bjson`)
            .then(r => r.json())
            .then(setBordaGoiania)
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (overpassBuscado.current) return
        overpassBuscado.current = true

        const CACHE_KEY = 'setores_goiania_v1'
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
            setSetores(JSON.parse(cached))
            return
        }

        const query = `
[out:json][timeout:30];
area["name"="Goiânia"]["boundary"="administrative"]->.city;
(
  relation["boundary"="administrative"]["admin_level"~"^(9|10|11)$"](area.city);
);
out geom;`

        fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
        })
            .then(r => r.json())
            .then(data => {
                const geojson = overpassParaGeoJSON(data)
                localStorage.setItem(CACHE_KEY, JSON.stringify(geojson))
                setSetores(geojson)
            })
            .catch(() => {})
    }, [])

    return (
        <MapContainer
            center={GOIANIA_CENTER}
            zoom={GOIANIA_ZOOM}
            minZoom={GOIANIA_MIN_ZOOM}
            maxBounds={GOIANIA_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ width: '100%', height: '100%', borderRadius: '8px' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {bordaGoiania && <GeoJSON data={bordaGoiania} style={bordaStyle} />}

            {setores && (
                <GeoJSON
                    data={setores}
                    style={hospitalStyle}
                    interactive={false}
                />
            )}

            {pontos.map((ponto, index) => (
                <Marker
                    key={index}
                    position={[ponto.lat, ponto.lng]}
                    icon={criarIcone(ponto.tipo, ponto.validado)}
                    eventHandlers={{
                        click: () => ponto.id && router.push(`/ocorrencias/editar/${ponto.id}`)
                    }}
                >
                    {(ponto.titulo || ponto.descricao) && (
                        <Popup>
                            {ponto.titulo && <strong>{ponto.titulo}</strong>}
                            {ponto.descricao && <p style={{ margin: '4px 0 0', fontSize: 12 }}>{ponto.descricao}</p>}
                        </Popup>
                    )}
                </Marker>
            ))}
        </MapContainer>
    )
}
