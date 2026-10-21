'use client'
import { useState, useMemo, useEffect } from 'react'
import Nav from "../components/Nav/Nav"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { reports, updateStatus } from "../services/reports"
import { listarOrdensServico, listarOrdensServicoPrestador, atualizarOrdemServico } from "../services/ordens"
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

// Status que o prestador pode escolher ao atualizar uma OS
const STATUS_ATUALIZAVEIS = ['Em execução', 'Aguardando material', 'Concluída']

// statusid da ocorrência (/problem/{id}/status) correspondente a cada status_inicial da OS
const STATUSID_POR_STATUS = {
    'atribuida':             5,
    'em execucao':           2,
    'aguardando material':   2,
    'concluida':             3,
}

// remove acento e deixa minúsculo, pra comparar status sem depender de como a API formatou o texto
function normalizarTexto(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

// "Atribuídas" = OS ativas (atribuída / em execução / aguardando material) e ainda não concluídas
function estaAtiva(item) {
    if (item.concluido) return false
    const s = normalizarTexto(item.status)
    return s.startsWith('atribu') || s.startsWith('em execu') || s.startsWith('aguardando')
}

// "Concluídas" = campo concluido = true (com fallback pro texto do status, pra OS antigas sem esse campo)
function estaConcluida(item) {
    if (typeof item.concluido === 'boolean') return item.concluido
    return normalizarTexto(item.status).startsWith('conclu')
}

// paginação simples, reaproveitada nas três abas (pendentes/atribuídas/concluídas)
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

// tela de ordens de serviço — conteúdo muda bastante conforme o papel do usuário:
// admin vê as 3 abas e cria OS; prestador só vê e atualiza as próprias OS
export default function Ordens() {
    const { usuario, carregando } = useAuth()
    const router = useRouter()
    const ehPrestador = usuario?.tipo === 'prestador'
    // enquanto o perfil não carrega, trata como se não pudesse ver "pendentes" (evita flash pro prestador)
    const podeVerPendentes = !carregando && !ehPrestador

    const [ocorrencias, setOcorrencias] = useState([])
    const [ordens, setOrdens] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [selecionada, setSelecionada] = useState(null)
    const [busca, setBusca] = useState('')
    const [abaAtiva, setAbaAtiva] = useState('pendentes')
    const [pagina, setPagina] = useState(1)

    const [novoStatusOS, setNovoStatusOS] = useState('')
    const [observacaoOS, setObservacaoOS] = useState('')
    const [salvandoOS, setSalvandoOS] = useState(false)
    const [mensagemOS, setMensagemOS] = useState(null)

    // deixa os campos da API (snake_case) no formato que a tela usa
    function mapearOrdens(ordensData) {
        return ordensData.map(item => ({
            idordem: item.idordem,
            protocolo: `#${String(item.problemaid).padStart(4, '0')}`,
            problemaid: item.problemaid,
            tituloOs: item.titulo_os,
            prioridade: item.prioridade,
            prazoEstimado: item.prazo_estimado,
            previsaoInicio: item.previsao_inicio,
            dataCriacao: item.data_criacao,
            status: item.status_inicial,
            // A API às vezes não manda "concluido" no GET (mesmo pra OS já concluídas) — nesse caso
            // deixa undefined pra estaConcluida() cair no fallback pelo texto do status
            concluido: typeof item.concluido === 'boolean' ? item.concluido : undefined,
            descricaoServico: item.descricao_servico,
            observacaoInterna: item.observacao_interna,
            prestadorNome: item.prestador_nome,
            problemaDescricao: item.problema_descricao,
        })).sort((a, b) => b.idordem - a.idordem)
    }

    // busca os dados certos conforme o papel: prestador só as próprias OS, admin tudo
    function carregarDados() {
        setIsLoading(true)
        if (ehPrestador) {
            return listarOrdensServicoPrestador()
                .then(ordensData => setOrdens(mapearOrdens(ordensData)))
                .catch(err => console.error('Erro ao buscar ordens de serviço:', err))
                .finally(() => setIsLoading(false))
        }
        return Promise.all([reports(), listarOrdensServico()])
            .then(([reportsData, ordensData]) => {
                setOcorrencias(reportsData.map(item => ({
                    problemaid: item.problemaid,
                    protocolo: `#${String(item.problemaid).padStart(4, '0')}`,
                    titulo: item.descricao,
                    categoria: item.categoria,
                    endereco: item.endereco?.rua || '-',
                    status: item.status,
                    data: item.data,
                    imagem: item.imagem || [],
                })).sort((a, b) => b.problemaid - a.problemaid))

                setOrdens(mapearOrdens(ordensData))
            })
            .catch(err => console.error('Erro ao buscar ordens de serviço:', err))
            .finally(() => setIsLoading(false))
    }

    useEffect(() => {
        if (!usuario) return
        carregarDados()
    }, [usuario])

    const abas = podeVerPendentes ? ABAS : ABAS.filter(a => a.chave !== 'pendentes')

    // Nunca deixa "pendentes" ser a aba efetivamente exibida antes de confirmar que dá pra ver (evita flash pro prestador)
    const abaEfetiva = (abaAtiva === 'pendentes' && !podeVerPendentes) ? 'atribuidas' : abaAtiva

    useEffect(() => {
        if (!podeVerPendentes) setAbaAtiva(prev => prev === 'pendentes' ? 'atribuidas' : prev)
    }, [podeVerPendentes])

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

    const atribuidas = useMemo(() => {
        const reais = ordens.filter(estaAtiva)
        if (!busca) return reais
        const b = busca.toLowerCase()
        return reais.filter(o =>
            o.protocolo.toLowerCase().includes(b) ||
            o.tituloOs?.toLowerCase().includes(b) ||
            o.prestadorNome?.toLowerCase().includes(b)
        )
    }, [ordens, busca])

    const concluidas = useMemo(() => {
        const reais = ordens.filter(estaConcluida)
        if (!busca) return reais
        const b = busca.toLowerCase()
        return reais.filter(o =>
            o.protocolo.toLowerCase().includes(b) ||
            o.tituloOs?.toLowerCase().includes(b) ||
            o.prestadorNome?.toLowerCase().includes(b)
        )
    }, [ordens, busca])

    const contagens = {
        pendentes: pendentes.length,
        atribuidas: atribuidas.length,
        concluidas: concluidas.length,
    }

    const dadosAba = abaEfetiva === 'pendentes' ? pendentes : abaEfetiva === 'atribuidas' ? atribuidas : concluidas
    const totalAba = dadosAba.length
    const dadosPagina = dadosAba.slice((pagina - 1) * LIMITE, pagina * LIMITE)

    useEffect(() => {
        setPagina(1)
    }, [abaAtiva, busca])

    // gera uma chave única pra comparar linha selecionada, já que a lista mistura ocorrência e OS
    function identidade(item) {
        return item.idordem !== undefined ? `os-${item.idordem}` : `oc-${item.problemaid}`
    }

    // seleciona a linha e, se for uma OS, já prepara o formulário de atualização com os valores atuais
    function handleSelect(item) {
        setSelecionada(prev => (prev && identidade(prev) === identidade(item)) ? null : item)
        setMensagemOS(null)
        if (item?.idordem !== undefined) {
            const statusAtual = STATUS_ATUALIZAVEIS.includes(item.status) ? item.status : STATUS_ATUALIZAVEIS[0]
            setNovoStatusOS(statusAtual)
            setObservacaoOS(item.observacaoInterna || '')
        }
    }

    // muda de aba e limpa a seleção, pra não ficar um item de outra aba marcado
    function trocarAba(chave) {
        setAbaAtiva(chave)
        setSelecionada(null)
    }

    // prestador salva a atualização da OS e, se deu certo, já reflete o status na ocorrência de origem
    async function handleAtualizarOS() {
        if (!selecionada || !novoStatusOS) return
        setSalvandoOS(true)
        setMensagemOS(null)
        try {
            const concluido = normalizarTexto(novoStatusOS) === 'concluida'
            await atualizarOrdemServico(selecionada.idordem, {
                status_inicial: novoStatusOS,
                observacao_interna: observacaoOS.trim(),
                concluido,
            })

            const statusid = STATUSID_POR_STATUS[normalizarTexto(novoStatusOS)]
            if (statusid) {
                await updateStatus(selecionada.problemaid, statusid, { observacao: observacaoOS.trim() }).catch(() => {})
            }

            setMensagemOS({ tipo: 'sucesso', texto: 'Ordem de serviço atualizada com sucesso!' })
            setSelecionada(null)
            carregarDados()
        } catch (err) {
            const motivo = err.response?.data?.message || err.response?.data?.error
            setMensagemOS({
                tipo: 'erro',
                texto: motivo ? `Erro ao atualizar a OS: ${motivo}` : 'Erro ao atualizar a ordem de serviço. Tente novamente.',
            })
        } finally {
            setSalvandoOS(false)
        }
    }

    return (
        <div className={styles.container}>
            <Nav tela="ordemdeservico" />
            <main>

                {/* Busca por protocolo, categoria, endereço... */}
                <div className={styles.search}>
                    <input
                        type="search"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar por protocolo, categoria, endereço ou palavra-chave..."
                    />
                </div>

                {/* texto muda dependendo se é admin ou prestador */}
                <div className={styles.titleDescription}>
                    <h2>Ordens de Serviço</h2>
                    <p>
                        {ehPrestador
                            ? 'Acompanhe e atualize as ordens de serviço atribuídas a você.'
                            : 'Acompanhe e gerencie todas as ordens de serviço cadastradas.'}
                    </p>
                </div>

                {/* some sozinha, só aparece depois de atribuir/atualizar uma OS */}
                {mensagemOS && (
                    <div className={`${styles.mensagem} ${styles[mensagemOS.tipo]}`}>
                        <span>{mensagemOS.texto}</span>
                        <button type="button" className={styles.mensagemFechar} onClick={() => setMensagemOS(null)}>✕</button>
                    </div>
                )}

                {/* abas: pendentes (ocorrência sem OS ainda), atribuídas e concluídas */}
                <div className={styles.abas}>
                    {abas.map(aba => (
                        <button
                            key={aba.chave}
                            className={`${styles.aba} ${abaEfetiva === aba.chave ? styles.abaAtiva : ''}`}
                            onClick={() => trocarAba(aba.chave)}
                            style={abaEfetiva === aba.chave ? { color: aba.cor, borderColor: aba.cor } : undefined}
                        >
                            <span className={styles.abaDot} style={{ background: aba.cor }} />
                            {aba.label}
                            <span
                                className={styles.abaBadge}
                                style={abaEfetiva === aba.chave ? { background: aba.cor, color: '#fff' } : undefined}
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
                                {/* colunas mudam: pendentes mostra ocorrência, o resto mostra OS */}
                                <thead>
                                    {abaEfetiva === 'pendentes' && (
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
                                    {abaEfetiva !== 'pendentes' && (
                                        <tr>
                                            <th className={styles.thCheck}><input type="checkbox" /></th>
                                            <th>Protocolo</th>
                                            <th>Título da OS</th>
                                            <th>Prestador</th>
                                            <th>Prioridade</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    )}
                                </thead>
                                {/* mesma lógica: pendentes lista ocorrência, as outras listam OS já criada */}
                                <tbody>
                                    {abaEfetiva === 'pendentes' ? (
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
                                                className={selecionada && identidade(selecionada) === identidade(os) ? styles.rowSelected : ''}
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
                                                </td>
                                            </tr>
                                        ))
                                    ) : isLoading ? (
                                        <tr>
                                            <td colSpan={7} className={styles.carregando}>Carregando ordens de serviço...</td>
                                        </tr>
                                    ) : dadosPagina.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className={styles.carregando}>
                                                Nenhuma ordem de serviço {abaEfetiva === 'atribuidas' ? 'atribuída' : 'concluída'} ainda.
                                            </td>
                                        </tr>
                                    ) : dadosPagina.map(os => (
                                        <tr
                                            key={os.idordem}
                                            onClick={() => handleSelect(os)}
                                            className={selecionada && identidade(selecionada) === identidade(os) ? styles.rowSelected : ''}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td className={styles.tdCheck} onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                                            <td className={styles.protocolo}>{os.protocolo}</td>
                                            <td className={styles.tdEndereco}>{os.tituloOs}</td>
                                            <td className={styles.tdEndereco}>{os.prestadorNome || '—'}</td>
                                            <td>{os.prioridade || '—'}</td>
                                            <td>
                                                <span
                                                    className={styles.painelStatusChip}
                                                    style={{
                                                        color: STATUS_COLOR[os.status] || '#6b7280',
                                                        background: `${STATUS_COLOR[os.status] || '#6b7280'}18`,
                                                    }}
                                                >
                                                    {os.status}
                                                </span>
                                            </td>
                                            <td className={styles.acoes} onClick={e => e.stopPropagation()}>
                                                <button title="Visualizar" onClick={() => handleSelect(os)}>👁</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Paginacao
                                pagina={pagina}
                                total={totalAba}
                                limite={LIMITE}
                                onChange={setPagina}
                                sufixo={abaEfetiva === 'pendentes' ? 'pendentes' : abaEfetiva === 'atribuidas' ? 'atribuídas' : 'concluídas'}
                            />
                        </div>

                    </div>

                    {/* PAINEL LATERAL */}
                    {/* ainda é só ocorrência pendente, sem OS - mostra botão de atribuir */}
                    {selecionada && selecionada.idordem === undefined && (
                        <div className={styles.painel}>
                            <div className={styles.painelHeader}>
                                <span className={styles.painelTitulo}>Detalhes da ocorrência</span>
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
                                <button className={styles.btnAtribuir} onClick={() => router.push(`/ordens/criar?problemaid=${selecionada.problemaid}`)}>
                                    👤 Atribuir OS
                                </button>
                            </div>
                        </div>
                    )}

                    {/* já tem OS criada - prestador atualiza status, admin só visualiza */}
                    {selecionada && selecionada.idordem !== undefined && (
                        <div className={styles.painel}>
                            <div className={styles.painelHeader}>
                                <span className={styles.painelTitulo}>Detalhes da ordem de serviço</span>
                                {!ehPrestador && (
                                    <button
                                        className={styles.painelEditar}
                                        onClick={() => router.push(`/ocorrencias/editar/${selecionada.problemaid}`)}
                                        title="Ver ocorrência de origem"
                                    >
                                        🔗
                                    </button>
                                )}
                            </div>

                            <div className={styles.painelSubheader}>
                                <span className={styles.painelOsId}>OS {selecionada.protocolo}</span>
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

                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>Título da OS</span>
                                <p className={styles.painelDescricao}>{selecionada.tituloOs}</p>
                            </div>

                            <div className={styles.painelGrid}>
                                <div className={styles.painelGridItem}>
                                    <span className={styles.painelLabel}>Prioridade</span>
                                    <span className={styles.painelValue}>{selecionada.prioridade || '—'}</span>
                                </div>
                                <div className={styles.painelGridItem}>
                                    <span className={styles.painelLabel}>Prazo estimado</span>
                                    <span className={styles.painelValue}>{selecionada.prazoEstimado || '—'}</span>
                                </div>
                                <div className={styles.painelGridItem}>
                                    <span className={styles.painelLabel}>Previsão de início</span>
                                    <span className={styles.painelValue}>
                                        {selecionada.previsaoInicio ? new Date(selecionada.previsaoInicio).toLocaleString('pt-BR') : '—'}
                                    </span>
                                </div>
                                <div className={styles.painelGridItem}>
                                    <span className={styles.painelLabel}>Criada em</span>
                                    <span className={styles.painelValue}>
                                        {selecionada.dataCriacao ? new Date(selecionada.dataCriacao).toLocaleString('pt-BR') : '—'}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>Prestador responsável</span>
                                <span className={styles.painelValue}>{selecionada.prestadorNome || '—'}</span>
                            </div>

                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>Descrição do serviço</span>
                                <p className={styles.painelDescricao}>{selecionada.descricaoServico}</p>
                            </div>

                            {/* só o prestador responsável pode mudar status/observação da própria OS */}
                            {ehPrestador ? (
                                <div className={styles.painelAtualizarOS}>
                                    <div className={styles.campoOS}>
                                        <label>Novo status</label>
                                        <select
                                            className={styles.selectOS}
                                            value={novoStatusOS}
                                            onChange={e => setNovoStatusOS(e.target.value)}
                                        >
                                            {STATUS_ATUALIZAVEIS.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.campoOS}>
                                        <label>Observação</label>
                                        <textarea
                                            className={styles.textareaOS}
                                            rows={3}
                                            value={observacaoOS}
                                            onChange={e => setObservacaoOS(e.target.value)}
                                            placeholder="Detalhes sobre o andamento do serviço..."
                                        />
                                    </div>
                                    <button className={styles.btnAtribuir} onClick={handleAtualizarOS} disabled={salvandoOS}>
                                        {salvandoOS ? 'Salvando...' : '✓ Atualizar ordem de serviço'}
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.painelAtribuir}>
                                    <button className={styles.btnAtribuir} onClick={() => router.push(`/ocorrencias/editar/${selecionada.problemaid}`)}>
                                        🔗 Ver ocorrência de origem
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </main>
        </div>
    )
}
