'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Nav from '../../components/Nav/Nav'
import MapGoiania from '@/app/components/Map/MapGoianiaWrapper'
import { useAuth } from '@/hooks/useAuth'
import { reports, updateStatus } from '@/app/services/reports'
import { listarUsuarios } from '@/app/services/users'
import { criarOrdemServico } from '@/app/services/ordens'
import styles from './page.module.css'

const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Crítica']
const STATUS_INICIAIS = ['Atribuída', 'Em execução', 'Aguardando material']

const ETAPAS = [
    { label: 'OS criada', sub: 'Agora', concluida: true },
    { label: 'Atribuída à equipe', sub: 'Ao salvar', concluida: false },
    { label: 'Em andamento', sub: 'Pendente', concluida: false },
    { label: 'Concluída', sub: 'Pendente', concluida: false },
]

// useSearchParams precisa estar dentro de um Suspense no Next, por isso a tela é dividida em dois componentes
export default function CriarOS() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <Nav tela="ordemdeservico" />
                <main className={styles.loading}>Carregando ocorrência...</main>
            </div>
        }>
            <CriarOSConteudo />
        </Suspense>
    )
}

// formulário de criação da OS, aberto a partir de uma ocorrência pendente (vem pelo ?problemaid= da URL)
function CriarOSConteudo() {
    useAuth({ somenteAdmin: true })
    const router = useRouter()
    const searchParams = useSearchParams()
    const problemaid = searchParams.get('problemaid')

    const [ocorrencia, setOcorrencia] = useState(null)
    const [prestadores, setPrestadores] = useState([])
    const [carregando, setCarregando] = useState(true)
    const [erroCarregamento, setErroCarregamento] = useState(null)

    const [tituloOs, setTituloOs] = useState('')
    const [prioridade, setPrioridade] = useState('')
    const [previsaoInicio, setPrevisaoInicio] = useState('')
    const [prazoEstimado, setPrazoEstimado] = useState('')
    const [statusInicial, setStatusInicial] = useState('Atribuída')
    const [descricaoServico, setDescricaoServico] = useState('')
    const [usuarioId, setUsuarioId] = useState('')

    const [salvando, setSalvando] = useState(false)
    const [mensagem, setMensagem] = useState(null)
    const [erros, setErros] = useState({})

    // carrega a ocorrência (pelo id da URL) e a lista de prestadores disponíveis pra atribuir
    useEffect(() => {
        if (!problemaid) {
            setErroCarregamento('Nenhuma ocorrência foi selecionada. Volte para a lista de ocorrências pendentes e escolha uma para atribuir.')
            setCarregando(false)
            return
        }

        setCarregando(true)
        Promise.all([reports(), listarUsuarios()])
            .then(([ocorrencias, usuarios]) => {
                const item = ocorrencias.find(o => o.problemaid === Number(problemaid))
                if (!item) {
                    setErroCarregamento('Ocorrência não encontrada.')
                } else {
                    setOcorrencia(item)
                }
                setPrestadores(usuarios.filter(u => u.tipo === 'prestador'))
            })
            .catch(() => setErroCarregamento('Não foi possível carregar os dados da ocorrência.'))
            .finally(() => setCarregando(false))
    }, [problemaid])

    // tira a mensagem de erro de um campo assim que o usuário mexe nele
    function limparErro(campo) {
        setErros(prev => ({ ...prev, [campo]: undefined }))
    }

    // confere os campos obrigatórios antes de criar a OS
    function validar() {
        const novosErros = {}
        if (!tituloOs.trim()) novosErros.tituloOs = 'Informe o título da OS.'
        if (!prioridade) novosErros.prioridade = 'Selecione a prioridade.'
        if (!statusInicial) novosErros.statusInicial = 'Selecione o status inicial.'
        if (!descricaoServico.trim()) novosErros.descricaoServico = 'Descreva o serviço a ser executado.'
        if (!usuarioId) novosErros.usuarioId = 'Selecione o prestador responsável.'
        if (!previsaoInicio) novosErros.previsaoInicio = 'Informe a previsão de início.'
        setErros(novosErros)
        return Object.keys(novosErros).length === 0
    }

    // cria a OS e, se der certo, marca a ocorrência como Atribuído
    async function handleCriar() {
        setMensagem(null)
        if (!validar()) {
            setMensagem({ tipo: 'erro', texto: 'Preencha os campos obrigatórios antes de criar a OS.' })
            return
        }

        setSalvando(true)
        try {
            await criarOrdemServico({
                prioridade,
                titulo_os: tituloOs.trim(),
                usuarioid: Number(usuarioId),
                problemaid: Number(problemaid),
                previsao_inicio: new Date(previsaoInicio).toISOString(),
                prazo_estimado: prazoEstimado.trim(),
                status_inicial: statusInicial,
                descricao_servico: descricaoServico.trim(),
            })

            // Reflete a atribuição na ocorrência de origem (5 = Atribuído)
            await updateStatus(Number(problemaid), 5, { observacao: 'Ordem de serviço criada e atribuída automaticamente.' }).catch(err => {
                console.error('Erro ao atualizar status da ocorrência:', err)
            })

            router.push('/ordens')
        } catch (err) {
            const motivo = err.response?.data?.message || err.response?.data?.error
            setMensagem({
                tipo: 'erro',
                texto: motivo ? `Erro ao criar ordem de serviço: ${motivo}` : 'Erro ao criar ordem de serviço. Verifique os dados e tente novamente.',
            })
        } finally {
            setSalvando(false)
        }
    }

    if (carregando) {
        return (
            <div className={styles.container}>
                <Nav tela="ordemdeservico" />
                <main className={styles.loading}>Carregando ocorrência...</main>
            </div>
        )
    }

    if (erroCarregamento) {
        return (
            <div className={styles.container}>
                <Nav tela="ordemdeservico" />
                <main>
                    <div className={`${styles.mensagem} ${styles.erro}`}>{erroCarregamento}</div>
                    <button className={styles.btnCancelar} onClick={() => router.push('/ordens')}>
                        ← Voltar para Ordens de Serviço
                    </button>
                </main>
            </div>
        )
    }

    const protocolo = `#${String(ocorrencia.problemaid).padStart(4, '0')}`
    const lat = parseFloat(ocorrencia.endereco?.latitude)
    const lng = parseFloat(ocorrencia.endereco?.longitude)
    const pontoMapa = (!isNaN(lat) && !isNaN(lng))
        ? [{ lat, lng, titulo: ocorrencia.endereco?.rua, tipo: ocorrencia.categoria }]
        : []

    return (
        <div className={styles.container}>
            <Nav tela="ordemdeservico" />
            <main>

                {/* TOPO */}
                <div className={styles.topBar}>
                    <div>
                        <p className={styles.breadcrumb}>
                            Ordens de Serviço &gt; <span className={styles.breadcrumbAtivo}>Criar Ordem de Serviço</span>
                        </p>
                        <h1 className={styles.titulo}>Criar Ordem de Serviço</h1>
                        <p className={styles.subtitulo}>Preencha os dados para criar uma nova ordem de serviço a partir da ocorrência selecionada.</p>
                    </div>
                    <div className={styles.acoesTopo}>
                        <button className={styles.btnCancelar} onClick={() => router.push('/ordens')}>
                            × Cancelar
                        </button>
                        <button className={styles.btnCriar} onClick={handleCriar} disabled={salvando}>
                            + {salvando ? 'Criando...' : 'Criar OS'}
                        </button>
                    </div>
                </div>

                {mensagem && (
                    <div className={`${styles.mensagem} ${styles[mensagem.tipo]}`}>
                        {mensagem.texto}
                    </div>
                )}

                <div className={styles.contentArea}>

                    {/* COLUNA PRINCIPAL */}
                    <div className={styles.mainCol}>

                        {/* SEÇÃO 1 */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitulo}>1. Dados da ocorrência (origem)</h3>
                                <span className={styles.badgeAuto}>Dados importados automaticamente</span>
                            </div>
                            <div className={styles.gridQuatro}>
                                <div className={styles.campo}>
                                    <label>Protocolo da ocorrência</label>
                                    <input className={styles.inputReadonly} value={protocolo} readOnly />
                                </div>
                                <div className={styles.campo}>
                                    <label>Data/Hora da ocorrência</label>
                                    <input className={styles.inputReadonly} value={ocorrencia.data || '—'} readOnly />
                                </div>
                                <div className={styles.campo}>
                                    <label>Categoria</label>
                                    <input className={styles.inputReadonly} value={ocorrencia.categoria || '—'} readOnly />
                                </div>
                                <div className={styles.campo}>
                                    <label>Endereço</label>
                                    <input className={styles.inputReadonly} value={ocorrencia.endereco?.rua || '—'} readOnly />
                                </div>
                            </div>
                            <div className={styles.gridDoisDesc}>
                                <div className={styles.campo}>
                                    <label>Descrição da ocorrência</label>
                                    <textarea
                                        className={`${styles.textarea} ${styles.textareaReadonly}`}
                                        value={ocorrencia.descricao || ''}
                                        rows={4}
                                        readOnly
                                    />
                                </div>
                                <div className={styles.campo}>
                                    <label>Foto enviada pelo cidadão</label>
                                    <div className={styles.fotoBox}>
                                        {ocorrencia.imagem?.length > 0 ? (
                                            <img src={ocorrencia.imagem[0]} alt="Ocorrência" className={styles.fotoImg} />
                                        ) : (
                                            <div className={styles.fotoPlaceholder} />
                                        )}
                                    </div>
                                </div>
                            </div>
                            {pontoMapa.length > 0 && (
                                <div className={styles.mapaWrapper}>
                                    <MapGoiania pontos={pontoMapa} />
                                </div>
                            )}
                        </div>

                        {/* SEÇÃO 2 */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>2. Detalhes da Ordem de Serviço</h3>
                            <div className={styles.gridTres}>
                                <div className={styles.campo}>
                                    <label>Título da OS <span className={styles.req}>*</span></label>
                                    <input
                                        className={`${styles.input} ${erros.tituloOs ? styles.inputErro : ''}`}
                                        placeholder="Ex.: Reparar buraco na via"
                                        value={tituloOs}
                                        onChange={e => { setTituloOs(e.target.value); limparErro('tituloOs') }}
                                    />
                                    {erros.tituloOs && <span className={styles.erroTexto}>{erros.tituloOs}</span>}
                                </div>
                                <div className={styles.campo}>
                                    <label>Prioridade <span className={styles.req}>*</span></label>
                                    <select
                                        className={`${styles.select} ${erros.prioridade ? styles.inputErro : ''}`}
                                        value={prioridade}
                                        onChange={e => { setPrioridade(e.target.value); limparErro('prioridade') }}
                                    >
                                        <option value="">Selecione a prioridade</option>
                                        {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    {erros.prioridade && <span className={styles.erroTexto}>{erros.prioridade}</span>}
                                </div>
                                <div className={styles.campo}>
                                    <label>Prazo estimado</label>
                                    <input
                                        className={styles.input}
                                        placeholder="Ex.: 5 dias úteis"
                                        value={prazoEstimado}
                                        onChange={e => setPrazoEstimado(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.gridTres}>
                                <div className={styles.campo}>
                                    <label>Previsão de início <span className={styles.req}>*</span></label>
                                    <input
                                        className={`${styles.input} ${erros.previsaoInicio ? styles.inputErro : ''}`}
                                        type="datetime-local"
                                        value={previsaoInicio}
                                        onChange={e => { setPrevisaoInicio(e.target.value); limparErro('previsaoInicio') }}
                                    />
                                    {erros.previsaoInicio && <span className={styles.erroTexto}>{erros.previsaoInicio}</span>}
                                </div>
                                <div className={styles.campo}>
                                    <label>Status inicial <span className={styles.req}>*</span></label>
                                    <select
                                        className={`${styles.select} ${erros.statusInicial ? styles.inputErro : ''}`}
                                        value={statusInicial}
                                        onChange={e => { setStatusInicial(e.target.value); limparErro('statusInicial') }}
                                    >
                                        {STATUS_INICIAIS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {erros.statusInicial && <span className={styles.erroTexto}>{erros.statusInicial}</span>}
                                </div>
                            </div>
                            <div className={styles.campo}>
                                <label>Descrição do serviço / Tarefa <span className={styles.req}>*</span></label>
                                <div className={styles.textareaWrapper}>
                                    <textarea
                                        className={`${styles.textarea} ${erros.descricaoServico ? styles.inputErro : ''}`}
                                        placeholder="Descreva o serviço que deverá ser executado..."
                                        rows={4}
                                        value={descricaoServico}
                                        onChange={e => { setDescricaoServico(e.target.value.slice(0, 1000)); limparErro('descricaoServico') }}
                                    />
                                    <span className={styles.charCount}>{descricaoServico.length} / 1000 caracteres</span>
                                </div>
                                {erros.descricaoServico && <span className={styles.erroTexto}>{erros.descricaoServico}</span>}
                            </div>
                        </div>

                    </div>

                    {/* SIDEBAR DIREITA */}
                    <div className={styles.sidebar}>

                        {/* ATRIBUIÇÃO */}
                        <div className={styles.sideCard}>
                            <h4 className={styles.sideCardTitulo}>Atribuição</h4>
                            <div className={styles.campo}>
                                <label>Prestador responsável <span className={styles.req}>*</span></label>
                                <select
                                    className={`${styles.select} ${erros.usuarioId ? styles.inputErro : ''}`}
                                    value={usuarioId}
                                    onChange={e => { setUsuarioId(e.target.value); limparErro('usuarioId') }}
                                >
                                    <option value="">Selecione um prestador</option>
                                    {prestadores.map(p => (
                                        <option key={p.usuarioid} value={p.usuarioid}>
                                            {p.nome}{p.cargo ? ` — ${p.cargo}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {erros.usuarioId && <span className={styles.erroTexto}>{erros.usuarioId}</span>}
                                {prestadores.length === 0 && (
                                    <span className={styles.avisoTexto}>Nenhum prestador cadastrado ainda.</span>
                                )}
                            </div>
                        </div>

                        {/* LINHA DO TEMPO */}
                        <div className={styles.sideCard}>
                            <h4 className={styles.sideCardTitulo}>Linha do tempo da OS</h4>
                            <div className={styles.timeline}>
                                {ETAPAS.map((etapa, i) => (
                                    <div key={i} className={styles.timelineItem}>
                                        <div className={styles.timelineLinha}>
                                            <div className={`${styles.timelineDot} ${etapa.concluida ? styles.timelineDotOk : styles.timelineDotPendente}`}>
                                                {etapa.concluida && <span className={styles.timelineCheck}>✓</span>}
                                            </div>
                                            {i < ETAPAS.length - 1 && <div className={styles.timelineConector} />}
                                        </div>
                                        <div className={styles.timelineTexto}>
                                            <p className={`${styles.timelineLabel} ${etapa.concluida ? styles.timelineLabelOk : ''}`}>{etapa.label}</p>
                                            <p className={styles.timelineSub}>{etapa.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    )
}
