"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart as GraficoBarras } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
import Nav from "../components/Nav/Nav"
import { useAuth } from "@/hooks/useAuth"
import { categories } from "../services/category"
import {
    relatorioKpis,
    relatorioAbertasResolvidas,
    relatorioSlaCategoria,
    relatorioFunil,
    relatorioTempoResolucao,
    relatorioOsPrazo,
    relatorioCargaPrestadores,
} from "../services/relatorios"
import styles from "./page.module.css"
import Image from "next/image"

import Arrow from "../../../public/arrow.png"
import Papel from "../../../public/papel.png"
import BarChart from "../../../public/barchart.png"
import Shield from "../../../public/shield.png"
import Dunger from "../../../public/dunger.png"
import Log from "../../../public/log.png"
import Timer from "../../../public/timer.png"
import Equipe from "../../../public/equipe.png"

// um card por relatório — cada um busca só o próprio endpoint quando é aberto
const TIPOS_RELATORIO = [
    {
        chave: 'kpis',
        titulo: 'Indicadores principais (KPIs)',
        descricao: 'Ocorrências abertas, resolvidas, % no prazo, tempo médio de resolução e O.S. sem prestador.',
        icone: Papel,
    },
    {
        chave: 'abertas-resolvidas',
        titulo: 'Abertas x Resolvidas por semana',
        descricao: 'Evolução semanal de ocorrências abertas e resolvidas, com o backlog acumulado.',
        icone: BarChart,
    },
    {
        chave: 'sla-categoria',
        titulo: 'SLA por categoria',
        descricao: 'Proporção de ocorrências no prazo, perto de vencer e atrasadas, por categoria.',
        icone: Shield,
    },
    {
        chave: 'funil',
        titulo: 'Funil do processo',
        descricao: 'Da ocorrência aberta até a conclusão, com os gargalos entre etapas.',
        icone: Dunger,
    },
    {
        chave: 'tempo-resolucao',
        titulo: 'Tempo de resolução por categoria',
        descricao: 'Boxplot do tempo entre abertura e resolução das ocorrências, por categoria.',
        icone: Log,
    },
    {
        chave: 'os-prazo',
        titulo: 'O.S. por prazo',
        descricao: 'Ordens de serviço em aberto, ordenadas da mais urgente para a menos urgente.',
        icone: Timer,
    },
    {
        chave: 'carga-prestadores',
        titulo: 'Carga dos prestadores',
        descricao: 'Quantidade de O.S. em aberto e concluídas por prestador, e quem está sobrecarregado.',
        icone: Equipe,
    },
]

// quais filtros fazem sentido pra cada relatório (os dois últimos só aceitam categoria na API)
const FILTROS_POR_RELATORIO = {
    kpis: ['categoria', 'bairro', 'periodo'],
    'abertas-resolvidas': ['categoria', 'bairro', 'periodo'],
    'sla-categoria': ['categoria', 'bairro', 'periodo'],
    funil: ['categoria', 'bairro', 'periodo'],
    'tempo-resolucao': ['categoria', 'bairro', 'periodo'],
    'os-prazo': ['categoria'],
    'carga-prestadores': ['categoria'],
}

// ordem fixa dos cards de KPI, cada um com a cor da sparkline
const KPI_ORDEM = [
    { chave: 'ocorrencias_abertas', cor: '#2563eb' },
    { chave: 'ocorrencias_resolvidas', cor: '#16a34a' },
    { chave: 'percentual_no_prazo', cor: '#7c3aed' },
    { chave: 'tempo_medio_resolucao_horas', cor: '#d97706' },
    { chave: 'os_sem_prestador', cor: '#dc2626' },
]

const TENDENCIA_COR = { melhorou: '#16a34a', piorou: '#dc2626', estavel: '#6b7280' }

const NIVEL_COR = {
    vencida: '#dc2626',
    critica: '#ea580c',
    atencao: '#d97706',
    no_prazo: '#16a34a',
    sem_prazo: '#6b7280',
}

const NIVEL_LABEL = {
    vencida: 'Vencida',
    critica: 'Crítica',
    atencao: 'Atenção',
    no_prazo: 'No prazo',
    sem_prazo: 'Sem prazo',
}

const SITUACAO_COR = { ocioso: '#16a34a', normal: '#2563eb', sobrecarregado: '#dc2626' }

const DISTRIBUICAO_LABEL = {
    equilibrada: 'Equilibrada',
    moderada: 'Moderada',
    desequilibrada: 'Desequilibrada',
    sem_carga: 'Sem carga',
}

// formata o valor do KPI conforme a unidade que a API manda
function formatarValorKpi(kpi) {
    if (kpi?.valor == null) return '—'
    if (kpi.unidade === 'percentual') return `${kpi.valor.toFixed(1)}%`
    if (kpi.unidade === 'horas') return `${kpi.valor.toFixed(1)}h`
    return String(Math.round(kpi.valor))
}

// "-5h atrasada" ou "32h restantes" — passa pra dias quando é bastante tempo
function formatarHorasRestantes(os) {
    if (os.horas_restantes == null) return NIVEL_LABEL[os.nivel] || '—'
    const horas = Math.abs(os.horas_restantes)
    const texto = horas < 48 ? `${Math.round(horas)}h` : `${Math.round(horas / 24)}d`
    return os.horas_restantes < 0 ? `${texto} atrasada` : `${texto} restantes`
}

// tela de relatórios: um card por indicador, cada um consumindo o próprio endpoint da API
export default function Relatorios() {
    useAuth({ somenteAdmin: true })
    const router = useRouter()

    const [relatorioAtivo, setRelatorioAtivo] = useState(null)

    // filtros compartilhados (nem todo relatório aceita todos — ver FILTROS_POR_RELATORIO)
    const [categoriasLista, setCategoriasLista] = useState([])
    const [filtroCategoriaId, setFiltroCategoriaId] = useState('')
    const [filtroBairro, setFiltroBairro] = useState('')
    const [filtroDias, setFiltroDias] = useState(30)

    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState(null)

    const [kpis, setKpis] = useState(null)
    const [abertasResolvidas, setAbertasResolvidas] = useState(null)
    const [slaCategoria, setSlaCategoria] = useState(null)
    const [funil, setFunil] = useState(null)
    const [tempoResolucao, setTempoResolucao] = useState(null)
    const [osPrazo, setOsPrazo] = useState(null)
    const [cargaPrestadores, setCargaPrestadores] = useState(null)

    // categorias pro filtro
    useEffect(() => {
        categories().then(lista => setCategoriasLista(lista || [])).catch(() => {})
    }, [])

    // busca só o relatório da aba aberta, com os filtros atuais de categoria/bairro/período
    function carregarRelatorioAtivo(chave) {
        if (!chave) return
        setCarregando(true)
        setErro(null)

        const hoje = new Date()
        const inicioPeriodo = new Date(hoje)
        inicioPeriodo.setDate(inicioPeriodo.getDate() - Number(filtroDias))
        const dataInicio = inicioPeriodo.toISOString().slice(0, 10)
        const dataFim = hoje.toISOString().slice(0, 10)
        const semanas = Math.max(1, Math.ceil(Number(filtroDias) / 7))
        const filtroBase = { categoriaid: filtroCategoriaId || undefined, bairro: filtroBairro || undefined }

        const buscas = {
            'kpis': () => relatorioKpis({ ...filtroBase, dias: filtroDias }).then(setKpis),
            'abertas-resolvidas': () => relatorioAbertasResolvidas({ ...filtroBase, semanas }).then(setAbertasResolvidas),
            'sla-categoria': () => relatorioSlaCategoria({ ...filtroBase, data_inicio: dataInicio, data_fim: dataFim }).then(setSlaCategoria),
            'funil': () => relatorioFunil({ ...filtroBase, data_inicio: dataInicio, data_fim: dataFim }).then(setFunil),
            'tempo-resolucao': () => relatorioTempoResolucao({ ...filtroBase, data_inicio: dataInicio, data_fim: dataFim }).then(setTempoResolucao),
            'os-prazo': () => relatorioOsPrazo({ categoriaid: filtroCategoriaId || undefined }).then(setOsPrazo),
            'carga-prestadores': () => relatorioCargaPrestadores({ categoriaid: filtroCategoriaId || undefined }).then(setCargaPrestadores),
        }

        buscas[chave]()
            .catch(err => {
                console.error('Erro ao buscar relatório:', err)
                setErro('Não foi possível carregar o relatório. Tente novamente.')
            })
            .finally(() => setCarregando(false))
    }

    // toda vez que troca de aba, busca os dados dela com os filtros que já estiverem definidos
    useEffect(() => {
        if (relatorioAtivo) carregarRelatorioAtivo(relatorioAtivo)
    }, [relatorioAtivo])

    // junta "geral" + cada categoria num só array pro boxplot, com uma escala comum
    const boxplotDados = useMemo(() => {
        if (!tempoResolucao) return []
        return [
            tempoResolucao.geral ? { categoria: 'Geral (todas as categorias)', ...tempoResolucao.geral } : null,
            ...(tempoResolucao.data || []),
        ].filter(Boolean)
    }, [tempoResolucao])

    const boxplotMax = useMemo(() => (
        boxplotDados.length > 0 ? Math.max(...boxplotDados.map(b => b.maximo)) : 0
    ), [boxplotDados])

    const filtrosAtivos = FILTROS_POR_RELATORIO[relatorioAtivo] || []

    return (
        <div className={styles.container}>

            <Nav tela="relatorios" />

            <main>

                <div className={styles.titleDescription}>
                    <h2>Relatórios</h2>
                    <p>Indicadores operacionais do sistema, calculados em tempo real pela API.</p>
                </div>

                <h3 className={styles.tittleTypesReports}>Tipos de relatório</h3>

                {/* clica num card pra abrir o relatório correspondente */}
                <div className={styles.containerReport}>
                    {TIPOS_RELATORIO.map(tipo => (
                        <button
                            key={tipo.chave}
                            className={`${styles.reportTypes} ${relatorioAtivo === tipo.chave ? styles.reportTypesAtivo : ''}`}
                            onClick={() => setRelatorioAtivo(prev => prev === tipo.chave ? null : tipo.chave)}
                        >
                            <div className={styles.reports}>
                                <Image className={styles.imageReport} src={tipo.icone} alt={tipo.titulo} />
                                <div>
                                    <h3>{tipo.titulo}</h3>
                                    <p>{tipo.descricao}</p>
                                </div>
                            </div>
                            <Image className={styles.imageArrow} src={Arrow} alt="seta" />
                        </button>
                    ))}
                </div>

                {relatorioAtivo && (
                    <div className={styles.resultado}>

                        <div className={styles.resultadoHeader}>
                            <h3>{TIPOS_RELATORIO.find(t => t.chave === relatorioAtivo)?.titulo}</h3>
                        </div>

                        {/* só mostra os filtros que esse relatório realmente aceita */}
                        <div className={styles.filtrosRelatorio}>
                            {filtrosAtivos.includes('categoria') && (
                                <div className={styles.campoFiltro}>
                                    <label>Categoria</label>
                                    <select value={filtroCategoriaId} onChange={e => setFiltroCategoriaId(e.target.value)}>
                                        <option value="">Todas</option>
                                        {categoriasLista.map(c => (
                                            <option key={c.categoriaid} value={c.categoriaid}>{c.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {filtrosAtivos.includes('bairro') && (
                                <div className={styles.campoFiltro}>
                                    <label>Bairro</label>
                                    <input
                                        type="text"
                                        value={filtroBairro}
                                        onChange={e => setFiltroBairro(e.target.value)}
                                        placeholder="Ex.: Setor Bueno"
                                    />
                                </div>
                            )}
                            {filtrosAtivos.includes('periodo') && (
                                <div className={styles.campoFiltro}>
                                    <label>Período</label>
                                    <select value={filtroDias} onChange={e => setFiltroDias(Number(e.target.value))}>
                                        <option value={7}>Últimos 7 dias</option>
                                        <option value={30}>Últimos 30 dias</option>
                                        <option value={90}>Últimos 90 dias</option>
                                        <option value={180}>Últimos 180 dias</option>
                                    </select>
                                </div>
                            )}
                            <button className={styles.btnExportar} onClick={() => carregarRelatorioAtivo(relatorioAtivo)} disabled={carregando}>
                                {carregando ? 'Atualizando...' : '🔄 Aplicar filtros'}
                            </button>
                        </div>

                        {erro && <p className={styles.semDados}>{erro}</p>}

                        {carregando ? (
                            <p className={styles.carregando}>Carregando...</p>
                        ) : (
                            <>
                                {/* Gráfico 1: KPIs com sparkline */}
                                {relatorioAtivo === 'kpis' && (
                                    <div className={styles.kpiGrid}>
                                        {KPI_ORDEM.map(({ chave, cor }) => {
                                            const kpi = kpis?.data?.[chave]
                                            if (!kpi) return null
                                            return (
                                                <div key={chave} className={styles.kpiCard}>
                                                    <span className={styles.kpiTitulo}>{kpi.titulo}</span>
                                                    <span className={styles.kpiValor}>{formatarValorKpi(kpi)}</span>
                                                    {kpi.variacao_pct != null && (
                                                        <span className={styles.kpiVariacao} style={{ color: TENDENCIA_COR[kpi.tendencia] || '#6b7280' }}>
                                                            {kpi.variacao_pct > 0 ? '+' : ''}{kpi.variacao_pct.toFixed(0)}% vs. período anterior
                                                        </span>
                                                    )}
                                                    {kpi.serie?.length > 0 && (
                                                        <SparkLineChart
                                                            data={kpi.serie.map(p => p.valor ?? 0)}
                                                            height={36}
                                                            color={cor}
                                                            area
                                                            showHighlight={false}
                                                            showTooltip={false}
                                                        />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Gráfico 2: abertas x resolvidas por semana */}
                                {relatorioAtivo === 'abertas-resolvidas' && (
                                    <>
                                        {abertasResolvidas?.resumo && (
                                            <div className={styles.resumoCards}>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor}>{abertasResolvidas.resumo.total_abertas}</span>
                                                    <span className={styles.resumoLabel}>Abertas no período</span>
                                                </div>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor}>{abertasResolvidas.resumo.total_resolvidas}</span>
                                                    <span className={styles.resumoLabel}>Resolvidas no período</span>
                                                </div>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor}>{abertasResolvidas.resumo.backlog_atual}</span>
                                                    <span className={styles.resumoLabel}>Backlog atual</span>
                                                </div>
                                                {abertasResolvidas.resumo.taxa_resolucao_pct != null && (
                                                    <div className={styles.resumoCard}>
                                                        <span className={styles.resumoValor}>{abertasResolvidas.resumo.taxa_resolucao_pct.toFixed(0)}%</span>
                                                        <span className={styles.resumoLabel}>Taxa de resolução</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {abertasResolvidas?.data?.length > 0 ? (
                                            <LineChart
                                                height={260}
                                                xAxis={[{
                                                    scaleType: 'point',
                                                    data: abertasResolvidas.data.map(s => new Date(s.semana_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
                                                }]}
                                                series={[
                                                    { data: abertasResolvidas.data.map(s => s.abertas), label: 'Abertas', color: '#dc2626' },
                                                    { data: abertasResolvidas.data.map(s => s.resolvidas), label: 'Resolvidas', color: '#16a34a' },
                                                ]}
                                                margin={{ left: 40, right: 20, top: 20, bottom: 30 }}
                                            />
                                        ) : <p className={styles.semDados}>Sem dados no período.</p>}
                                    </>
                                )}

                                {/* Gráfico 6: SLA por categoria */}
                                {relatorioAtivo === 'sla-categoria' && (
                                    <>
                                        {slaCategoria?.resumo && (
                                            <div className={styles.resumoCards}>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor} style={{ color: '#16a34a' }}>{slaCategoria.resumo.no_prazo}</span>
                                                    <span className={styles.resumoLabel}>No prazo</span>
                                                </div>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor} style={{ color: '#d97706' }}>{slaCategoria.resumo.perto_de_vencer}</span>
                                                    <span className={styles.resumoLabel}>Perto de vencer</span>
                                                </div>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor} style={{ color: '#dc2626' }}>{slaCategoria.resumo.atrasadas}</span>
                                                    <span className={styles.resumoLabel}>Atrasadas</span>
                                                </div>
                                                {slaCategoria.resumo.categoria_mais_critica && (
                                                    <div className={styles.resumoCard}>
                                                        <span className={styles.resumoValor}>{slaCategoria.resumo.categoria_mais_critica.categoria}</span>
                                                        <span className={styles.resumoLabel}>
                                                            Categoria mais crítica ({slaCategoria.resumo.categoria_mais_critica.percentual_atrasadas.toFixed(0)}% atrasada)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {slaCategoria?.data?.length > 0 ? (
                                            <GraficoBarras
                                                layout="horizontal"
                                                height={Math.max(160, slaCategoria.data.length * 42)}
                                                yAxis={[{ scaleType: 'band', data: slaCategoria.data.map(c => c.categoria) }]}
                                                series={[
                                                    { data: slaCategoria.data.map(c => c.no_prazo), label: 'No prazo', color: '#16a34a', stack: 'total' },
                                                    { data: slaCategoria.data.map(c => c.perto_de_vencer), label: 'Perto de vencer', color: '#d97706', stack: 'total' },
                                                    { data: slaCategoria.data.map(c => c.atrasadas), label: 'Atrasadas', color: '#dc2626', stack: 'total' },
                                                ]}
                                                margin={{ left: 110, right: 20, top: 10, bottom: 30 }}
                                            />
                                        ) : <p className={styles.semDados}>Sem dados no período.</p>}
                                    </>
                                )}

                                {/* Gráfico 7: funil do processo da ocorrência */}
                                {relatorioAtivo === 'funil' && (
                                    <>
                                        {funil?.gargalos?.maior_perda && (
                                            <p className={styles.funilAviso}>
                                                ⚠️ Maior perda entre etapas: <strong>{funil.gargalos.maior_perda.titulo}</strong>
                                                {' '}({funil.gargalos.maior_perda.percentual_etapa_anterior.toFixed(0)}% da etapa anterior)
                                            </p>
                                        )}
                                        {funil?.data?.length > 0 ? (
                                            <div className={styles.funil}>
                                                {funil.data.map((etapa, i) => (
                                                    <div key={etapa.etapa} className={styles.funilEtapa}>
                                                        <div className={styles.funilBarraWrap}>
                                                            <div
                                                                className={styles.funilBarra}
                                                                style={{
                                                                    width: `${Math.max(8, etapa.percentual_do_total ?? 100)}%`,
                                                                    background: funil.gargalos?.maior_perda?.etapa === etapa.etapa ? '#dc2626' : '#2d7a3a',
                                                                }}
                                                            >
                                                                {etapa.quantidade}
                                                            </div>
                                                        </div>
                                                        <div className={styles.funilInfo}>
                                                            <span className={styles.funilTitulo}>{etapa.titulo}</span>
                                                            <span className={styles.funilSub}>
                                                                {etapa.percentual_do_total != null && `${etapa.percentual_do_total.toFixed(0)}% do total`}
                                                                {i > 0 && etapa.percentual_etapa_anterior != null && ` • ${etapa.percentual_etapa_anterior.toFixed(0)}% da etapa anterior`}
                                                                {etapa.horas_desde_etapa_anterior != null && ` • ${etapa.horas_desde_etapa_anterior.toFixed(0)}h de espera média`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className={styles.semDados}>Sem dados no período.</p>}
                                    </>
                                )}

                                {/* Gráfico 8: boxplot do tempo de resolução por categoria */}
                                {relatorioAtivo === 'tempo-resolucao' && (
                                    boxplotDados.length > 0 ? (
                                        <div className={styles.boxplotLista}>
                                            {boxplotDados.map(b => {
                                                const escala = v => boxplotMax > 0 ? (v / boxplotMax) * 100 : 0
                                                return (
                                                    <div key={b.categoria} className={styles.boxplotRow}>
                                                        <div className={styles.boxplotLabel}>
                                                            <span>{b.categoria}</span>
                                                            <span className={styles.boxplotMediana}>mediana {b.mediana.toFixed(1)}h ({b.quantidade})</span>
                                                        </div>
                                                        <div className={styles.boxplotTrack}>
                                                            <div
                                                                className={styles.boxplotWhisker}
                                                                style={{ left: `${escala(b.whisker_inferior)}%`, width: `${escala(b.whisker_superior) - escala(b.whisker_inferior)}%` }}
                                                            />
                                                            <div
                                                                className={styles.boxplotCaixa}
                                                                style={{ left: `${escala(b.q1)}%`, width: `${escala(b.q3) - escala(b.q1)}%` }}
                                                            />
                                                            <div className={styles.boxplotMedianaLinha} style={{ left: `${escala(b.mediana)}%` }} />
                                                            {b.outliers?.map(o => (
                                                                <div
                                                                    key={o.problemaid}
                                                                    className={styles.boxplotOutlier}
                                                                    style={{ left: `${escala(o.horas)}%` }}
                                                                    title={`Ocorrência #${o.problemaid} — ${o.horas.toFixed(0)}h (clique pra abrir)`}
                                                                    onClick={() => router.push(`/ocorrencias/editar/${o.problemaid}`)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : <p className={styles.semDados}>Sem dados suficientes no período.</p>
                                )}

                                {/* Gráfico 9: O.S. em aberto por prazo */}
                                {relatorioAtivo === 'os-prazo' && (
                                    <>
                                        {osPrazo?.resumo && (
                                            <div className={styles.resumoCards}>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor}>{osPrazo.resumo.total_em_aberto}</span>
                                                    <span className={styles.resumoLabel}>Em aberto</span>
                                                </div>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor} style={{ color: NIVEL_COR.vencida }}>{osPrazo.resumo.vencidas}</span>
                                                    <span className={styles.resumoLabel}>Vencidas</span>
                                                </div>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor} style={{ color: NIVEL_COR.critica }}>{osPrazo.resumo.criticas}</span>
                                                    <span className={styles.resumoLabel}>Críticas (24h)</span>
                                                </div>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor} style={{ color: NIVEL_COR.atencao }}>{osPrazo.resumo.atencao}</span>
                                                    <span className={styles.resumoLabel}>Atenção (72h)</span>
                                                </div>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor} style={{ color: NIVEL_COR.no_prazo }}>{osPrazo.resumo.no_prazo}</span>
                                                    <span className={styles.resumoLabel}>No prazo</span>
                                                </div>
                                            </div>
                                        )}
                                        {osPrazo?.data?.length > 0 ? (
                                            <div className={styles.listaPrazo}>
                                                {osPrazo.data.map(os => (
                                                    <div key={os.idordem} className={styles.prazoItem} style={{ borderLeftColor: NIVEL_COR[os.nivel] }}>
                                                        <div className={styles.prazoInfo}>
                                                            <span className={styles.prazoTitulo}>{os.titulo_os}</span>
                                                            <span className={styles.prazoSub}>{os.categoria} • {os.prestador_nome || 'sem prestador'}</span>
                                                        </div>
                                                        <span
                                                            className={styles.prazoBadge}
                                                            style={{ color: NIVEL_COR[os.nivel], background: `${NIVEL_COR[os.nivel]}18` }}
                                                        >
                                                            {formatarHorasRestantes(os)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className={styles.semDados}>Nenhuma O.S. em aberto.</p>}
                                    </>
                                )}

                                {/* Gráfico 10: carga de trabalho por prestador */}
                                {relatorioAtivo === 'carga-prestadores' && (
                                    <>
                                        {cargaPrestadores?.resumo && (
                                            <div className={styles.resumoCards}>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor}>{cargaPrestadores.resumo.total_prestadores}</span>
                                                    <span className={styles.resumoLabel}>Prestadores ativos</span>
                                                </div>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor}>{cargaPrestadores.resumo.media_os_em_aberto?.toFixed(1)}</span>
                                                    <span className={styles.resumoLabel}>Média OS em aberto</span>
                                                </div>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor}>{cargaPrestadores.resumo.ociosos}</span>
                                                    <span className={styles.resumoLabel}>Ociosos</span>
                                                </div>
                                                <div className={styles.resumoCard}>
                                                    <span className={styles.resumoValor}>{DISTRIBUICAO_LABEL[cargaPrestadores.resumo.distribuicao] || '—'}</span>
                                                    <span className={styles.resumoLabel}>Distribuição da carga</span>
                                                </div>
                                            </div>
                                        )}
                                        {cargaPrestadores?.data?.length > 0 ? (
                                            <div className={styles.barItemsList}>
                                                {cargaPrestadores.data.map(p => {
                                                    const maxAberto = Math.max(1, ...cargaPrestadores.data.map(x => x.os_em_aberto))
                                                    const situacao = p.os_em_aberto === 0
                                                        ? 'ocioso'
                                                        : cargaPrestadores.resumo?.sobrecarregados?.some(s => s.usuarioid === p.usuarioid)
                                                            ? 'sobrecarregado'
                                                            : 'normal'
                                                    return (
                                                        <div className={styles.barItemRow} key={p.usuarioid}>
                                                            <div className={styles.barItemHead}>
                                                                <span>{p.nome}{p.cargo ? ` — ${p.cargo}` : ''}</span>
                                                                <b style={{ color: SITUACAO_COR[situacao] }}>{p.os_em_aberto} em aberto</b>
                                                            </div>
                                                            <GraficoBarras
                                                                layout="horizontal"
                                                                xAxis={[{ min: 0, max: maxAberto, position: 'none' }]}
                                                                yAxis={[{ scaleType: 'band', data: [''], position: 'none' }]}
                                                                series={[{ data: [p.os_em_aberto], color: SITUACAO_COR[situacao] }]}
                                                                borderRadius={4}
                                                                height={14}
                                                                margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                                                                hideLegend
                                                            />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : <p className={styles.semDados}>Nenhum prestador ativo encontrado.</p>}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}

            </main>

        </div>
    )
}
