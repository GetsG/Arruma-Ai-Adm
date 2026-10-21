'use client'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRouter } from 'next/navigation'
import styles from './MapGoiania.module.css'

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

// Mesmas cores usadas em /ocorrencias e no dashboard
const STATUS_COLOR = {
    'Pendente':      '#6b7280',
    'Em andamento':  '#2563eb',
    'Resolvido':     '#16a34a',
    'Em análise':    '#7c3aed',
    'Atribuído':     '#d97706',
    'Cancelado':     '#dc2626',
}

// Remove acentos para comparação
function normalizar(str) {
    return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

// confere se o nome do setor está na lista dos que têm hospital perto
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

// monta o ícone do marcador: emoji conforme a categoria, cor conforme validado ou não
function criarIcone(tipo, validado) {
    const { emoji } = ICONES_TIPO[tipo] || { emoji: '📍' }
    const bg = validado === true ? '#15803D' : '#DC2626'
    return L.divIcon({
        className: '',
        html: `
            <div style="display:flex;flex-direction:column;align-items:center;width:26px;">
                <div style="
                    width:22px;height:22px;
                    background:${bg};
                    border-radius:50%;
                    display:flex;align-items:center;justify-content:center;
                    font-size:11px;line-height:1;
                    border:2px solid #fff;
                    box-shadow:0 2px 5px rgba(0,0,0,0.4);
                ">${emoji}</div>
                <div style="
                    width:0;height:0;
                    border-left:4px solid transparent;
                    border-right:4px solid transparent;
                    border-top:6px solid ${bg};
                    margin-top:-1px;
                "></div>
            </div>
        `,
        iconSize: [26, 30],
        iconAnchor: [13, 30],
        popupAnchor: [0, -32],
    })
}

// compara duas coordenadas com uma margem de erro pequena (ponto flutuante não bate exato)
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

// transforma a resposta da Overpass API (OpenStreetMap) no formato GeoJSON que o mapa entende
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

// componente "invisível" só pra escutar clique no mapa e devolver a coordenada
function CapturaClique({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

/**
 * @param {{ pontos: Array<{ lat: number, lng: number, titulo?: string, descricao?: string, tipo?: string }>, onMapClick?: (lat: number, lng: number) => void }} props
 * tipo: 'Buraco na via' | 'Iluminação' | 'Saneamento' | 'Segurança' | 'Transporte'
 * onMapClick: quando informado, clicar no mapa retorna a coordenada clicada (usado para selecionar localização)
 */
export default function MapGoiania({ pontos = [], onMapClick }) {
    const router = useRouter()
    const [bordaGoiania, setBordaGoiania] = useState(null)
    const [setores, setSetores] = useState(null)
    const overpassBuscado = useRef(false)

    // busca o contorno do município direto na API do IBGE
    useEffect(() => {
        fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${IBGE_GOIANIA}?formato=application/vnd.geo%2Bjson`)
            .then(r => r.json())
            .then(setBordaGoiania)
            .catch(() => {})
    }, [])

    // busca os setores com hospital via Overpass e guarda em cache local (consulta é pesada e não muda)
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
            style={{ width: '100%', height: '100%', borderRadius: '8px', cursor: onMapClick ? 'crosshair' : '' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {onMapClick && <CapturaClique onMapClick={onMapClick} />}

            {bordaGoiania && <GeoJSON data={bordaGoiania} style={bordaStyle} interactive={false} />}

            {setores && (
                <GeoJSON
                    data={setores}
                    style={hospitalStyle}
                    interactive={false}
                />
            )}

            {/* um marcador por ocorrência, com popup de detalhes ao clicar */}
            {pontos.map((ponto, index) => {
                const icone = ICONES_TIPO[ponto.tipo]
                const corStatus = STATUS_COLOR[ponto.status] || STATUS_COLOR['Pendente']
                return (
                    <Marker
                        key={index}
                        position={[ponto.lat, ponto.lng]}
                        icon={criarIcone(ponto.tipo, ponto.validado)}
                    >
                        <Popup className={styles.popup} minWidth={240} maxWidth={240}>
                            <div className={styles.card}>
                                <div className={styles.header}>
                                    {icone && <span className={styles.tipoIcone}>{icone.emoji}</span>}
                                    <span className={styles.tipoNome}>{ponto.tipo || 'Ocorrência'}</span>
                                    <span
                                        className={styles.validadoBadge}
                                        style={{
                                            color: ponto.validado ? '#15803D' : '#DC2626',
                                            background: ponto.validado ? '#DCFCE7' : '#FEE2E2',
                                        }}
                                    >
                                        {ponto.validado ? 'Validada' : 'Não validada'}
                                    </span>
                                </div>

                                {ponto.titulo && <p className={styles.titulo}>{ponto.titulo}</p>}
                                {ponto.descricao && <p className={styles.descricao}>{ponto.descricao}</p>}
                                {ponto.status && (
                                    <span className={styles.statusChip} style={{ color: corStatus }}>
                                        {ponto.status}
                                    </span>
                                )}

                                {ponto.id && (
                                    <button
                                        type="button"
                                        className={styles.botao}
                                        onClick={() => router.push(`/ocorrencias/editar/${ponto.id}`)}
                                    >
                                        Ver mais detalhes →
                                    </button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                )
            })}
        </MapContainer>
    )
}
