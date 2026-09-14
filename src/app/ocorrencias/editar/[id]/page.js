'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Nav from '@/app/components/Nav/Nav'
import MapGoiania from '@/app/components/Map/MapGoianiaWrapper'
import { reports, updateStatus, deleteProblem } from '@/app/services/reports'
import styles from './page.module.css'

const PRIORIDADE_OPTIONS = [
    { valor: 1, label: 'Baixa' },
    { valor: 2, label: 'Média' },
    { valor: 3, label: 'Alta' },
    { valor: 4, label: 'Crítica' },
]

const STATUS_OPTIONS = [
    { valor: 1, label: 'Pendente' },
    { valor: 2, label: 'Em andamento' },
    { valor: 3, label: 'Resolvido' },
    { valor: 4, label: 'Em análise' },
    { valor: 5, label: 'Atribuído' },
    { valor: 6, label: 'Cancelado' },
]

const STATUS_COR = {
    1: '#6b7280',
    2: '#2563eb',
    3: '#2d7a3a',
    4: '#7c3aed',
    5: '#d97706',
    6: '#dc2626',
}

function normalizeStatus(raw) {
    const num = Number(raw)
    if (!isNaN(num) && num >= 1 && num <= 6) return num
    const map = { 'pendente': 1, 'em andamento': 2, 'resolvido': 3, 'em analise': 4, 'em análise': 4, 'atribuido': 5, 'atribuído': 5, 'cancelado': 6 }
    return map[(raw || '').toLowerCase().trim()] || 1
}

function normalizePrioridade(raw) {
    if (raw === null || raw === undefined || raw === '') return ''
    const num = Number(raw)
    if (!isNaN(num) && num >= 1 && num <= 4) return num
    const map = { 'baixa': 1, 'media': 2, 'média': 2, 'alta': 3, 'critica': 4, 'crítica': 4 }
    return map[(raw || '').toLowerCase().trim()] ?? ''
}

export default function EditarOcorrencia() {
    const { id } = useParams()
    const router = useRouter()

    const [ocorrencia, setOcorrencia] = useState(null)
    const [status, setStatus] = useState(1)
    const [prioridade, setPrioridade] = useState('')
    const [categoria, setCategoria] = useState('')
    const [salvando, setSalvando] = useState(false)
    const [mensagem, setMensagem] = useState(null)
    const [resumoAberto, setResumoAberto] = useState(true)
    const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
    const [excluindo, setExcluindo] = useState(false)
    const [erroExclusao, setErroExclusao] = useState(null)

    useEffect(() => {
        reports()
            .then(data => {
                const item = data.find(o => o.problemaid === Number(id))
                if (item) {
                    setOcorrencia(item)
                    setStatus(normalizeStatus(item.status))
                    setPrioridade(normalizePrioridade(item.prioridadeid ?? item.prioridade))
                    setCategoria(item.categoria || '')
                }
            })
            .catch(err => console.error('Erro:', err))
    }, [id])

    async function handleSalvar() {
        setSalvando(true)
        try {
            const payload = {}
            if (prioridade !== '') payload.prioridadeid = prioridade
            await updateStatus(Number(id), status, payload)
            setMensagem({ tipo: 'sucesso', texto: 'Alterações salvas com sucesso!' })
        } catch {
            setMensagem({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' })
        } finally {
            setSalvando(false)
            setTimeout(() => setMensagem(null), 4000)
        }
    }

    function cancelarExclusao() {
        if (excluindo) return
        setConfirmandoExclusao(false)
        setErroExclusao(null)
    }

    async function confirmarExclusao() {
        setExcluindo(true)
        setErroExclusao(null)
        try {
            await deleteProblem(Number(id))
            router.push('/ocorrencias')
        } catch (err) {
            setErroExclusao('Não foi possível excluir a ocorrência. Tente novamente.')
            setExcluindo(false)
        }
    }

    if (!ocorrencia) {
        return (
            <div className={styles.container}>
                <Nav tela="ocorrencias" />
                <main className={styles.loading}>Carregando ocorrência...</main>
            </div>
        )
    }

    const protocolo = `#${String(ocorrencia.problemaid).padStart(4, '0')}`
    const lat = parseFloat(ocorrencia.endereco?.latitude)
    const lng = parseFloat(ocorrencia.endereco?.longitude)
    const pontoMapa = (!isNaN(lat) && !isNaN(lng))
        ? [{ lat, lng, titulo: ocorrencia.endereco?.rua, tipo: ocorrencia.categoria }]
        : []
    const linkGoogleMaps = (!isNaN(lat) && !isNaN(lng))
        ? `https://www.google.com/maps?q=${lat},${lng}`
        : null

    const statusLabel = STATUS_OPTIONS.find(s => s.valor === status)?.label || '—'

    return (
        <div className={styles.container}>
            <Nav tela="ocorrencias" />
            <main>

                {/* Topo */}
                <div className={styles.topBar}>
                    <div>
                        <p className={styles.breadcrumb}>
                            Ocorrências &gt; <span className={styles.breadcrumbAtivo}>Editar ocorrência</span>
                        </p>
                        <h1 className={styles.titulo}>Editar Ocorrência</h1>
                        <p className={styles.subtitulo}>Revise e atualize as informações da ocorrência registrada pelo cidadão.</p>
                    </div>
                    <div className={styles.acoesTopo}>
                        <button className={styles.btnVoltar} onClick={() => router.push('/ocorrencias')}>
                            ← Voltar para lista
                        </button>
                        <button className={styles.btnExcluirOcorrencia} onClick={() => setConfirmandoExclusao(true)}>
                            🗑️ Excluir ocorrência
                        </button>
                        <button className={styles.btnSalvar} onClick={handleSalvar} disabled={salvando}>
                            🔒 {salvando ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                    </div>
                </div>

                {mensagem && (
                    <div className={`${styles.mensagem} ${styles[mensagem.tipo]}`}>
                        {mensagem.texto}
                    </div>
                )}

                <div className={styles.contentArea}>

                    {/* Coluna esquerda */}
                    <div className={styles.leftCol}>

                        {/* Dados da ocorrência */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>⚠️ Dados da ocorrência</h3>
                            <div className={styles.gridTres}>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Protocolo</label>
                                    <input className={styles.inputReadonly} value={protocolo} readOnly />
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Data/Hora da criação</label>
                                    <input className={styles.inputReadonly} value={ocorrencia.data || '—'} readOnly />
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Categoria</label>
                                    <input className={styles.inputReadonly} value={categoria || '—'} readOnly />
                                </div>
                            </div>
                            <div className={styles.campoGroup} style={{ marginTop: 16 }}>
                                <label className={styles.label}>Descrição enviada pelo cidadão</label>
                                <div className={styles.textareaWrapper}>
                                    <textarea
                                        className={`${styles.textarea} ${styles.textareaReadonly}`}
                                        defaultValue={ocorrencia.descricao || ''}
                                        maxLength={500}
                                        rows={4}
                                        readOnly
                                    />
                                    <span className={styles.charCount}>{(ocorrencia.descricao || '').length} / 500 caracteres</span>
                                </div>
                            </div>
                        </div>

                        {/* Classificação e status */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>📊 Classificação e status</h3>
                            <div className={styles.gridDois}>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Prioridade</label>
                                    <select
                                        className={styles.select}
                                        value={prioridade}
                                        onChange={e => setPrioridade(e.target.value === '' ? '' : Number(e.target.value))}
                                    >
                                        <option value="">— Selecione</option>
                                        {PRIORIDADE_OPTIONS.map(p => (
                                            <option key={p.valor} value={p.valor}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Status da ocorrência</label>
                                    <select
                                        className={`${styles.select} ${styles.selectStatus}`}
                                        value={status}
                                        onChange={e => setStatus(Number(e.target.value))}
                                    >
                                        {STATUS_OPTIONS.map(s => (
                                            <option key={s.valor} value={s.valor}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Localização */}
                        <div className={styles.card}>
                            <div className={styles.localizacaoHeader}>
                                <h3 className={styles.cardTitulo}>📍 Localização</h3>
                                {linkGoogleMaps ? (
                                    <a
                                        className={styles.linkMaps}
                                        href={linkGoogleMaps}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Abrir no Google Maps ↗
                                    </a>
                                ) : (
                                    <span className={styles.semLocalizacao}>Localização não informada</span>
                                )}
                            </div>
                            <div className={styles.mapaWrapper}>
                                <MapGoiania pontos={pontoMapa} />
                            </div>
                        </div>

                    </div>

                    {/* Sidebar direita */}
                    <div className={styles.rightCol}>
                        <div className={styles.sidebar}>
                            <button
                                type="button"
                                className={styles.sidebarHeader}
                                onClick={() => setResumoAberto(prev => !prev)}
                            >
                                <span className={styles.sidebarTitulo}>Resumo da ocorrência</span>
                                <span className={`${styles.sidebarCollapse} ${resumoAberto ? '' : styles.sidebarCollapseFechado}`}>∧</span>
                            </button>

                            {resumoAberto && (
                                <>
                                    {ocorrencia.imagem?.length > 0 && (
                                        <div className={styles.sidebarSecao}>
                                            <p className={styles.sidebarLabel}>Foto enviada pelo cidadão</p>
                                            <div className={styles.fotoBox}>
                                                <img src={ocorrencia.imagem[0]} alt="Ocorrência" className={styles.fotoImg} />
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.sidebarSecao}>
                                        <p className={styles.sidebarTituloSecao}>Histórico da ocorrência</p>
                                        <div className={styles.historico}>
                                            <div className={styles.historicoItem}>
                                                <div className={styles.historicoLinha}>
                                                    <span className={styles.historicoDot} style={{ background: '#2d7a3a' }} />
                                                    <div className={styles.historicoConteudo}>
                                                        <p className={styles.historicoData}>{ocorrencia.data}</p>
                                                        <p className={styles.historicoTexto}>Ocorrência criada pelo cidadão</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.historicoItem}>
                                                <div className={styles.historicoLinha}>
                                                    <span className={styles.historicoDot} style={{ background: STATUS_COR[status] || '#6b7280' }} />
                                                    <div className={styles.historicoConteudo}>
                                                        <p className={styles.historicoTexto}>Status atual: <strong>{statusLabel}</strong></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                </div>

                {confirmandoExclusao && (
                    <div className={styles.modalOverlay} onClick={cancelarExclusao}>
                        <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                            <h3>Excluir ocorrência?</h3>
                            <p>
                                Essa ação não pode ser desfeita. A ocorrência{' '}
                                <strong>{protocolo}</strong> — {ocorrencia.descricao} — será
                                removida permanentemente.
                            </p>
                            {erroExclusao && <p className={styles.modalErro}>{erroExclusao}</p>}
                            <div className={styles.modalAcoes}>
                                <button
                                    className={styles.modalCancelarBtn}
                                    onClick={cancelarExclusao}
                                    disabled={excluindo}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className={styles.modalExcluirBtn}
                                    onClick={confirmarExclusao}
                                    disabled={excluindo}
                                >
                                    {excluindo ? 'Excluindo...' : 'Excluir'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
