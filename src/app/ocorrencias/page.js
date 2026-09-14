'use client'
import Nav from "../components/Nav/Nav";
import styles from "./page.module.css"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CardReport from "../components/Report/CardReport";
import { useReport } from "@/hooks/useReport";
import { useAuth } from "@/hooks/useAuth";
import { deleteProblem } from "../services/reports";

const STATUS_COLOR = {
    'Pendente':      '#6b7280',
    'Em andamento':  '#2563eb',
    'Resolvido':     '#16a34a',
    'Em análise':    '#7c3aed',
    'Atribuído':     '#d97706',
    'Cancelado':     '#dc2626',
}

const STATUS_LISTA = Object.keys(STATUS_COLOR)

export default function ocorrencias(){

    useAuth();
    const router = useRouter();
    const [busca, setBusca] = useState("");
    const [categoria, setCategoria] = useState("todas");
    const [status, setStatus] = useState("todas");
    const [periodoInicio, setPeriodoInicio] = useState("");
    const [periodoFim, setPeriodoFim] = useState("");
    const [selecionada, setSelecionada] = useState(null);
    const [paraExcluir, setParaExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);
    const [erroExclusao, setErroExclusao] = useState(null);
    const [selecionados, setSelecionados] = useState(new Set());
    const [confirmandoLote, setConfirmandoLote] = useState(false);
    const [excluindoLote, setExcluindoLote] = useState(false);
    const [erroExclusaoLote, setErroExclusaoLote] = useState(null);

    const {
        ocorrencias, paginaAtual, setPaginaAtual, totalPaginas, total, isLoading,
        categoriasDisponiveis, removerOcorrencia,
    } = useReport({ busca, categoria, status, periodoInicio, periodoFim });

    useEffect(() => {
        setSelecionados(new Set());
    }, [paginaAtual, busca, categoria, status, periodoInicio, periodoFim]);

    function toggleSelecionado(id) {
        setSelecionados(prev => {
            const novo = new Set(prev);
            if (novo.has(id)) novo.delete(id);
            else novo.add(id);
            return novo;
        });
    }

    function toggleTodos() {
        const todosSelecionados = ocorrencias.length > 0 && ocorrencias.every(o => selecionados.has(o.problemaid));
        setSelecionados(prev => {
            const novo = new Set(prev);
            ocorrencias.forEach(o => {
                if (todosSelecionados) novo.delete(o.problemaid);
                else novo.add(o.problemaid);
            });
            return novo;
        });
    }

    function cancelarSelecao() {
        setSelecionados(new Set());
    }

    function cancelarExclusaoLote() {
        if (excluindoLote) return;
        setConfirmandoLote(false);
        setErroExclusaoLote(null);
    }

    async function confirmarExclusaoLote() {
        setExcluindoLote(true);
        setErroExclusaoLote(null);
        const ids = [...selecionados];
        const resultados = await Promise.allSettled(ids.map(id => deleteProblem(id)));
        const falhas = [];
        resultados.forEach((r, i) => {
            if (r.status === 'fulfilled') {
                removerOcorrencia(ids[i]);
                if (selecionada?.problemaid === ids[i]) setSelecionada(null);
            } else {
                falhas.push(ids[i]);
            }
        });
        setSelecionados(new Set(falhas));
        if (falhas.length > 0) {
            setErroExclusaoLote(`${falhas.length} ocorrência(s) não puderam ser excluídas. Tente novamente.`);
        } else {
            setConfirmandoLote(false);
        }
        setExcluindoLote(false);
    }

    function limparFiltros() {
        setBusca("");
        setCategoria("todas");
        setStatus("todas");
        setPeriodoInicio("");
        setPeriodoFim("");
    }

    const qtdFiltrosAtivos = [categoria !== "todas", status !== "todas", !!periodoInicio || !!periodoFim]
        .filter(Boolean).length;
    const filtrosAtivos = qtdFiltrosAtivos > 0;

    function pedirExclusao(item) {
        setErroExclusao(null);
        setParaExcluir(item);
    }

    function cancelarExclusao() {
        if (excluindo) return;
        setParaExcluir(null);
        setErroExclusao(null);
    }

    async function confirmarExclusao() {
        setExcluindo(true);
        setErroExclusao(null);
        try {
            await deleteProblem(paraExcluir.problemaid);
            removerOcorrencia(paraExcluir.problemaid);
            if (selecionada?.problemaid === paraExcluir.problemaid) setSelecionada(null);
            setParaExcluir(null);
        } catch (err) {
            setErroExclusao("Não foi possível excluir a ocorrência. Tente novamente.");
        } finally {
            setExcluindo(false);
        }
    }


    return(

        <div className={styles.container}>

        <Nav tela="ocorrencias"/>

        <main>
            <div className={styles.search}>
                <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por protocolo, título, endereço, bairro ou palavra-chave..."/>
                <button onClick={() => router.push('/ocorrencias/criar')}>+ Nova Ocorrência</button>
            </div>

            <div className={styles.titleDescription}>
                <h2>Gerenciamento de Ocorrências</h2>
                <p>Acompanhe e gerencie todas as ocorrências registradas pelos cidadãos.</p>
            </div>

            <div className={styles.filtrosCard}>
                <div className={styles.filtrosHeader}>
                    <div className={styles.filtrosTituloWrap}>
                        <span className={styles.filtrosIcone}>🔍</span>
                        <span className={styles.filtrosTitulo}>Filtros</span>
                        {filtrosAtivos && (
                            <span className={styles.filtrosBadge}>{qtdFiltrosAtivos}</span>
                        )}
                    </div>
                    <button
                        className={styles.buttonRemoveFilters}
                        onClick={limparFiltros}
                        disabled={!filtrosAtivos}
                    >
                        ✕ Limpar filtros
                    </button>
                </div>

                <div className={styles.filtrosGrid}>

                    <div className={styles.campoFiltro}>
                        <label className={styles.filtroLabel}>Categoria</label>
                        <select
                            className={styles.filtroSelect}
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                        >
                            <option value="todas">Todas as categorias</option>
                            {categoriasDisponiveis.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.campoFiltro}>
                        <label className={styles.filtroLabel}>Status</label>
                        <select
                            className={styles.filtroSelect}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="todas">Todos os status</option>
                            {STATUS_LISTA.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.campoFiltro}>
                        <label className={styles.filtroLabel}>Período</label>
                        <div className={styles.periodoStackNovo}>
                            <div className={styles.periodoLinha}>
                                <span className={styles.periodoTag}>De</span>
                                <input
                                    type="date"
                                    className={styles.filtroDateInput}
                                    value={periodoInicio}
                                    max={periodoFim || undefined}
                                    onChange={(e) => setPeriodoInicio(e.target.value)}
                                />
                            </div>
                            <div className={styles.periodoLinha}>
                                <span className={styles.periodoTag}>Até</span>
                                <input
                                    type="date"
                                    className={styles.filtroDateInput}
                                    value={periodoFim}
                                    min={periodoInicio || undefined}
                                    onChange={(e) => setPeriodoFim(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className={styles.contentArea}>
                <div className={styles.tableArea}>
                    {selecionados.size > 0 && (
                        <div className={styles.barraSelecao}>
                            <span className={styles.barraSelecaoTexto}>
                                {selecionados.size} {selecionados.size === 1 ? 'ocorrência selecionada' : 'ocorrências selecionadas'}
                            </span>
                            <div className={styles.barraSelecaoAcoes}>
                                <button className={styles.btnCancelarSelecao} onClick={cancelarSelecao}>
                                    Cancelar seleção
                                </button>
                                <button className={styles.btnExcluirLote} onClick={() => setConfirmandoLote(true)}>
                                    🗑️ Excluir selecionadas
                                </button>
                            </div>
                        </div>
                    )}
                    <CardReport
                        ocorrencias={ocorrencias}
                        paginaAtual={paginaAtual}
                        totalPaginas={totalPaginas}
                        onPaginaChange={setPaginaAtual}
                        total={total}
                        onSelect={setSelecionada}
                        selecionada={selecionada}
                        onEdit={(id) => router.push(`/ocorrencias/editar/${id}`)}
                        onDelete={pedirExclusao}
                        isLoading={isLoading}
                        selecionados={selecionados}
                        onToggleSelecionado={toggleSelecionado}
                        onToggleTodos={toggleTodos}
                    />
                </div>

                {selecionada && (
                    <div className={styles.painel}>
                        <div className={styles.painelHeader}>
                            <span className={styles.painelTitulo}>Detalhes da ocorrência</span>
                            <button className={styles.painelEditar} title="Editar">✏️</button>
                        </div>

                        <div className={styles.painelSubheader}>
                            <span className={styles.painelProtocolo}>{selecionada.protocolo}</span>
                            <span
                                className={styles.painelStatusChip}
                                style={{ color: STATUS_COLOR[selecionada.status] || '#6b7280', background: `${STATUS_COLOR[selecionada.status]}18` || '#f3f4f6' }}
                            >
                                {selecionada.status}
                            </span>
                        </div>

                        {selecionada.endereco !== '-' && (
                            <div className={styles.painelEndereco}>
                                📍 {selecionada.endereco}
                            </div>
                        )}

                        <div className={styles.painelFoto}>
                            {selecionada.fotos?.length > 0
                                ? <img src={selecionada.fotos[0]} alt="Foto da ocorrência" />
                                : <div className={styles.painelFotoPlaceholder} />
                            }
                        </div>

                        <div className={styles.painelGrid}>
                            <div className={styles.painelGridItem}>
                                <span className={styles.painelLabel}>Categoria</span>
                                <span className={styles.painelValue}>{selecionada.categoria}</span>
                            </div>
                            <div className={styles.painelGridItem}>
                                <span className={styles.painelLabel}>Status</span>
                                <span style={{ fontSize: 13, fontWeight: 500, color: STATUS_COLOR[selecionada.status] || '#6b7280' }}>
                                    {selecionada.status}
                                </span>
                            </div>
                            <div className={styles.painelGridItem} style={{ gridColumn: '1 / -1' }}>
                                <span className={styles.painelLabel}>Data de criação</span>
                                <span className={styles.painelValue}>{selecionada.data}</span>
                            </div>
                        </div>

                        <div className={styles.painelSecao}>
                            <span className={styles.painelLabel}>Descrição</span>
                            <p className={styles.painelDescricao}>{selecionada.titulo}</p>
                        </div>

                        <div className={styles.painelSecao}>
                            <span className={styles.painelLabel}>Endereço</span>
                            <span className={styles.painelValue}>{selecionada.endereco}</span>
                        </div>

                        {selecionada.ponto_referencia && (
                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>Ponto de referência</span>
                                <span className={styles.painelValue}>{selecionada.ponto_referencia}</span>
                            </div>
                        )}

                        {selecionada.fotos?.length > 0 && (
                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>Anexos</span>
                                <div className={styles.painelAnexos}>
                                    {selecionada.fotos.map((foto, i) => (
                                        <img key={i} src={foto} alt={`Anexo ${i + 1}`} className={styles.painelAnexoImg} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {paraExcluir && (
                <div className={styles.modalOverlay} onClick={cancelarExclusao}>
                    <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                        <h3>Excluir ocorrência?</h3>
                        <p>
                            Essa ação não pode ser desfeita. A ocorrência{' '}
                            <strong>{paraExcluir.protocolo}</strong> — {paraExcluir.titulo} — será
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

            {confirmandoLote && (
                <div className={styles.modalOverlay} onClick={cancelarExclusaoLote}>
                    <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                        <h3>Excluir {selecionados.size} {selecionados.size === 1 ? 'ocorrência' : 'ocorrências'}?</h3>
                        <p>
                            Essa ação não pode ser desfeita. As ocorrências selecionadas serão
                            removidas permanentemente.
                        </p>
                        {erroExclusaoLote && <p className={styles.modalErro}>{erroExclusaoLote}</p>}
                        <div className={styles.modalAcoes}>
                            <button
                                className={styles.modalCancelarBtn}
                                onClick={cancelarExclusaoLote}
                                disabled={excluindoLote}
                            >
                                Cancelar
                            </button>
                            <button
                                className={styles.modalExcluirBtn}
                                onClick={confirmarExclusaoLote}
                                disabled={excluindoLote}
                            >
                                {excluindoLote ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </main>

        </div>

    );
}
