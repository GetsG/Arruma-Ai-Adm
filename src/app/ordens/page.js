'use client'
import { useState, useMemo } from 'react'
import Nav from "../components/Nav/Nav"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import styles from "./page.module.css"

const LIMITE = 5

const PRIORIDADE_STYLE = {
    'Alta':     { bg: '#fee2e2', color: '#dc2626' },
    'Crítica':  { bg: '#fce7f3', color: '#db2777' },
    'Moderada': { bg: '#fef3c7', color: '#d97706' },
    'Baixa':    { bg: '#d1fae5', color: '#059669' },
}

const STATUS_COLOR = {
    'Pendente':            '#d97706',
    'Em execução':         '#16a34a',
    'Aguardando material': '#7c3aed',
    'Concluída':           '#059669',
    'Atribuída':           '#2563eb',
}

const MOCK_PENDENTES = [
    { id: 'OS-2025-0123', protocolo: '#2025-0001', categoria: 'Saneamento', bairro: 'Jardim América', endereco: 'Rua C-17, Jardim América', prioridade: 'Alta', data: '23/04/2025 08:45', prazo: '26/04/2025', status: 'Pendente', descricao: 'Vazamento de água no asfalto, causando acúmulo e risco para pedestres e veículos.', observacoes: '', foto: null },
    { id: 'OS-2025-0124', protocolo: '#2025-0002', categoria: 'Iluminação Pública', bairro: 'Vila Nova', endereco: 'Rua 10, Vila Nova', prioridade: 'Moderada', data: '23/04/2025', prazo: '27/04/2025', status: 'Pendente', descricao: 'Poste sem iluminação na esquina da rua.', observacoes: '', foto: null },
    { id: 'OS-2025-0125', protocolo: '#2025-0003', categoria: 'Vazamento de água', bairro: 'Jardim América', endereco: 'Rua C-17, Jardim América', prioridade: 'Crítica', data: '23/04/2025', prazo: '25/04/2025', status: 'Pendente', descricao: 'Vazamento forte de água na calçada.', observacoes: '', foto: null },
    { id: 'OS-2025-0126', protocolo: '#2025-0004', categoria: 'Alagamento', bairro: 'Setor Sul', endereco: 'Rua 75, Setor Sul', prioridade: 'Alta', data: '23/04/2025', prazo: '26/04/2025', status: 'Pendente', descricao: 'Alagamento na via após chuva intensa.', observacoes: '', foto: null },
    { id: 'OS-2025-0127', protocolo: '#2025-0005', categoria: 'Semáforo inoperante', bairro: 'Setor Bueno', endereco: 'Av. T-63, Setor Bueno', prioridade: 'Crítica', data: '23/04/2025', prazo: '25/04/2025', status: 'Pendente', descricao: 'Semáforo sem funcionamento em cruzamento movimentado.', observacoes: '', foto: null },
    { id: 'OS-2025-0128', protocolo: '#2025-0009', categoria: 'Buraco na via', bairro: 'Setor Oeste', endereco: 'Rua 85, Setor Oeste', prioridade: 'Alta', data: '22/04/2025', prazo: '26/04/2025', status: 'Pendente', descricao: 'Buraco grande na pista causando risco.', observacoes: '', foto: null },
    { id: 'OS-2025-0129', protocolo: '#2025-0010', categoria: 'Lixo acumulado', bairro: 'Jardim Goiás', endereco: 'Av. 136, Jardim Goiás', prioridade: 'Baixa', data: '22/04/2025', prazo: '28/04/2025', status: 'Pendente', descricao: 'Acúmulo de lixo na calçada pública.', observacoes: '', foto: null },
    { id: 'OS-2025-0130', protocolo: '#2025-0011', categoria: 'Calçada danificada', bairro: 'Setor Marista', endereco: 'Rua 14, Setor Marista', prioridade: 'Moderada', data: '21/04/2025', prazo: '27/04/2025', status: 'Pendente', descricao: 'Calçada com placas soltas e trincadas.', observacoes: '', foto: null },
    { id: 'OS-2025-0131', protocolo: '#2025-0012', categoria: 'Árvore caída', bairro: 'Setor Bueno', endereco: 'Rua 14, Setor Bueno', prioridade: 'Crítica', data: '21/04/2025', prazo: '22/04/2025', status: 'Pendente', descricao: 'Árvore caída bloqueando a via.', observacoes: '', foto: null },
    { id: 'OS-2025-0132', protocolo: '#2025-0013', categoria: 'Esgoto a céu aberto', bairro: 'Setor Norte', endereco: 'Rua 5, Setor Norte', prioridade: 'Alta', data: '20/04/2025', prazo: '24/04/2025', status: 'Pendente', descricao: 'Esgoto extravasando na rua.', observacoes: '', foto: null },
    { id: 'OS-2025-0133', protocolo: '#2025-0014', categoria: 'Sinalização', bairro: 'Setor Central', endereco: 'Av. Anhanguera, Setor Central', prioridade: 'Moderada', data: '20/04/2025', prazo: '25/04/2025', status: 'Pendente', descricao: 'Placa de trânsito danificada.', observacoes: '', foto: null },
    { id: 'OS-2025-0134', protocolo: '#2025-0015', categoria: 'Iluminação Pública', bairro: 'Setor Sul', endereco: 'Rua 40, Setor Sul', prioridade: 'Baixa', data: '19/04/2025', prazo: '26/04/2025', status: 'Pendente', descricao: 'Lâmpada queimada no poste da calçada.', observacoes: '', foto: null },
]

const MOCK_ATRIBUIDAS = [
    { id: 'OS-2025-0115', protocolo: '#2025-0006', categoria: 'Sinalização', bairro: 'Setor Bueno', endereco: 'Av. 85, Setor Bueno', equipe: 'Equipe 01', prioridade: 'Moderada', data: '22/04/2025', prazo: '25/04/2025', status: 'Em execução', descricao: 'Troca de sinalização viária na avenida.', observacoes: '', foto: null },
    { id: 'OS-2025-0114', protocolo: '#2025-0007', categoria: 'Buraco na via', bairro: 'Setor Central', endereco: 'Rua 22, Setor Central', equipe: 'Equipe 02', prioridade: 'Alta', data: '22/04/2025', prazo: '24/04/2025', status: 'Em execução', descricao: 'Tapa-buraco na via principal.', observacoes: '', foto: null },
    { id: 'OS-2025-0113', protocolo: '#2025-0008', categoria: 'Iluminação Pública', bairro: 'Setor Norte', endereco: 'Rua 8, Setor Norte', equipe: 'Equipe 06', prioridade: 'Baixa', data: '22/04/2025', prazo: '28/04/2025', status: 'Aguardando material', descricao: 'Substituição de lâmpada de sódio.', observacoes: '', foto: null },
    { id: 'OS-2025-0111', protocolo: '#2025-0010', categoria: 'Saneamento', bairro: 'Jardim América', endereco: 'Rua C-20, Jardim América', equipe: 'Equipe 03', prioridade: 'Alta', data: '21/04/2025', prazo: '23/04/2025', status: 'Em execução', descricao: 'Limpeza de bueiro entupido.', observacoes: '', foto: null },
    { id: 'OS-2025-0109', protocolo: '#2025-0012', categoria: 'Calçada danificada', bairro: 'Setor Marista', endereco: 'Rua 10, Setor Marista', equipe: 'Equipe 02', prioridade: 'Moderada', data: '19/04/2025', prazo: '24/04/2025', status: 'Aguardando material', descricao: 'Reparo de calçada danificada.', observacoes: '', foto: null },
    { id: 'OS-2025-0107', protocolo: '#2025-0016', categoria: 'Buraco na via', bairro: 'Setor Marista', endereco: 'Rua 3, Setor Marista', equipe: 'Equipe 04', prioridade: 'Alta', data: '18/04/2025', prazo: '22/04/2025', status: 'Em execução', descricao: 'Reparo de asfalto danificado.', observacoes: '', foto: null },
    { id: 'OS-2025-0106', protocolo: '#2025-0017', categoria: 'Iluminação Pública', bairro: 'Vila Nova', endereco: 'Rua 22, Vila Nova', equipe: 'Equipe 05', prioridade: 'Baixa', data: '18/04/2025', prazo: '25/04/2025', status: 'Aguardando material', descricao: 'Instalação de poste de iluminação.', observacoes: '', foto: null },
    { id: 'OS-2025-0105', protocolo: '#2025-0018', categoria: 'Saneamento', bairro: 'Setor Sul', endereco: 'Av. 24 de Outubro, Setor Sul', equipe: 'Equipe 01', prioridade: 'Crítica', data: '17/04/2025', prazo: '20/04/2025', status: 'Em execução', descricao: 'Desobstrução de rede de esgoto.', observacoes: '', foto: null },
]

const MOCK_CONCLUIDAS = [
    { id: 'OS-2025-0112', protocolo: '#2025-0009', categoria: 'Vazamento de água', bairro: 'Setor Oeste', endereco: 'Rua 3, Setor Oeste', equipe: 'Equipe 04', prioridade: 'Baixa', data: '21/04/2025', prazo: '22/04/2025', dataConclusao: '22/04/2025', status: 'Concluída', descricao: 'Reparo de vazamento de água.', observacoes: 'Serviço realizado sem intercorrências.', foto: null },
    { id: 'OS-2025-0110', protocolo: '#2025-0011', categoria: 'Alagamento', bairro: 'Vila Nova', endereco: 'Rua 15, Vila Nova', equipe: 'Equipe 05', prioridade: 'Crítica', data: '20/04/2025', prazo: '21/04/2025', dataConclusao: '21/04/2025', status: 'Concluída', descricao: 'Desobstrução de galeria de água pluvial.', observacoes: '', foto: null },
    { id: 'OS-2025-0108', protocolo: '#2025-0013', categoria: 'Semáforo', bairro: 'Setor Bueno', endereco: 'Av. T-7, Setor Bueno', equipe: 'Equipe 01', prioridade: 'Alta', data: '19/04/2025', prazo: '20/04/2025', dataConclusao: '20/04/2025', status: 'Concluída', descricao: 'Reparo de controlador semafórico.', observacoes: 'Peça substituída com sucesso.', foto: null },
    { id: 'OS-2025-0104', protocolo: '#2025-0019', categoria: 'Buraco na via', bairro: 'Setor Central', endereco: 'Av. Goiás, Setor Central', equipe: 'Equipe 02', prioridade: 'Alta', data: '15/04/2025', prazo: '18/04/2025', dataConclusao: '17/04/2025', status: 'Concluída', descricao: 'Tapa-buraco emergencial na via principal.', observacoes: 'Finalizado antes do prazo.', foto: null },
    { id: 'OS-2025-0103', protocolo: '#2025-0020', categoria: 'Iluminação Pública', bairro: 'Jardim América', endereco: 'Rua C-5, Jardim América', equipe: 'Equipe 03', prioridade: 'Moderada', data: '14/04/2025', prazo: '18/04/2025', dataConclusao: '16/04/2025', status: 'Concluída', descricao: 'Troca de lâmpada queimada.', observacoes: '', foto: null },
    { id: 'OS-2025-0102', protocolo: '#2025-0021', categoria: 'Sinalização', bairro: 'Setor Norte', endereco: 'Rua 10, Setor Norte', equipe: 'Equipe 06', prioridade: 'Baixa', data: '12/04/2025', prazo: '17/04/2025', dataConclusao: '15/04/2025', status: 'Concluída', descricao: 'Reposição de placas de trânsito.', observacoes: 'Placas instaladas conforme norma.', foto: null },
    { id: 'OS-2025-0101', protocolo: '#2025-0022', categoria: 'Calçada danificada', bairro: 'Setor Marista', endereco: 'Rua 18, Setor Marista', equipe: 'Equipe 04', prioridade: 'Moderada', data: '10/04/2025', prazo: '15/04/2025', dataConclusao: '14/04/2025', status: 'Concluída', descricao: 'Reforma de calçada com piso tátil.', observacoes: '', foto: null },
    { id: 'OS-2025-0100', protocolo: '#2025-0023', categoria: 'Saneamento', bairro: 'Setor Bueno', endereco: 'Rua 4, Setor Bueno', equipe: 'Equipe 01', prioridade: 'Alta', data: '08/04/2025', prazo: '12/04/2025', dataConclusao: '11/04/2025', status: 'Concluída', descricao: 'Limpeza de galeria pluvial.', observacoes: 'Galeria desobstruída com equipamento especial.', foto: null },
    { id: 'OS-2025-0099', protocolo: '#2025-0024', categoria: 'Alagamento', bairro: 'Vila Nova', endereco: 'Av. 136, Vila Nova', equipe: 'Equipe 02', prioridade: 'Crítica', data: '05/04/2025', prazo: '08/04/2025', dataConclusao: '07/04/2025', status: 'Concluída', descricao: 'Instalação de bomba d\'água emergencial.', observacoes: '', foto: null },
    { id: 'OS-2025-0098', protocolo: '#2025-0025', categoria: 'Buraco na via', bairro: 'Setor Oeste', endereco: 'Rua 30, Setor Oeste', equipe: 'Equipe 05', prioridade: 'Alta', data: '03/04/2025', prazo: '07/04/2025', dataConclusao: '06/04/2025', status: 'Concluída', descricao: 'Recapeamento asfáltico em trecho degradado.', observacoes: 'Serviço aprovado pela fiscalização.', foto: null },
]

function PrioridadeBadge({ prioridade }) {
    const s = PRIORIDADE_STYLE[prioridade] || { bg: '#f3f4f6', color: '#374151' }
    return (
        <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {prioridade}
        </span>
    )
}

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

export default function Ordens() {
    useAuth()
    const router = useRouter()

    const [selecionada, setSelecionada] = useState(null)
    const [paginaPendente, setPaginaPendente] = useState(1)
    const [paginaAtribuida, setPaginaAtribuida] = useState(1)
    const [paginaConcluida, setPaginaConcluida] = useState(1)
    const [busca, setBusca] = useState('')

    const pendentes = useMemo(() => {
        if (!busca) return MOCK_PENDENTES
        const b = busca.toLowerCase()
        return MOCK_PENDENTES.filter(o =>
            o.id.toLowerCase().includes(b) ||
            o.protocolo.toLowerCase().includes(b) ||
            o.categoria.toLowerCase().includes(b) ||
            o.endereco.toLowerCase().includes(b)
        )
    }, [busca])

    const atribuidas = useMemo(() => {
        if (!busca) return MOCK_ATRIBUIDAS
        const b = busca.toLowerCase()
        return MOCK_ATRIBUIDAS.filter(o =>
            o.id.toLowerCase().includes(b) ||
            o.protocolo.toLowerCase().includes(b) ||
            o.categoria.toLowerCase().includes(b) ||
            o.endereco.toLowerCase().includes(b)
        )
    }, [busca])

    const concluidas = useMemo(() => {
        if (!busca) return MOCK_CONCLUIDAS
        const b = busca.toLowerCase()
        return MOCK_CONCLUIDAS.filter(o =>
            o.id.toLowerCase().includes(b) ||
            o.protocolo.toLowerCase().includes(b) ||
            o.categoria.toLowerCase().includes(b) ||
            o.endereco.toLowerCase().includes(b)
        )
    }, [busca])

    const pendentesPagina = pendentes.slice((paginaPendente - 1) * LIMITE, paginaPendente * LIMITE)
    const atribuidasPagina = atribuidas.slice((paginaAtribuida - 1) * LIMITE, paginaAtribuida * LIMITE)
    const concluidasPagina = concluidas.slice((paginaConcluida - 1) * LIMITE, paginaConcluida * LIMITE)

    function handleSelect(os) {
        setSelecionada(prev => prev?.id === os.id ? null : os)
    }

    return (
        <div className={styles.container}>
            <Nav tela="ordemdeservico" />
            <main>

                <div className={styles.search}>
                    <input
                        type="search"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar por nº da OS, protocolo, endereço ou palavra-chave..."
                    />
                </div>

                <div className={styles.titleDescription}>
                    <h2>Ordens de Serviço</h2>
                    <p>Acompanhe e gerencie todas as ordens de serviço cadastradas.</p>
                </div>

                <div className={styles.contentArea}>
                    <div className={styles.tablesArea}>

                        {/* PENDENTES */}
                        <div className={styles.tableWrapper}>
                            <div className={styles.sectionHeader}>
                                <span className={`${styles.dot} ${styles.dotPendente}`} />
                                <span className={styles.sectionTitulo}>Pendentes de atribuição</span>
                                <span className={styles.badge}>{pendentes.length}</span>
                            </div>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.thCheck}><input type="checkbox" /></th>
                                        <th>Nº da OS</th>
                                        <th>Protocolo</th>
                                        <th>Categoria</th>
                                        <th>Endereço</th>
                                        <th>Prioridade</th>
                                        <th>Data criação</th>
                                        <th>Prazo</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendentesPagina.map(os => (
                                        <tr
                                            key={os.id}
                                            onClick={() => handleSelect(os)}
                                            className={selecionada?.id === os.id ? styles.rowSelected : ''}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td className={styles.tdCheck} onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                                            <td className={styles.osId}>{os.id}</td>
                                            <td className={styles.protocolo}>{os.protocolo}</td>
                                            <td>{os.categoria}</td>
                                            <td className={styles.tdEndereco}>{os.endereco}</td>
                                            <td><PrioridadeBadge prioridade={os.prioridade} /></td>
                                            <td>{os.data}</td>
                                            <td>{os.prazo}</td>
                                            <td className={styles.acoes} onClick={e => e.stopPropagation()}>
                                                <button title="Visualizar">👁</button>
                                                <button title="Editar" onClick={() => router.push('/ordens/criar')}>✏️</button>
                                                <button title="Mais opções">···</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Paginacao
                                pagina={paginaPendente}
                                total={pendentes.length}
                                limite={LIMITE}
                                onChange={p => { setPaginaPendente(p); setSelecionada(null) }}
                                sufixo="pendentes"
                            />
                        </div>

                        {/* ATRIBUÍDAS */}
                        <div className={`${styles.tableWrapper} ${styles.tableWrapperAtribuidas}`}>
                            <div className={styles.sectionHeader}>
                                <span className={`${styles.dot} ${styles.dotAtribuida}`} />
                                <span className={styles.sectionTitulo}>Atribuídas</span>
                                <span className={`${styles.badge} ${styles.badgeGreen}`}>{atribuidas.length}</span>
                            </div>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.thCheck}><input type="checkbox" /></th>
                                        <th>Nº da OS</th>
                                        <th>Protocolo</th>
                                        <th>Categoria</th>
                                        <th>Equipe</th>
                                        <th>Prioridade</th>
                                        <th>Status</th>
                                        <th>Data criação</th>
                                        <th>Prazo</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atribuidasPagina.map(os => (
                                        <tr
                                            key={os.id}
                                            onClick={() => handleSelect(os)}
                                            className={selecionada?.id === os.id ? styles.rowSelected : ''}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td className={styles.tdCheck} onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                                            <td className={styles.osId}>{os.id}</td>
                                            <td className={styles.protocolo}>{os.protocolo}</td>
                                            <td>{os.categoria}</td>
                                            <td>{os.equipe}</td>
                                            <td><PrioridadeBadge prioridade={os.prioridade} /></td>
                                            <td style={{ color: STATUS_COLOR[os.status] || '#6b7280', fontWeight: 500, fontSize: 13 }}>{os.status}</td>
                                            <td>{os.data}</td>
                                            <td>{os.prazo}</td>
                                            <td className={styles.acoes} onClick={e => e.stopPropagation()}>
                                                <button title="Visualizar">👁</button>
                                                <button title="Mais opções">···</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Paginacao
                                pagina={paginaAtribuida}
                                total={atribuidas.length}
                                limite={LIMITE}
                                onChange={p => { setPaginaAtribuida(p); setSelecionada(null) }}
                                sufixo="atribuídas"
                            />
                        </div>

                        {/* CONCLUÍDAS */}
                        <div className={`${styles.tableWrapper} ${styles.tableWrapperAtribuidas}`}>
                            <div className={styles.sectionHeader}>
                                <span className={`${styles.dot} ${styles.dotConcluida}`} />
                                <span className={styles.sectionTitulo}>Concluídas</span>
                                <span className={`${styles.badge} ${styles.badgeBlue}`}>{concluidas.length}</span>
                            </div>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.thCheck}><input type="checkbox" /></th>
                                        <th>Nº da OS</th>
                                        <th>Protocolo</th>
                                        <th>Categoria</th>
                                        <th>Equipe</th>
                                        <th>Prioridade</th>
                                        <th>Data criação</th>
                                        <th>Prazo</th>
                                        <th>Dt. conclusão</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {concluidasPagina.map(os => (
                                        <tr
                                            key={os.id}
                                            onClick={() => handleSelect(os)}
                                            className={selecionada?.id === os.id ? styles.rowSelected : ''}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td className={styles.tdCheck} onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                                            <td className={styles.osId}>{os.id}</td>
                                            <td className={styles.protocolo}>{os.protocolo}</td>
                                            <td>{os.categoria}</td>
                                            <td>{os.equipe}</td>
                                            <td><PrioridadeBadge prioridade={os.prioridade} /></td>
                                            <td>{os.data}</td>
                                            <td>{os.prazo}</td>
                                            <td style={{ color: '#15803D', fontWeight: 500 }}>{os.dataConclusao}</td>
                                            <td className={styles.acoes} onClick={e => e.stopPropagation()}>
                                                <button title="Visualizar">👁</button>
                                                <button title="Mais opções">···</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Paginacao
                                pagina={paginaConcluida}
                                total={concluidas.length}
                                limite={LIMITE}
                                onChange={p => { setPaginaConcluida(p); setSelecionada(null) }}
                                sufixo="concluídas"
                            />
                        </div>

                    </div>

                    {/* PAINEL LATERAL */}
                    {selecionada && (
                        <div className={styles.painel}>
                            <div className={styles.painelHeader}>
                                <span className={styles.painelTitulo}>Detalhes da OS</span>
                                <button className={styles.painelEditar} onClick={() => router.push('/ordens/criar')} title="Editar">✏️</button>
                            </div>

                            <div className={styles.painelSubheader}>
                                <span className={styles.painelOsId}>{selecionada.id}</span>
                                <span
                                    className={styles.painelStatusChip}
                                    style={{
                                        color: STATUS_COLOR[selecionada.status] || '#6b7280',
                                        background: `${STATUS_COLOR[selecionada.status]}18`,
                                    }}
                                >
                                    {selecionada.status}
                                </span>
                            </div>

                            <div className={styles.painelProtocoloRow}>
                                📍 Protocolo {selecionada.protocolo}
                            </div>

                            <div className={styles.painelFoto}>
                                {selecionada.foto
                                    ? <img src={selecionada.foto} alt="OS" />
                                    : <div className={styles.painelFotoPlaceholder} />
                                }
                            </div>

                            <div className={styles.painelGrid}>
                                <div className={styles.painelGridItem}>
                                    <span className={styles.painelLabel}>Categoria</span>
                                    <span className={styles.painelValue}>{selecionada.categoria}</span>
                                </div>
                                <div className={styles.painelGridItem}>
                                    <span className={styles.painelLabel}>Endereço</span>
                                    <span className={styles.painelValue}>{selecionada.endereco}</span>
                                </div>
                                <div className={styles.painelGridItem}>
                                    <span className={styles.painelLabel}>Bairro</span>
                                    <span className={styles.painelValue}>{selecionada.bairro}</span>
                                </div>
                                <div className={styles.painelGridItem}>
                                    <span className={styles.painelLabel}>Prioridade</span>
                                    <PrioridadeBadge prioridade={selecionada.prioridade} />
                                </div>
                                <div className={`${styles.painelGridItem} ${styles.painelGridFull}`}>
                                    <span className={styles.painelLabel}>Data de criação</span>
                                    <span className={styles.painelValue}>{selecionada.data}</span>
                                </div>
                                <div className={`${styles.painelGridItem} ${styles.painelGridFull}`}>
                                    <span className={styles.painelLabel}>Prazo</span>
                                    <span className={styles.painelValue}>{selecionada.prazo}</span>
                                </div>
                            </div>

                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>Descrição</span>
                                <p className={styles.painelDescricao}>{selecionada.descricao}</p>
                            </div>

                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>Observações</span>
                                <p className={styles.painelDescricao}>{selecionada.observacoes || '—'}</p>
                            </div>

                            <div className={styles.painelAtribuir}>
                                <button className={styles.btnAtribuir} onClick={() => router.push('/ordens/criar')}>
                                    👤 Atribuir OS
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </main>
        </div>
    )
}
