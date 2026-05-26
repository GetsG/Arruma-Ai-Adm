import styles from './CardReport.module.css'

const prioridadeStyle = {
    Alta: styles.alta,
    Critica: styles.critica,
    Moderada: styles.moderada,
    Baixa: styles.baixa,
}

const statusStyle = {
    'Em análise': styles.emAnalise,
    'Atribuída': styles.atribuida,
    'Aguardando OS': styles.aguardandoOS,
    'Nova': styles.nova,
}

export default function CardReport({ ocorrencias = [], paginaAtual = 1, totalPaginas = 1, onPaginaChange }) {
    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Protocolo</th>
                        <th>Título da ocorrência</th>
                        <th>Categoria</th>
                        <th>Bairro</th>
                        <th>Prioridade</th>
                        <th>Status</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {ocorrencias.map((item, index) => (
                        <tr key={index}>
                            <td className={styles.protocolo}>{item.protocolo}</td>
                            <td>{item.titulo}</td>
                            <td>{item.categoria}</td>
                            <td>{item.bairro}</td>
                            <td>
                                <span className={`${styles.badge} ${prioridadeStyle[item.prioridade] || ''}`}>
                                    {item.prioridade}
                                </span>
                            </td>
                            <td>
                                <span className={`${styles.status} ${statusStyle[item.status] || ''}`}>
                                    {item.status}
                                </span>
                            </td>
                            <td>{item.data}</td>
                            <td className={styles.acoes}>
                                <button title="Visualizar">👁</button>
                                <button title="Editar">✏️</button>
                                <button title="Mais opções">···</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {totalPaginas > 1 && (
                <div className={styles.paginacao}>
                    <button
                        className={styles.btnPagina}
                        onClick={() => onPaginaChange(paginaAtual - 1)}
                        disabled={paginaAtual === 1}
                    >
                        ← Anterior
                    </button>

                    <span className={styles.infoPagina}>
                        Página {paginaAtual} de {totalPaginas}
                    </span>

                    <button
                        className={styles.btnPagina}
                        onClick={() => onPaginaChange(paginaAtual + 1)}
                        disabled={paginaAtual === totalPaginas}
                    >
                        Próxima →
                    </button>
                </div>
            )}
        </div>
    )
}
