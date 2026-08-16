'use client'
import { useAuth } from "@/hooks/useAuth";
import Nav from "../components/Nav/Nav";
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { useState, useEffect } from "react";
import styles from "./page.module.css"
import { selectSx } from "../styles/selectSX";
import MapGoiania from "../components/Map/MapGoianiaWrapper";
import { reports } from "../services/reports";
import Loading from "../components/Loading/Loading";

const MAPA_CATEGORIAS = {
    'buraco na via':  'Buraco na via',
    'buraco na rua':  'Buraco na via',
    'iluminação':     'Iluminação',
    'iluminacao':     'Iluminação',
    'saneamento':     'Saneamento',
    'segurança':      'Segurança',
    'seguranca':      'Segurança',
    'transporte':     'Transporte',
}

function normalizarCategoria(categoria) {
    if (!categoria) return null
    return MAPA_CATEGORIAS[categoria.toLowerCase()] ?? null
}


export default function dashboard(){

    useAuth()
    const [tipoOcorrencia, setTipoOcorrencia] = useState("todas");
    const [pontosMapa, setPontosMapa] = useState([])
    const [loadingMapa, setLoadingMapa] = useState(true)

    useEffect(() => {
        setLoadingMapa(true)
        reports()
            .then(data => {
                const pontos = data
                    .filter(o => o.endereco?.latitude && o.endereco?.longitude)
                    .map(o => ({
                        id: o.problemaid,
                        lat: parseFloat(o.endereco.latitude),
                        lng: parseFloat(o.endereco.longitude),
                        titulo: o.endereco.rua || o.endereco.ponto_referencia || '',
                        descricao: o.descricao,
                        tipo: normalizarCategoria(o.categoria),
                        validado: o.validado ?? false,
                    }))
                    .filter(p => !isNaN(p.lat) && !isNaN(p.lng))
                setPontosMapa(pontos)
            })
            .catch(err => console.error('Erro ao buscar ocorrências:', err))
            .finally(() => setLoadingMapa(false))
    }, [])

    const pontosFiltrados = tipoOcorrencia === "todas"
        ? pontosMapa
        : pontosMapa.filter(p => p.tipo === tipoOcorrencia)

    return(

        <div className={styles.container}>

        <Nav tela="dashboard"/>

        <main>

            <div className={styles.titleDescription}>
                <h2>Dashboard</h2>
                <p>Visão geral da cidade em tempo real. Gerencia ocorrências, prioridades e equipes com mais eficiência.</p>
            </div>

            <div className={styles.selects}>
                <FormControl sx={selectSx}>
                    <InputLabel>Tipo de ocorrência</InputLabel>
                    <Select label="Tipo de ocorrência" value={tipoOcorrencia} onChange={(e) => setTipoOcorrencia(e.target.value)}>
                        <MenuItem value="todas">Todas</MenuItem>
                        <MenuItem value="Buraco na via">Buraco na via</MenuItem>
                        <MenuItem value="Iluminação">Iluminação</MenuItem>
                        <MenuItem value="Saneamento">Saneamento</MenuItem>
                        <MenuItem value="Segurança">Segurança</MenuItem>
                        <MenuItem value="Transporte">Transporte</MenuItem>
                    </Select>
                </FormControl>
            </div>

            <div className={styles.mapContainer}>
                {loadingMapa
                    ? <Loading size="large" text="Carregando mapa..." />
                    : <MapGoiania pontos={pontosFiltrados} />
                }
            </div>

            <div className={styles.legenda}>
                <div className={styles.legendaGrupo}>
                    <span className={styles.legendaTitulo}>Áreas</span>
                    <div className={styles.legendaItem}>
                        <span className={styles.legendaCor} style={{ background: '#E53935', opacity: 0.45 }} />
                        Setor com hospital próximo
                    </div>
                </div>

                <div className={styles.legendaDivisor} />

                <div className={styles.legendaGrupo}>
                    <span className={styles.legendaTitulo}>Tipo de ocorrência</span>
                    <div className={styles.legendaItem}><span className={styles.legendaIcone} style={{ background: '#DC2626' }}>🕳️</span> Buraco na via</div>
                    <div className={styles.legendaItem}><span className={styles.legendaIcone} style={{ background: '#DC2626' }}>💡</span> Iluminação</div>
                    <div className={styles.legendaItem}><span className={styles.legendaIcone} style={{ background: '#DC2626' }}>💧</span> Saneamento</div>
                    <div className={styles.legendaItem}><span className={styles.legendaIcone} style={{ background: '#DC2626' }}>🚨</span> Segurança</div>
                    <div className={styles.legendaItem}><span className={styles.legendaIcone} style={{ background: '#DC2626' }}>🚌</span> Transporte</div>
                </div>

                <div className={styles.legendaDivisor} />

                <div className={styles.legendaGrupo}>
                    <span className={styles.legendaTitulo}>Validação</span>
                    <div className={styles.legendaItem}><span className={styles.legendaCor} style={{ background: '#DC2626' }} /> Não validada</div>
                    <div className={styles.legendaItem}><span className={styles.legendaCor} style={{ background: '#15803D' }} /> Validada</div>
                </div>
            </div>

        </main>

        </div>

    );
}
