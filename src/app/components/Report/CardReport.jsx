'use client'
import styles from './CardReport.module.css'
import Loading from '../Loading/Loading'

const statusStyle = {
    'Pendente':     styles.pendente,
    'Em andamento': styles.emAndamento,
    'Resolvido':    styles.resolvido,
    'Em análise':   styles.emAnalise,
    'Atribuído':    styles.atribuido,
    'Cancelado':    styles.cancelado,
}

const MOTIVO_BLOQUEIO_EXCLUSAO = 'Possui ordem de serviço vinculada a essa ocorrência.'

// Compara sem diferenciar acento/maiúscula (a API às vezes devolve os status de formas diferentes)
function normalizarStatus(status) {
    return (status || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function ehPendente(status) {
    return normalizarStatus(status) === 'pendente'
}

export default function CardReport({
    ocorrencias = [],
    paginaAtual = 1,
    totalPaginas = 1,
    onPaginaChange,
    total = 0,
    onSelect,
    selecionada,
    onEdit,
    onDelete,
    isLoading = false,
    selecionados,
    onToggleSelecionado,
    onToggleTodos,
}) {
    const inicio = total > 0 ? (paginaAtual - 1) * 10 + 1 : 0
    const fim = Math.min(paginaAtual * 10, total)
    const selecionaveis = ocorrencias.filter(o => ehPendente(o.status))
    const todosSelecionados = selecionaveis.length > 0 && selecionaveis.every(o => selecionados?.has(o.problemaid))

    return (
        <div className={styles.tableWrapper}>
            <div className={styles.listHeader}>
                <span>Lista de ocorrências</span>
                <span className={styles.listCount}>{total}</span>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.thCheck}>
                            <input
                                type="checkbox"
                                checked={todosSelecionados}
                                onChange={onToggleTodos}
                                disabled={selecionaveis.length === 0}
                            />
                        </th>
                        <th>Protocolo</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Endereço</th>
                        <th>Status</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={8}>
                                <Loading text="Carregando ocorrências..." />
                            </td>
                        </tr>
                    ) : ocorrencias.map((item, index) => {
                        const bloqueada = !ehPendente(item.status)
                        return (
                        <tr
                            key={index}
                            className={selecionada?.protocolo === item.protocolo ? styles.rowSelected : ''}
                            onClick={() => onSelect?.(selecionada?.protocolo === item.protocolo ? null : item)}
                            style={{ cursor: 'pointer' }}
                        >
                            <td className={styles.tdCheck} onClick={e => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={selecionados?.has(item.problemaid) || false}
                                    onChange={() => onToggleSelecionado?.(item.problemaid)}
                                    disabled={bloqueada}
                                    title={bloqueada ? MOTIVO_BLOQUEIO_EXCLUSAO : undefined}
                                />
                            </td>
                            <td className={styles.protocolo}>{item.protocolo}</td>
                            <td className={styles.tdDescricao}>{item.titulo}</td>
                            <td>{item.categoria}</td>
                            <td className={styles.tdEndereco}>{item.endereco}</td>
                            <td>
                                <span className={`${styles.status} ${statusStyle[item.status] || (normalizarStatus(item.status) === 'atribuido' ? styles.atribuido : '')}`}>
                                    {item.status}
                                </span>
                            </td>
                            <td>{item.data}</td>
                            <td className={styles.acoes} onClick={e => e.stopPropagation()}>
                                <button
                                    title="Visualizar"
                                    onClick={() => onSelect?.(selecionada?.protocolo === item.protocolo ? null : item)}
                                >
                                    👁
                                </button>
                                <button title="Editar" onClick={() => onEdit?.(item.problemaid)}>✏️</button>
                                <button
                                    className={styles.btnExcluir}
                                    title={bloqueada ? MOTIVO_BLOQUEIO_EXCLUSAO : 'Excluir'}
                                    onClick={() => !bloqueada && onDelete?.(item)}
                                    disabled={bloqueada}
                                >
                                    {bloqueada ? (
                                        <span className={styles.iconeBloqueado}>
                                            🗑️
                                            <span className={styles.cadeado}>🔒</span>
                                        </span>
                                    ) : '🗑️'}
                                </button>
                            </td>
                        </tr>
                        )
                    })}
                </tbody>
            </table>

            <div className={styles.paginacao}>
                <span className={styles.paginacaoInfo}>
                    Mostrando {inicio} a {fim} de {total} ocorrências
                </span>
                <div className={styles.paginacaoBotoes}>
                    <button
                        className={styles.btnNav}
                        onClick={() => onPaginaChange(paginaAtual - 1)}
                        disabled={paginaAtual === 1}
                    >
                        &lt;
                    </button>
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                        <button
                            key={num}
                            className={`${styles.btnNum} ${num === paginaAtual ? styles.btnNumAtivo : ''}`}
                            onClick={() => onPaginaChange(num)}
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        className={styles.btnNav}
                        onClick={() => onPaginaChange(paginaAtual + 1)}
                        disabled={paginaAtual === totalPaginas}
                    >
                        &gt;
                    </button>
                </div>
            </div>
        </div>
    )
}
