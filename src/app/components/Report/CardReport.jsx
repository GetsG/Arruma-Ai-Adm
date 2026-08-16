'use client'
import styles from './CardReport.module.css'
import Loading from '../Loading/Loading'

const statusStyle = {
    'Em análise':    styles.emAnalise,
    'Atribuída':     styles.atribuida,
    'Aguardando OS': styles.aguardandoOS,
    'Nova':          styles.nova,
    'Em execução':   styles.emExecucao,
    'Concluída':     styles.concluida,
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
    isLoading = false,
}) {
    const inicio = total > 0 ? (paginaAtual - 1) * 10 + 1 : 0
    const fim = Math.min(paginaAtual * 10, total)

    return (
        <div className={styles.tableWrapper}>
            <div className={styles.listHeader}>
                <span>Lista de ocorrências</span>
                <span className={styles.listCount}>{total}</span>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.thCheck}><input type="checkbox" /></th>
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
                    ) : ocorrencias.map((item, index) => (
                        <tr
                            key={index}
                            className={selecionada?.protocolo === item.protocolo ? styles.rowSelected : ''}
                            onClick={() => onSelect?.(selecionada?.protocolo === item.protocolo ? null : item)}
                            style={{ cursor: 'pointer' }}
                        >
                            <td className={styles.tdCheck} onClick={e => e.stopPropagation()}>
                                <input type="checkbox" />
                            </td>
                            <td className={styles.protocolo}>{item.protocolo}</td>
                            <td className={styles.tdDescricao}>{item.titulo}</td>
                            <td>{item.categoria}</td>
                            <td className={styles.tdEndereco}>{item.endereco}</td>
                            <td>
                                <span className={`${styles.status} ${statusStyle[item.status] || ''}`}>
                                    {item.status}
                                </span>
                            </td>
                            <td>{item.data}</td>
                            <td className={styles.acoes} onClick={e => e.stopPropagation()}>
                                <button title="Visualizar">👁</button>
                                <button title="Editar" onClick={() => onEdit?.(item.problemaid)}>✏️</button>
                                <button title="Mais opções">···</button>
                            </td>
                        </tr>
                    ))}
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
