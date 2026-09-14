'use client'
import { useState, useMemo, useEffect } from 'react'
import Nav from "../components/Nav/Nav"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { reports } from "../services/reports"
import styles from "./page.module.css"

const LIMITE = 15

const STATUS_COLOR = {
    'Pendente':            '#d97706',
    'Em execução':         '#16a34a',
    'Aguardando material': '#7c3aed',
    'Concluída':           '#059669',
    'Atribuída':           '#2563eb',
}

const ABAS = [
    { chave: 'pendentes', label: 'Pendentes de atribuição', cor: '#d97706' },
    { chave: 'atribuidas', label: 'Atribuídas', cor: '#2563eb' },
    { chave: 'concluidas', label: 'Concluídas', cor: '#059669' },
]

function Paginacao({ pagina, total, limite, onChange, sufixo }) {
    const totalPaginas = Math.max(1, Math.ceil(total / limite))
    const inicio = total > 0 ? (pagina - 1) * limite + 1 : 0
    const fim = Math.min(pagina * limite, total)

    return (
        <div className={styles.paginacao}>
            <span className={styles.paginacaoInfo}>
                Mostrando {inicio} a {fim} de {total} {sufixo}
            </span>
            <div className={styles.paginacaoBotoes}>
                <button className={styles.btnNav} onClick={() => onChange(pagina - 1)} disabled={pagina === 1}>&lt;</button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                    <button
                        key={num}
                        className={`${styles.btnNum} ${num === pagina ? styles.btnNumAtivo : ''}`}
                        onClick={() => onChange(num)}
                    >
                        {num}
                    </button>
                ))}
                <button className={styles.btnNav} onClick={() => onChange(pagina + 1)} disabled={pagina === totalPaginas}>&gt;</button>
            </div>
        </div>
    )
}

export default function Ordens() {
    useAuth()
    const router = useRouter()

    const [ocorrencias, setOcorrencias] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [selecionada, setSelecionada] = useState(null)
    const [busca, setBusca] = useState('')
    const [abaAtiva, setAbaAtiva] = useState('pendentes')
    const [pagina, setPagina] = useState(1)

    // "Atribuídas" e "Concluídas" ainda não têm uma API de ordem de serviço real por trás.
    const atribuidas = []
    const concluidas = []

    useEffect(() => {
        setIsLoading(true)
        reports()
            .then(data => setOcorrencias(data.map(item => ({
                problemaid: item.problemaid,
                protocolo: `#${String(item.problemaid).padStart(4, '0')}`,
                titulo: item.descricao,
                categoria: item.categoria,
                endereco: item.endereco?.rua || '-',
                status: item.status,
                data: item.data,
                imagem: item.imagem || [],
            })).sort((a, b) => b.problemaid - a.problemaid)))
            .catch(err => console.error('Erro ao buscar ocorrências:', err))
            .finally(() => setIsLoading(false))
    }, [])

    const pendentes = useMemo(() => {
        const pendentesReais = ocorrencias.filter(o => o.status === 'Pendente')
        if (!busca) return pendentesReais
        const b = busca.toLowerCase()
        return pendentesReais.filter(o =>
            o.protocolo.toLowerCase().includes(b) ||
            o.titulo?.toLowerCase().includes(b) ||
            o.categoria?.toLowerCase().includes(b) ||
            o.endereco?.toLowerCase().includes(b)
        )
    }, [ocorrencias, busca])

    const contagens = {
        pendentes: pendentes.length,
        atribuidas: atribuidas.length,
        concluidas: concluidas.length,
    }

    const dadosAba = abaAtiva === 'pendentes' ? pendentes : abaAtiva === 'atribuidas' ? atribuidas : concluidas
    const totalAba = dadosAba.length
    const dadosPagina = dadosAba.slice((pagina - 1) * LIMITE, pagina * LIMITE)

    useEffect(() => {
        setPagina(1)
    }, [abaAtiva, busca])

    function handleSelect(os) {
        setSelecionada(prev => prev?.problemaid === os.problemaid ? null : os)
    }

    function trocarAba(chave) {
        setAbaAtiva(chave)
        setSelecionada(null)
    }

    return (
        <div className={styles.container}>
            <Nav tela="ordemdeservico" />
            <main>

                <div className={styles.search}>
                    <input
                        type="search"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar por protocolo, categoria, endereço ou palavra-chave..."
                    />
                </div>

                <div className={styles.titleDescription}>
                    <h2>Ordens de Serviço</h2>
                    <p>Acompanhe e gerencie todas as ordens de serviço cadastradas.</p>
                </div>

                <div className={styles.abas}>
                    {ABAS.map(aba => (
                        <button
                            key={aba.chave}
                            className={`${styles.aba} ${abaAtiva === aba.chave ? styles.abaAtiva : ''}`}
                            onClick={() => trocarAba(aba.chave)}
                            style={abaAtiva === aba.chave ? { color: aba.cor, borderColor: aba.cor } : undefined}
                        >
                            <span className={styles.abaDot} style={{ background: aba.cor }} />
                            {aba.label}
                            <span
                                className={styles.abaBadge}
                                style={abaAtiva === aba.chave ? { background: aba.cor, color: '#fff' } : undefined}
                            >
                                {contagens[aba.chave]}
                            </span>
                        </button>
                    ))}
                </div>

                <div className={styles.contentArea}>
                    <div className={styles.tablesArea}>

                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    {abaAtiva === 'pendentes' && (
                                        <tr>
                                            <th className={styles.thCheck}><input type="checkbox" /></th>
                                            <th>Protocolo</th>
                                            <th>Descrição</th>
                                            <th>Categoria</th>
                                            <th>Endereço</th>
                                            <th>Data criação</th>
                                            <th>Ações</th>
                                        </tr>
                                    )}
                                    {abaAtiva === 'atribuidas' && (
                                        <tr>
                                            <th className={styles.thCheck}><input type="checkbox" /></th>
                                            <th>Protocolo</th>
                                            <th>Categoria</th>
                                            <th>Equipe</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    )}
                                    {abaAtiva === 'concluidas' && (
                                        <tr>
                                            <th className={styles.thCheck}><input type="checkbox" /></th>
                                            <th>Protocolo</th>
                                            <th>Categoria</th>
                                            <th>Equipe</th>
                                            <th>Dt. conclusão</th>
                                            <th>Ações</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {abaAtiva === 'pendentes' ? (
                                        isLoading ? (
                                            <tr>
                                                <td colSpan={7} className={styles.carregando}>Carregando ocorrências...</td>
                                            </tr>
                                        ) : dadosPagina.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className={styles.carregando}>Nenhuma ocorrência pendente de atribuição.</td>
                                            </tr>
                                        ) : dadosPagina.map(os => (
                                            <tr
                                                key={os.problemaid}
                                                onClick={() => handleSelect(os)}
                                                className={selecionada?.problemaid === os.problemaid ? styles.rowSelected : ''}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td className={styles.tdCheck} onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                                                <td className={styles.protocolo}>{os.protocolo}</td>
                                                <td className={styles.tdEndereco}>{os.titulo}</td>
                                                <td>{os.categoria}</td>
                                                <td className={styles.tdEndereco}>{os.endereco}</td>
                                                <td>{os.data}</td>
                                                <td className={styles.acoes} onClick={e => e.stopPropagation()}>
                                                    <button title="Visualizar" onClick={() => handleSelect(os)}>👁</button>
                                                    <button title="Editar" onClick={() => router.push(`/ocorrencias/editar/${os.problemaid}`)}>✏️</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className={styles.carregando}>
                                                Nenhuma ordem de serviço {abaAtiva === 'atribuidas' ? 'atribuída' : 'concluída'} ainda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <Paginacao
                                pagina={pagina}
                                total={totalAba}
                                limite={LIMITE}
                                onChange={setPagina}
                                sufixo={abaAtiva === 'pendentes' ? 'pendentes' : abaAtiva === 'atribuidas' ? 'atribuídas' : 'concluídas'}
                            />
                        </div>

                    </div>

                    {/* PAINEL LATERAL */}
                    {selecionada && (
                        <div className={styles.painel}>
                            <div className={styles.painelHeader}>
                                <span className={styles.painelTitulo}>Detalhes da ocorrência</span>
                                <button
                                    className={styles.painelEditar}
                                    onClick={() => router.push(`/ocorrencias/editar/${selecionada.problemaid}`)}
                                    title="Editar"
                                >
                                    ✏️
                                </button>
                            </div>

                            <div className={styles.painelSubheader}>
                                <span className={styles.painelOsId}>{selecionada.protocolo}</span>
                                <span
                                    className={styles.painelStatusChip}
                                    style={{
                                        color: STATUS_COLOR[selecionada.status] || '#6b7280',
                                        background: `${STATUS_COLOR[selecionada.status] || '#6b7280'}18`,
                                    }}
                                >
                                    {selecionada.status}
                                </span>
                            </div>

                            {selecionada.endereco !== '-' && (
                                <div className={styles.painelProtocoloRow}>
                                    📍 {selecionada.endereco}
                                </div>
                            )}

                            <div className={styles.painelFoto}>
                                {selecionada.imagem?.length > 0
                                    ? <img src={selecionada.imagem[0]} alt="Ocorrência" />
                                    : <div className={styles.painelFotoPlaceholder} />
                                }
                            </div>

                            <div className={styles.painelGrid}>
                                <div className={`${styles.painelGridItem} ${styles.painelGridFull}`}>
                                    <span className={styles.painelLabel}>Categoria</span>
                                    <span className={styles.painelValue}>{selecionada.categoria}</span>
                                </div>
                                <div className={`${styles.painelGridItem} ${styles.painelGridFull}`}>
                                    <span className={styles.painelLabel}>Data de criação</span>
                                    <span className={styles.painelValue}>{selecionada.data}</span>
                                </div>
                            </div>

                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>Descrição</span>
                                <p className={styles.painelDescricao}>{selecionada.titulo}</p>
                            </div>

                            <div className={styles.painelAtribuir}>
                                <button className={styles.btnAtribuir} onClick={() => router.push('/ordens/criar')}>
                                    👤 Atribuir OS
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </main>
        </div>
    )
}
