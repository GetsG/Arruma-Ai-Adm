'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Nav from '@/app/components/Nav/Nav'
import MapGoiania from '@/app/components/Map/MapGoianiaWrapper'
import { reports, updateStatus } from '@/app/services/reports'
import styles from './page.module.css'

const CATEGORIAS = [
    'Buraco na via',
    'Iluminação',
    'Saneamento',
    'Segurança',
    'Transporte',
]

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
    const [observacoes, setObservacoes] = useState('')
    const [salvando, setSalvando] = useState(false)
    const [mensagem, setMensagem] = useState(null)

    useEffect(() => {
        reports()
            .then(data => {
                const item = data.find(o => o.problemaid === Number(id))
                if (item) {
                    setOcorrencia(item)
                    setStatus(normalizeStatus(item.status))
                    setPrioridade(normalizePrioridade(item.prioridade))
                    setCategoria(item.categoria || '')
                }
            })
            .catch(err => console.error('Erro:', err))
    }, [id])

    async function handleSalvar() {
        setSalvando(true)
        try {
            await updateStatus(Number(id), status)
            setMensagem({ tipo: 'sucesso', texto: 'Alterações salvas com sucesso!' })
        } catch {
            setMensagem({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' })
        } finally {
            setSalvando(false)
            setTimeout(() => setMensagem(null), 4000)
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
                                    <select
                                        className={styles.select}
                                        value={categoria}
                                        onChange={e => setCategoria(e.target.value)}
                                    >
                                        <option value="">— Selecione</option>
                                        {CATEGORIAS.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
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
                            <h3 className={styles.cardTitulo}>📍 Localização</h3>
                            <div className={styles.gridQuatro}>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>CEP</label>
                                    <input className={styles.input} placeholder="—" />
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Logradouro</label>
                                    <input className={styles.input} defaultValue={ocorrencia.endereco?.rua || ''} />
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Número</label>
                                    <input className={styles.input} placeholder="—" />
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Complemento</label>
                                    <input className={styles.input} placeholder="—" />
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Bairro</label>
                                    <select className={styles.select}>
                                        <option>— Selecione</option>
                                    </select>
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Cidade</label>
                                    <select className={styles.select}>
                                        <option>Goiânia</option>
                                    </select>
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Estado</label>
                                    <select className={styles.select}>
                                        <option>GO</option>
                                    </select>
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Ponto de referência</label>
                                    <input className={styles.input} defaultValue={ocorrencia.endereco?.ponto_referencia || ''} />
                                </div>
                            </div>

                            <div className={styles.mapaSection}>
                                <button className={styles.ajustarMapa}>📍 Ajustar localização no mapa</button>
                                <div className={styles.mapaWrapper}>
                                    <MapGoiania pontos={pontoMapa} />
                                </div>
                            </div>
                        </div>

                        {/* Observações internas */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>💬 Observações internas</h3>
                            <div className={styles.textareaWrapper}>
                                <textarea
                                    className={styles.textarea}
                                    value={observacoes}
                                    onChange={e => setObservacoes(e.target.value.slice(0, 500))}
                                    placeholder="Adicione observações internas sobre esta ocorrência..."
                                    rows={5}
                                />
                                <span className={styles.charCount}>{observacoes.length} / 500 caracteres</span>
                            </div>
                        </div>

                    </div>

                    {/* Sidebar direita */}
                    <div className={styles.rightCol}>
                        <div className={styles.sidebar}>
                            <div className={styles.sidebarHeader}>
                                <span className={styles.sidebarTitulo}>Resumo da ocorrência</span>
                                <span className={styles.sidebarCollapse}>∧</span>
                            </div>

                            <div className={styles.sidebarSecao}>
                                <p className={styles.sidebarLabel}>Foto enviada pelo cidadão</p>
                                <div className={styles.fotoBox}>
                                    {ocorrencia.imagem?.length > 0
                                        ? <img src={ocorrencia.imagem[0]} alt="Ocorrência" className={styles.fotoImg} />
                                        : <div className={styles.fotoPlaceholder} />
                                    }
                                    <button className={styles.expandBtn} title="Expandir">⤢</button>
                                </div>
                                <button className={styles.btnAlterarFoto}>📷 Alterar foto</button>
                            </div>

                            <div className={styles.sidebarSecao}>
                                <p className={styles.sidebarTituloSecao}>Informações do cidadão</p>
                                <div className={styles.cidadaoGrid}>
                                    <span className={styles.sidebarLabel}>Nome</span>
                                    <span className={styles.sidebarValue}>—</span>
                                    <span className={styles.sidebarLabel}>E-mail</span>
                                    <span className={styles.sidebarValue}>—</span>
                                    <span className={styles.sidebarLabel}>Telefone</span>
                                    <span className={styles.sidebarValue}>—</span>
                                </div>
                            </div>

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
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
