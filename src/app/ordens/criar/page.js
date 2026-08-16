'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '../../components/Nav/Nav'
import { useAuth } from '@/hooks/useAuth'
import styles from './page.module.css'

const ETAPAS = [
    { label: 'OS criada', sub: 'Aguardando atribuição', concluida: true },
    { label: 'Atribuída à equipe', sub: 'Pendente', concluida: false },
    { label: 'Em andamento', sub: 'Pendente', concluida: false },
    { label: 'Concluída', sub: 'Pendente', concluida: false },
]

export default function CriarOS() {
    useAuth()
    const router = useRouter()

    const [descServico, setDescServico] = useState('')
    const [observacoes, setObservacoes] = useState('')

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
                        <button className={styles.btnCriar}>
                            + Criar OS
                        </button>
                    </div>
                </div>

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
                                    <input className={styles.inputReadonly} value="#2025-00421" readOnly />
                                </div>
                                <div className={styles.campo}>
                                    <label>Data/Hora da ocorrência</label>
                                    <input className={styles.inputReadonly} value="13/05/2025 10:45" readOnly />
                                </div>
                                <div className={styles.campo}>
                                    <label>Categoria</label>
                                    <input className={styles.inputReadonly} value="Buraco em via" readOnly />
                                </div>
                                <div className={styles.campo}>
                                    <label>Subcategoria</label>
                                    <input className={styles.inputReadonly} value="Asfalto" readOnly />
                                </div>
                            </div>
                            <div className={styles.gridDoisDesc}>
                                <div className={styles.campo}>
                                    <label>Descrição da ocorrência</label>
                                    <textarea
                                        className={`${styles.textarea} ${styles.textareaReadonly}`}
                                        defaultValue="Grande buraco na via causando risco aos motoristas e pedestres."
                                        rows={4}
                                        readOnly
                                    />
                                </div>
                                <div className={styles.campo}>
                                    <label>Foto enviada pelo cidadão</label>
                                    <div className={styles.fotoBox}>
                                        <div className={styles.fotoPlaceholder} />
                                        <button className={styles.verFoto}>👁 Ver foto</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SEÇÃO 2 */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>2. Detalhes da Ordem de Serviço</h3>
                            <div className={styles.gridTres}>
                                <div className={styles.campo}>
                                    <label>Título da OS <span className={styles.req}>*</span></label>
                                    <input className={styles.input} placeholder="Ex.: Reparar buraco na via" />
                                </div>
                                <div className={styles.campo}>
                                    <label>Prioridade <span className={styles.req}>*</span></label>
                                    <select className={styles.select}>
                                        <option value="">Selecione a prioridade</option>
                                        <option>Baixa</option>
                                        <option>Moderada</option>
                                        <option>Alta</option>
                                        <option>Crítica</option>
                                    </select>
                                </div>
                                <div className={styles.campo}>
                                    <label>Prazo estimado</label>
                                    <input className={styles.input} type="date" placeholder="Selecione uma data" />
                                </div>
                            </div>
                            <div className={styles.gridTres}>
                                <div className={styles.campo}>
                                    <label>Tipo de serviço <span className={styles.req}>*</span></label>
                                    <select className={styles.select}>
                                        <option value="">Selecione o tipo de serviço</option>
                                        <option>Manutenção</option>
                                        <option>Reparo</option>
                                        <option>Instalação</option>
                                        <option>Vistoria</option>
                                    </select>
                                </div>
                                <div className={styles.campo}>
                                    <label>Status inicial <span className={styles.req}>*</span></label>
                                    <select className={styles.select}>
                                        <option value="">Selecione o status</option>
                                        <option>Pendente</option>
                                        <option>Em execução</option>
                                        <option>Aguardando material</option>
                                    </select>
                                </div>
                                <div className={styles.campo}>
                                    <label>Risco</label>
                                    <select className={styles.select}>
                                        <option value="">Selecione o risco</option>
                                        <option>Baixo</option>
                                        <option>Médio</option>
                                        <option>Alto</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.campo}>
                                <label>Descrição do serviço / Tarefa <span className={styles.req}>*</span></label>
                                <div className={styles.textareaWrapper}>
                                    <textarea
                                        className={styles.textarea}
                                        placeholder="Descreva o serviço que deverá ser executado..."
                                        rows={4}
                                        value={descServico}
                                        onChange={e => setDescServico(e.target.value.slice(0, 1000))}
                                    />
                                    <span className={styles.charCount}>{descServico.length} / 1000 caracteres</span>
                                </div>
                            </div>
                        </div>

                        {/* SEÇÃO 3 */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>3. Localização da execução</h3>
                            <div className={styles.gridQuatro}>
                                <div className={styles.campo}>
                                    <label>CEP <span className={styles.req}>*</span></label>
                                    <input className={styles.input} placeholder="Ex.: 74043-010" />
                                </div>
                                <div className={styles.campo}>
                                    <label>Endereço <span className={styles.req}>*</span></label>
                                    <input className={styles.input} placeholder="Ex.: Av. Anhanguera" />
                                </div>
                                <div className={styles.campo}>
                                    <label>Número</label>
                                    <input className={styles.input} placeholder="Ex.: 1234" />
                                </div>
                                <div className={styles.campo}>
                                    <label>Complemento</label>
                                    <input className={styles.input} placeholder="Ex.: Qd. 12, Lt. 5" />
                                </div>
                                <div className={styles.campo}>
                                    <label>Bairro <span className={styles.req}>*</span></label>
                                    <input className={styles.input} placeholder="Ex.: Setor Central" />
                                </div>
                                <div className={styles.campo}>
                                    <label>Cidade <span className={styles.req}>*</span></label>
                                    <select className={styles.select}>
                                        <option>Goiânia</option>
                                    </select>
                                </div>
                                <div className={styles.campo}>
                                    <label>Estado <span className={styles.req}>*</span></label>
                                    <select className={styles.select}>
                                        <option>GO</option>
                                    </select>
                                </div>
                                <div className={styles.campo}>
                                    <label>Ponto de referência</label>
                                    <input className={styles.input} placeholder="Ex.: Em frente ao supermercado X" />
                                </div>
                            </div>
                            <div className={styles.mapaContainer}>
                                <button className={styles.btnAjustarMapa}>📍 Ajustar localização no mapa</button>
                                <div className={styles.mapaPlaceholder}>
                                    <div className={styles.mapaPin}>📍</div>
                                </div>
                            </div>
                        </div>

                        {/* SEÇÃO 4 */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>4. Observações internas (opcional)</h3>
                            <div className={styles.textareaWrapper}>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Informações adicionais, observações ou instruções internas para a equipe responsável..."
                                    rows={5}
                                    value={observacoes}
                                    onChange={e => setObservacoes(e.target.value.slice(0, 500))}
                                />
                                <span className={styles.charCount}>{observacoes.length} / 500 caracteres</span>
                            </div>
                        </div>

                    </div>

                    {/* SIDEBAR DIREITA */}
                    <div className={styles.sidebar}>

                        {/* ATRIBUIÇÃO */}
                        <div className={styles.sideCard}>
                            <h4 className={styles.sideCardTitulo}>Atribuição da equipe</h4>
                            <div className={styles.campo}>
                                <label>Equipe responsável <span className={styles.req}>*</span></label>
                                <select className={styles.select}>
                                    <option value="">Selecione uma equipe</option>
                                    <option>Equipe 01</option>
                                    <option>Equipe 02</option>
                                    <option>Equipe 03</option>
                                    <option>Equipe 04</option>
                                </select>
                            </div>
                            <div className={styles.campo}>
                                <label>Líder da equipe</label>
                                <select className={styles.select}>
                                    <option value="">Selecione o líder</option>
                                </select>
                            </div>
                            <div className={styles.campo}>
                                <label>Previsão de início</label>
                                <input className={styles.input} type="date" />
                            </div>
                            <button className={styles.btnAdicionarEquipe}>+ Adicionar equipe</button>
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

                        {/* AÇÕES RÁPIDAS */}
                        <div className={styles.sideCard}>
                            <h4 className={styles.sideCardTitulo}>Ações rápidas</h4>
                            <div className={styles.acoesRapidas}>
                                <button className={styles.btnAcao}>📄 Salvar rascunho</button>
                                <button className={styles.btnAcao}>👁 Pré-visualizar OS</button>
                                <button className={styles.btnCriarDisabled} disabled>✓ Criar OS</button>
                            </div>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    )
}
