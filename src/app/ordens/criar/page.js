'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Nav from '../../components/Nav/Nav'
import MapGoiania from '@/app/components/Map/MapGoianiaWrapper'
import { useAuth } from '@/hooks/useAuth'
import { reports, updateStatus } from '@/app/services/reports'
import { criarOrdemServico, listarPrestadoresCompativeis, vincularPrestador } from '@/app/services/ordens'
import styles from './page.module.css'

const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Crítica']

const ETAPAS = [
    { label: 'OS criada', sub: 'Agora', concluida: true },
    { label: 'Prestador selecionado', sub: 'Próximo passo', concluida: false },
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

// fluxo em duas etapas: 1) cria a OS a partir da ocorrência pendente, 2) escolhe o prestador entre os compatíveis com a categoria
function CriarOSConteudo() {
    useAuth({ somenteAdmin: true })
    const router = useRouter()
    const searchParams = useSearchParams()
    const problemaid = searchParams.get('problemaid')

    const [ocorrencia, setOcorrencia] = useState(null)
    const [carregando, setCarregando] = useState(true)
    const [erroCarregamento, setErroCarregamento] = useState(null)

    const [tituloOs, setTituloOs] = useState('')
    const [prioridade, setPrioridade] = useState('')
    const [previsaoInicio, setPrevisaoInicio] = useState('')
    const [prazoEstimado, setPrazoEstimado] = useState('')
    const [descricaoServico, setDescricaoServico] = useState('')

    const [salvando, setSalvando] = useState(false)
    const [mensagem, setMensagem] = useState(null)
    const [erros, setErros] = useState({})

    // etapa 'formulario' = preenchendo os dados da OS; 'prestador' = escolhendo quem vai atender, já com a OS criada
    const [etapa, setEtapa] = useState('formulario')
    const [idordemCriada, setIdordemCriada] = useState(null)
    const [prestadores, setPrestadores] = useState([])
    const [categoriaOS, setCategoriaOS] = useState(null)
    const [carregandoPrestadores, setCarregandoPrestadores] = useState(false)
    const [erroPrestadores, setErroPrestadores] = useState(null)
    const [vinculandoId, setVinculandoId] = useState(null)

    // carrega a ocorrência de origem (pelo id da URL) pra preencher os dados somente leitura do topo
    useEffect(() => {
        if (!problemaid) {
            setErroCarregamento('Nenhuma ocorrência foi selecionada. Volte para a lista de ocorrências pendentes e escolha uma para atribuir.')
            setCarregando(false)
            return
        }

        setCarregando(true)
        reports()
            .then(ocorrencias => {
                const item = ocorrencias.find(o => o.problemaid === Number(problemaid))
                if (!item) {
                    setErroCarregamento('Ocorrência não encontrada.')
                } else {
                    setOcorrencia(item)
                }
            })
            .catch(() => setErroCarregamento('Não foi possível carregar os dados da ocorrência.'))
            .finally(() => setCarregando(false))
    }, [problemaid])

    // tira a mensagem de erro de um campo assim que o usuário mexe nele
    function limparErro(campo) {
        setErros(prev => ({ ...prev, [campo]: undefined }))
    }

    // confere os campos obrigatórios antes de criar a OS (prestador vem só depois, na próxima etapa)
    function validar() {
        const novosErros = {}
        if (!tituloOs.trim()) novosErros.tituloOs = 'Informe o título da OS.'
        if (!prioridade) novosErros.prioridade = 'Selecione a prioridade.'
        if (!descricaoServico.trim()) novosErros.descricaoServico = 'Descreva o serviço a ser executado.'
        if (!previsaoInicio) novosErros.previsaoInicio = 'Informe a previsão de início.'
        setErros(novosErros)
        return Object.keys(novosErros).length === 0
    }

    // busca os prestadores compatíveis com a categoria da OS recém-criada (API filtra pela categoria e ordena por quem está mais livre)
    function carregarPrestadoresCompativeis(idordem) {
        setCarregandoPrestadores(true)
        setErroPrestadores(null)
        listarPrestadoresCompativeis(idordem)
            .then(resposta => {
                setPrestadores(resposta.data || [])
                setCategoriaOS(resposta.ordem_servico?.categoria_nome || null)
            })
            .catch(() => setErroPrestadores('Não foi possível carregar os prestadores compatíveis.'))
            .finally(() => setCarregandoPrestadores(false))
    }

    // cria a OS (ainda sem prestador) e avança pra etapa de escolher quem vai atender
    async function handleCriar() {
        setMensagem(null)
        if (!validar()) {
            setMensagem({ tipo: 'erro', texto: 'Preencha os campos obrigatórios antes de criar a OS.' })
            return
        }

        setSalvando(true)
        try {
            const resposta = await criarOrdemServico({
                prioridade,
                titulo_os: tituloOs.trim(),
                problemaid: Number(problemaid),
                previsao_inicio: new Date(previsaoInicio).toISOString(),
                prazo_estimado: prazoEstimado.trim(),
                descricao_servico: descricaoServico.trim(),
            })

            // Reflete que a ocorrência já tem OS aberta (5 = Atribuído)
            await updateStatus(Number(problemaid), 5, { observacao: 'Ordem de serviço criada, aguardando atribuição de prestador.' }).catch(err => {
                console.error('Erro ao atualizar status da ocorrência:', err)
            })

            setIdordemCriada(resposta.idordem)
            setEtapa('prestador')
            carregarPrestadoresCompativeis(resposta.idordem)
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

    // vincula o prestador escolhido à OS já criada e volta pra listagem
    async function handleEscolherPrestador(usuarioid) {
        setVinculandoId(usuarioid)
        setErroPrestadores(null)
        try {
            await vincularPrestador(idordemCriada, usuarioid)
            router.push('/ordens')
        } catch (err) {
            const motivo = err.response?.data?.message || err.response?.data?.error
            setErroPrestadores(motivo ? `Erro ao vincular prestador: ${motivo}` : 'Erro ao vincular o prestador. Tente novamente.')
            setVinculandoId(null)
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
                            Ordens de Serviço &gt; <span className={styles.breadcrumbAtivo}>
                                {etapa === 'formulario' ? 'Criar Ordem de Serviço' : 'Selecionar prestador'}
                            </span>
                        </p>
                        <h1 className={styles.titulo}>
                            {etapa === 'formulario' ? 'Criar Ordem de Serviço' : 'Escolha o prestador'}
                        </h1>
                        <p className={styles.subtitulo}>
                            {etapa === 'formulario'
                                ? 'Preencha os dados para criar uma nova ordem de serviço a partir da ocorrência selecionada.'
                                : `OS ${protocolo} criada. Selecione quem vai atender, entre os prestadores compatíveis com a categoria${categoriaOS ? ` "${categoriaOS}"` : ''}.`}
                        </p>
                    </div>
                    <div className={styles.acoesTopo}>
                        <button className={styles.btnCancelar} onClick={() => router.push('/ordens')}>
                            × {etapa === 'formulario' ? 'Cancelar' : 'Voltar para Ordens'}
                        </button>
                        {etapa === 'formulario' && (
                            <button className={styles.btnCriar} onClick={handleCriar} disabled={salvando}>
                                + {salvando ? 'Criando...' : 'Criar OS'}
                            </button>
                        )}
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

                        {etapa === 'prestador' && (
                            /* só a escolha do prestador fica na tela — os detalhes aparecem passando o mouse, pra ajudar a decidir */
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitulo}>Prestadores compatíveis</h3>
                                    <div className={styles.infoTrigger}>
                                        <span className={styles.infoIcone}>ℹ️ Ver ocorrência e OS</span>
                                        <div className={styles.infoPanel}>
                                            <span className={styles.infoTituloSecao}>Ocorrência {protocolo}</span>
                                            <p><strong>Categoria:</strong> {ocorrencia.categoria || '—'}</p>
                                            <p><strong>Endereço:</strong> {ocorrencia.endereco?.rua || '—'}</p>
                                            <p><strong>Descrição:</strong> {ocorrencia.descricao || '—'}</p>

                                            <div className={styles.infoDivisor} />

                                            <span className={styles.infoTituloSecao}>Ordem de serviço criada</span>
                                            <p><strong>Título:</strong> {tituloOs}</p>
                                            <p><strong>Prioridade:</strong> {prioridade}</p>
                                            <p><strong>Prazo estimado:</strong> {prazoEstimado || '—'}</p>
                                            <p><strong>Previsão de início:</strong> {previsaoInicio ? new Date(previsaoInicio).toLocaleString('pt-BR') : '—'}</p>
                                            <p><strong>Descrição do serviço:</strong> {descricaoServico}</p>
                                        </div>
                                    </div>
                                </div>

                                {erroPrestadores && <div className={`${styles.mensagem} ${styles.erro}`}>{erroPrestadores}</div>}

                                {carregandoPrestadores ? (
                                    <p className={styles.avisoTexto}>Carregando prestadores compatíveis...</p>
                                ) : prestadores.length === 0 ? (
                                    <div className={styles.semPrestadores}>
                                        <span>Nenhum prestador compatível com essa categoria está disponível agora.</span>
                                        <button className={styles.btnCancelar} onClick={() => router.push('/ordens')}>
                                            Atribuir prestador mais tarde
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.prestadorLista}>
                                        {prestadores.map(p => (
                                            <div key={p.usuarioid} className={styles.prestadorCard}>
                                                <div className={styles.prestadorInfo}>
                                                    <span className={styles.prestadorNome}>{p.nome}{p.cargo ? ` — ${p.cargo}` : ''}</span>
                                                    <span className={styles.prestadorContato}>{p.email}{p.telefone ? ` • ${p.telefone}` : ''}</span>
                                                    <div className={styles.prestadorBadges}>
                                                        <span className={p.os_em_aberto === 0 ? styles.badgeOcioso : styles.badgeOcupado}>
                                                            {p.os_em_aberto} OS em aberto
                                                        </span>
                                                        {p.categorias?.map(c => (
                                                            <span key={c.categoriaid} className={styles.badgeCategoria}>{c.nome}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    className={styles.btnEscolherPrestador}
                                                    onClick={() => handleEscolherPrestador(p.usuarioid)}
                                                    disabled={vinculandoId !== null}
                                                >
                                                    {vinculandoId === p.usuarioid ? 'Vinculando...' : 'Escolher'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {etapa === 'formulario' && (
                            <>
                                {/* referência da ocorrência de origem */}
                                <div className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <h3 className={styles.cardTitulo}>Dados da ocorrência (origem)</h3>
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

                                {/* detalhes da OS, preenchidos antes de criar */}
                                <div className={styles.card}>
                                    <h3 className={styles.cardTitulo}>Detalhes da Ordem de Serviço</h3>
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
                            </>
                        )}

                    </div>

                    {/* SIDEBAR DIREITA */}
                    <div className={styles.sidebar}>

                        {/* LINHA DO TEMPO */}
                        <div className={styles.sideCard}>
                            <h4 className={styles.sideCardTitulo}>Linha do tempo da OS</h4>
                            <div className={styles.timeline}>
                                {ETAPAS.map((etapaItem, i) => (
                                    <div key={i} className={styles.timelineItem}>
                                        <div className={styles.timelineLinha}>
                                            <div className={`${styles.timelineDot} ${etapaItem.concluida ? styles.timelineDotOk : styles.timelineDotPendente}`}>
                                                {etapaItem.concluida && <span className={styles.timelineCheck}>✓</span>}
                                            </div>
                                            {i < ETAPAS.length - 1 && <div className={styles.timelineConector} />}
                                        </div>
                                        <div className={styles.timelineTexto}>
                                            <p className={`${styles.timelineLabel} ${etapaItem.concluida ? styles.timelineLabelOk : ''}`}>{etapaItem.label}</p>
                                            <p className={styles.timelineSub}>{etapaItem.sub}</p>
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
