'use client'
import { useAuth } from "@/hooks/useAuth";
import Nav from "../components/Nav/Nav";
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { PieChart } from '@mui/x-charts/PieChart'
import { BarChart } from '@mui/x-charts/BarChart'
import { useState, useEffect, useMemo } from "react";
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

// Mesmas cores já usadas em /ocorrencias, para manter o padrão visual do app
const STATUS_COLOR = {
    'Pendente':      '#6b7280',
    'Em andamento':  '#2563eb',
    'Resolvido':     '#16a34a',
    'Em análise':    '#7c3aed',
    'Atribuído':     '#d97706',
    'Cancelado':     '#dc2626',
}
const STATUS_LISTA = Object.keys(STATUS_COLOR)

// Mesmas cores usadas nos ícones do mapa (MapGoiania -> ICONES_TIPO)
const TIPO_COLOR = {
    'Buraco na via': '#78350F',
    'Iluminação':    '#D97706',
    'Saneamento':    '#1D4ED8',
    'Segurança':     '#DC2626',
    'Transporte':    '#15803D',
}

export default function dashboard(){

    useAuth({ somenteAdmin: true })
    const [tipoOcorrencia, setTipoOcorrencia] = useState("todas");
    const [ocorrencias, setOcorrencias] = useState([])
    const [loadingMapa, setLoadingMapa] = useState(true)

    useEffect(() => {
        setLoadingMapa(true)
        reports()
            .then(data => {
                const normalizados = data.map(o => ({
                    id: o.problemaid,
                    lat: o.endereco?.latitude ? parseFloat(o.endereco.latitude) : null,
                    lng: o.endereco?.longitude ? parseFloat(o.endereco.longitude) : null,
                    titulo: o.endereco?.rua || o.endereco?.ponto_referencia || '',
                    descricao: o.descricao,
                    tipo: normalizarCategoria(o.categoria),
                    validado: o.validado ?? false,
                    status: o.status || 'Pendente',
                }))
                setOcorrencias(normalizados)
            })
            .catch(err => console.error('Erro ao buscar ocorrências:', err))
            .finally(() => setLoadingMapa(false))
    }, [])

    const ocorrenciasFiltradas = useMemo(() => (
        tipoOcorrencia === "todas"
            ? ocorrencias
            : ocorrencias.filter(o => o.tipo === tipoOcorrencia)
    ), [ocorrencias, tipoOcorrencia])

    const pontosFiltrados = useMemo(() => (
        ocorrenciasFiltradas.filter(p => p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng))
    ), [ocorrenciasFiltradas])

    const total = ocorrenciasFiltradas.length

    const porStatus = useMemo(() => {
        const contagem = {}
        ocorrenciasFiltradas.forEach(o => {
            contagem[o.status] = (contagem[o.status] || 0) + 1
        })
        return STATUS_LISTA
            .map(status => ({ status, cor: STATUS_COLOR[status], qtd: contagem[status] || 0 }))
            .filter(item => item.qtd > 0)
    }, [ocorrenciasFiltradas])

    const porTipo = useMemo(() => {
        const contagem = {}
        ocorrenciasFiltradas.forEach(o => {
            const tipo = o.tipo || 'Outro'
            contagem[tipo] = (contagem[tipo] || 0) + 1
        })
        return Object.keys(TIPO_COLOR)
            .map(tipo => ({ tipo, cor: TIPO_COLOR[tipo], qtd: contagem[tipo] || 0 }))
            .filter(item => item.qtd > 0)
            .sort((a, b) => b.qtd - a.qtd)
    }, [ocorrenciasFiltradas])

    const validadas = ocorrenciasFiltradas.filter(o => o.validado === true).length
    const naoValidadas = total - validadas
    const pctValidadas = total ? Math.round((validadas / total) * 100) : 0
    const maiorTipoQtd = porTipo.length ? Math.max(...porTipo.map(item => item.qtd)) : 0


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

            <div className={styles.dashboardGrid}>
                <div className={styles.mapArea}>
                    {loadingMapa
                        ? <Loading size="large" text="Carregando mapa..." />
                        : (
                            <>
                                <MapGoiania pontos={pontosFiltrados} />

                                <div className={styles.legenda}>
                                    <div className={styles.legendaGrupo}>
                                        <span className={styles.legendaTitulo}>Áreas</span>
                                        <div className={styles.legendaItem}>
                                            <span className={styles.legendaCor} style={{ background: '#E53935', opacity: 0.45 }} />
                                            Hospital próximo
                                        </div>
                                    </div>

                                    <div className={styles.legendaDivisor} />

                                    <div className={styles.legendaGrupo}>
                                        <span className={styles.legendaTitulo}>Tipo de ocorrência</span>
                                        <div className={styles.legendaItem}><span className={styles.legendaIcone}>🕳️</span> Buraco na via</div>
                                        <div className={styles.legendaItem}><span className={styles.legendaIcone}>💡</span> Iluminação</div>
                                        <div className={styles.legendaItem}><span className={styles.legendaIcone}>💧</span> Saneamento</div>
                                        <div className={styles.legendaItem}><span className={styles.legendaIcone}>🚨</span> Segurança</div>
                                        <div className={styles.legendaItem}><span className={styles.legendaIcone}>🚌</span> Transporte</div>
                                    </div>

                                    <div className={styles.legendaDivisor} />

                                    <div className={styles.legendaGrupo}>
                                        <span className={styles.legendaTitulo}>Validação</span>
                                        <div className={styles.legendaItem}><span className={styles.legendaCor} style={{ background: '#DC2626' }} /> Não validada</div>
                                        <div className={styles.legendaItem}><span className={styles.legendaCor} style={{ background: '#15803D' }} /> Validada</div>
                                    </div>
                                </div>
                            </>
                        )
                    }
                </div>

                <div className={styles.sidePanel}>
                    <div className={styles.statCard}>
                        <span className={styles.statCardTitle}>Total de ocorrências</span>
                        <div className={styles.statHeroRow}>
                            <span className={styles.statHero}>{total}</span>
                        </div>
                        <span className={styles.statSub}>
                            {tipoOcorrencia === "todas" ? "Todas as categorias" : tipoOcorrencia}
                        </span>
                    </div>

                    <div className={styles.statCard}>
                        <span className={styles.statCardTitle}>Ocorrências por status</span>
                        {total === 0 ? (
                            <span className={styles.statSub}>Sem dados para exibir.</span>
                        ) : (
                            <div className={styles.donutWrap}>
                                <div className={styles.donutChartBox}>
                                    <PieChart
                                        series={[{
                                            data: porStatus.map(item => ({ id: item.status, value: item.qtd, label: item.status, color: item.cor })),
                                            innerRadius: 28,
                                            outerRadius: 44,
                                            paddingAngle: 2,
                                            cornerRadius: 3,
                                        }]}
                                        width={96}
                                        height={96}
                                        hideLegend
                                        margin={{ top: 4, bottom: 4, left: 4, right: 4 }}
                                    />
                                    <div className={styles.donutCenter}>
                                        <span className={styles.donutHoleValue}>{total}</span>
                                        <span className={styles.donutHoleLabel}>Total</span>
                                    </div>
                                </div>
                                <div className={styles.donutLegend}>
                                    {porStatus.map(item => (
                                        <div className={styles.donutLegendRow} key={item.status}>
                                            <span className={styles.donutDot} style={{ background: item.cor }} />
                                            <span className={styles.donutLegendNome}>{item.status}</span>
                                            <span className={styles.donutLegendCount}>
                                                {item.qtd} ({total ? Math.round((item.qtd / total) * 100) : 0}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.statCard}>
                        <span className={styles.statCardTitle}>Ocorrências por tipo</span>
                        {porTipo.length === 0 ? (
                            <span className={styles.statSub}>Sem dados para exibir.</span>
                        ) : (
                            <div className={styles.barItemsList}>
                                {porTipo.map(item => (
                                    <div className={styles.barItemRow} key={item.tipo}>
                                        <div className={styles.barItemHead}>
                                            <span>{item.tipo}</span>
                                            <b>{item.qtd}</b>
                                        </div>
                                        <BarChart
                                            layout="horizontal"
                                            xAxis={[{ min: 0, max: maiorTipoQtd, position: 'none' }]}
                                            yAxis={[{ scaleType: 'band', data: [''], position: 'none' }]}
                                            series={[{ data: [item.qtd], color: item.cor }]}
                                            borderRadius={4}
                                            height={14}
                                            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                                            hideLegend
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.statCard}>
                        <span className={styles.statCardTitle}>Validadas vs pendentes</span>
                        <div className={styles.statHeroRow}>
                            <span className={styles.statHero}>{pctValidadas}%</span>
                            <span className={styles.statHeroBadge}>{validadas} validadas</span>
                        </div>
                        {total === 0 ? (
                            <span className={styles.statSub}>Sem dados para exibir.</span>
                        ) : (
                            <BarChart
                                layout="horizontal"
                                yAxis={[{ scaleType: 'band', data: [''], position: 'none', categoryGapRatio: 0.75 }]}
                                xAxis={[{ min: 0, max: total, position: 'none' }]}
                                series={[
                                    { data: [validadas], label: 'Validadas', color: '#15803D', stack: 'total' },
                                    { data: [naoValidadas], label: 'Não validadas', color: '#DC2626', stack: 'total' },
                                ]}
                                borderRadius={3}
                                height={44}
                                margin={{ left: 4, right: 4, top: 4, bottom: 4 }}
                                slotProps={{ legend: { direction: 'row', position: { vertical: 'bottom', horizontal: 'middle' } } }}
                            />
                        )}
                    </div>
                </div>
            </div>

        </main>

        </div>

    );
}
