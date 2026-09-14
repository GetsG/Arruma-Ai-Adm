'use client'
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Nav from "../components/Nav/Nav"
import { useAuth } from "@/hooks/useAuth"
import { listarUsuarios } from "../services/users"
import styles from "./page.module.css"

const LIMITE = 10

const TIPOS_PERMITIDOS = ['admin', 'prestador']

const TIPO_LABEL = {
    admin: 'Administrador',
    prestador: 'Prestador',
}

const TIPO_COLOR = {
    admin: '#2563eb',
    prestador: '#16a34a',
}

const AVATAR_CORES = ['#f97316', '#8b5cf6', '#0d9488', '#2563eb', '#dc2626', '#16a34a', '#db2777']

function getIniciais(nome) {
    if (!nome) return '—'
    const partes = nome.trim().split(/\s+/)
    const primeira = partes[0]?.[0] || ''
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
    return (primeira + ultima).toUpperCase()
}

function corAvatar(id) {
    return AVATAR_CORES[id % AVATAR_CORES.length]
}

export default function Usuarios() {
    useAuth()
    const router = useRouter()

    const [usuarios, setUsuarios] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [busca, setBusca] = useState('')
    const [tipo, setTipo] = useState('todos')
    const [selecionado, setSelecionado] = useState(null)
    const [pagina, setPagina] = useState(1)

    useEffect(() => {
        setIsLoading(true)
        listarUsuarios()
            .then(data => setUsuarios(
                data.filter(u => TIPOS_PERMITIDOS.includes(u.tipo))
            ))
            .catch(err => console.error('Erro ao buscar usuários:', err))
            .finally(() => setIsLoading(false))
    }, [])

    const filtrados = useMemo(() => {
        return usuarios.filter(u => {
            if (busca) {
                const b = busca.toLowerCase()
                const bate = u.nome?.toLowerCase().includes(b)
                    || u.email?.toLowerCase().includes(b)
                    || u.cargo?.toLowerCase().includes(b)
                    || u.telefone?.toLowerCase().includes(b)
                if (!bate) return false
            }
            if (tipo !== 'todos' && u.tipo !== tipo) return false
            return true
        })
    }, [usuarios, busca, tipo])

    useEffect(() => {
        setPagina(1)
    }, [busca, tipo])

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / LIMITE))
    const usuariosPagina = filtrados.slice((pagina - 1) * LIMITE, pagina * LIMITE)
    const inicioPagina = filtrados.length > 0 ? (pagina - 1) * LIMITE + 1 : 0
    const fimPagina = Math.min(pagina * LIMITE, filtrados.length)

    const filtrosAtivos = tipo !== 'todos'

    function limparFiltros() {
        setTipo('todos')
    }

    return (
        <div className={styles.container}>
            <Nav tela="usuarios" />

            <main>
                <div className={styles.search}>
                    <input
                        type="search"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar usuário, e-mail ou telefone..."
                    />
                    <button onClick={() => router.push('/usuarios/criar')}>+ Novo Usuário</button>
                </div>

                <div className={styles.titleDescription}>
                    <h2>Usuários</h2>
                    <p>Gerencie os administradores e prestadores com acesso ao sistema.</p>
                </div>

                <div className={styles.filtrosCard}>
                    <div className={styles.filtrosHeader}>
                        <span className={styles.filtrosTitulo}>Filtros</span>
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
                            <label className={styles.filtroLabel}>Tipo</label>
                            <select className={styles.filtroSelect} value={tipo} onChange={e => setTipo(e.target.value)}>
                                <option value="todos">Todos os tipos</option>
                                {TIPOS_PERMITIDOS.map(t => (
                                    <option key={t} value={t}>{TIPO_LABEL[t]}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.contentArea}>
                    <div className={styles.tableArea}>
                        <div className={styles.tableWrapper}>
                            <div className={styles.listHeader}>
                                <span>Lista de usuários</span>
                                <span className={styles.listCount}>{filtrados.length}</span>
                            </div>

                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Usuário</th>
                                        <th>Telefone</th>
                                        <th>Tipo</th>
                                        <th className={styles.thAcoes}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan={4} className={styles.carregando}>Carregando usuários...</td></tr>
                                    ) : usuariosPagina.length === 0 ? (
                                        <tr><td colSpan={4} className={styles.carregando}>Nenhum usuário encontrado.</td></tr>
                                    ) : usuariosPagina.map(u => (
                                        <tr
                                            key={u.usuarioid}
                                            className={selecionado?.usuarioid === u.usuarioid ? styles.rowSelected : ''}
                                            onClick={() => setSelecionado(prev => prev?.usuarioid === u.usuarioid ? null : u)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>
                                                <div className={styles.usuarioCell}>
                                                    <div className={styles.avatar} style={{ background: corAvatar(u.usuarioid) }}>
                                                        {getIniciais(u.nome)}
                                                    </div>
                                                    <div className={styles.usuarioInfo}>
                                                        <span className={styles.usuarioNome}>{u.nome}</span>
                                                        <span className={styles.usuarioEmail}>{u.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{u.telefone || '—'}</td>
                                            <td>
                                                <span
                                                    className={styles.tipoBadge}
                                                    style={{ color: TIPO_COLOR[u.tipo] || '#6b7280', background: `${TIPO_COLOR[u.tipo] || '#6b7280'}18` }}
                                                >
                                                    {TIPO_LABEL[u.tipo] || u.tipo}
                                                </span>
                                            </td>
                                            <td className={styles.acoes} onClick={e => e.stopPropagation()}>
                                                <button
                                                    title="Visualizar"
                                                    onClick={() => setSelecionado(prev => prev?.usuarioid === u.usuarioid ? null : u)}
                                                >
                                                    👁
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {!isLoading && filtrados.length > 0 && (
                                <div className={styles.paginacao}>
                                    <span className={styles.paginacaoInfo}>
                                        Mostrando {inicioPagina} a {fimPagina} de {filtrados.length} usuários
                                    </span>
                                    <div className={styles.paginacaoBotoes}>
                                        <button
                                            className={styles.btnNav}
                                            onClick={() => setPagina(p => p - 1)}
                                            disabled={pagina === 1}
                                        >
                                            &lt;
                                        </button>
                                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                                            <button
                                                key={num}
                                                className={`${styles.btnNum} ${num === pagina ? styles.btnNumAtivo : ''}`}
                                                onClick={() => setPagina(num)}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                        <button
                                            className={styles.btnNav}
                                            onClick={() => setPagina(p => p + 1)}
                                            disabled={pagina === totalPaginas}
                                        >
                                            &gt;
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {selecionado && (
                        <div className={styles.painel}>
                            <div className={styles.painelHeader}>
                                <span className={styles.painelTitulo}>Detalhes do usuário</span>
                            </div>

                            <div className={styles.painelSubheader}>
                                <span className={styles.painelNome}>{selecionado.nome}</span>
                                <span
                                    className={styles.painelTipoChip}
                                    style={{ color: TIPO_COLOR[selecionado.tipo] || '#6b7280', background: `${TIPO_COLOR[selecionado.tipo] || '#6b7280'}18` }}
                                >
                                    {TIPO_LABEL[selecionado.tipo] || selecionado.tipo}
                                </span>
                            </div>

                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>E-mail</span>
                                <span className={styles.painelValue}>{selecionado.email}</span>
                            </div>

                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>Telefone</span>
                                <span className={styles.painelValue}>{selecionado.telefone || '—'}</span>
                            </div>

                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>CPF</span>
                                <span className={styles.painelValue}>{selecionado.cpf || '—'}</span>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
