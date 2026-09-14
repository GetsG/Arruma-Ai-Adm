'use client'
import { useEffect, useState } from "react"
import Nav from "../components/Nav/Nav"
import { useAuth } from "@/hooks/useAuth"
import { meuPerfil, atualizarPerfil } from "../services/users"
import styles from "./page.module.css"

const TIPO_LABEL = {
    admin: 'Administrador',
    prestador: 'Prestador',
    cidadao: 'Cidadão',
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
    return AVATAR_CORES[(id || 0) % AVATAR_CORES.length]
}

export default function Configuracoes() {
    useAuth()

    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [mensagem, setMensagem] = useState(null)
    const [erros, setErros] = useState({})

    const [usuario, setUsuario] = useState(null)
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [telefone, setTelefone] = useState('')
    const [cargo, setCargo] = useState('')
    const [novaSenha, setNovaSenha] = useState('')

    useEffect(() => {
        meuPerfil()
            .then(u => {
                setUsuario(u)
                setNome(u.nome || '')
                setEmail(u.email || '')
                setTelefone(u.telefone || '')
                setCargo(u.cargo || '')
            })
            .catch(err => console.error('Erro ao buscar perfil:', err))
            .finally(() => setCarregando(false))
    }, [])

    function limparErro(campo) {
        setErros(prev => ({ ...prev, [campo]: undefined }))
    }

    function validar() {
        const novosErros = {}
        if (!nome.trim()) novosErros.nome = 'Informe o nome.'
        if (!email.trim()) novosErros.email = 'Informe o e-mail.'
        if (novaSenha && novaSenha.length < 6) novosErros.novaSenha = 'A nova senha deve ter pelo menos 6 caracteres.'
        setErros(novosErros)
        return Object.keys(novosErros).length === 0
    }

    async function handleSalvar() {
        if (!validar()) {
            setMensagem({ tipo: 'erro', texto: 'Verifique os campos destacados.' })
            setTimeout(() => setMensagem(null), 4000)
            return
        }
        setSalvando(true)
        try {
            const payload = {
                nome: nome.trim(),
                email: email.trim(),
                telefone: telefone.trim(),
                cargo: cargo.trim(),
            }
            if (novaSenha) payload.senha = novaSenha

            await atualizarPerfil(payload)
            setNovaSenha('')
            setMensagem({ tipo: 'sucesso', texto: 'Perfil atualizado com sucesso!' })
        } catch (err) {
            const motivo = err.response?.data?.message || err.response?.data?.error
            setMensagem({
                tipo: 'erro',
                texto: motivo ? `Erro ao salvar: ${motivo}` : 'Erro ao salvar. Tente novamente.',
            })
        } finally {
            setSalvando(false)
            setTimeout(() => setMensagem(null), 5000)
        }
    }

    return (
        <div className={styles.container}>
            <Nav tela="configuracoes" />

            <main>
                <div className={styles.topBar}>
                    <div>
                        <h1 className={styles.titulo}>Configurações</h1>
                        <p className={styles.subtitulo}>Gerencie os dados da sua conta de acesso ao sistema.</p>
                    </div>
                    <button className={styles.btnSalvar} onClick={handleSalvar} disabled={salvando || carregando}>
                        ✓ {salvando ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                </div>

                {mensagem && (
                    <div className={`${styles.mensagem} ${styles[mensagem.tipo]}`}>
                        {mensagem.texto}
                    </div>
                )}

                {carregando ? (
                    <div className={styles.carregando}>Carregando perfil...</div>
                ) : (
                    <div className={styles.contentArea}>

                      <div className={styles.leftCol}>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>👤 Meu perfil</h3>

                            <div className={styles.campoGroup}>
                                <label className={styles.label}>Nome completo *</label>
                                <input
                                    className={`${styles.input} ${erros.nome ? styles.campoErro : ''}`}
                                    value={nome}
                                    onChange={e => { setNome(e.target.value); limparErro('nome') }}
                                />
                                {erros.nome && <span className={styles.erroTexto}>{erros.nome}</span>}
                            </div>

                            <div className={styles.gridTres} style={{ marginTop: 16 }}>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>E-mail *</label>
                                    <input
                                        className={`${styles.input} ${erros.email ? styles.campoErro : ''}`}
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); limparErro('email') }}
                                    />
                                    {erros.email && <span className={styles.erroTexto}>{erros.email}</span>}
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Telefone</label>
                                    <input
                                        className={styles.input}
                                        value={telefone}
                                        onChange={e => setTelefone(e.target.value)}
                                        placeholder="(62) 99999-9999"
                                    />
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Cargo / Setor</label>
                                    <input
                                        className={styles.input}
                                        value={cargo}
                                        onChange={e => setCargo(e.target.value)}
                                        placeholder="Ex.: Coordenador de Obras"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>🔒 Segurança</h3>
                            <p className={styles.dica}>Deixe em branco se não quiser trocar a senha atual.</p>

                            <div className={styles.campoGroup}>
                                <label className={styles.label}>Nova senha</label>
                                <input
                                    className={`${styles.input} ${erros.novaSenha ? styles.campoErro : ''}`}
                                    type="password"
                                    value={novaSenha}
                                    onChange={e => { setNovaSenha(e.target.value); limparErro('novaSenha') }}
                                    placeholder="Defina uma nova senha"
                                />
                                {erros.novaSenha && <span className={styles.erroTexto}>{erros.novaSenha}</span>}
                            </div>
                        </div>
                      </div>

                      {/* Coluna direita */}
                      <div className={styles.rightCol}>
                        <div className={`${styles.card} ${styles.cardResumo}`}>
                            <div className={styles.perfilResumo}>
                                <div className={styles.avatar} style={{ background: corAvatar(usuario?.usuarioid) }}>
                                    {getIniciais(usuario?.nome)}
                                </div>
                                <span className={styles.perfilNome}>{usuario?.nome || '—'}</span>
                                <span className={styles.tipoBadge}>
                                    {TIPO_LABEL[usuario?.tipo] || usuario?.tipo}
                                </span>
                            </div>

                            <div className={styles.resumoSecao}>
                                <span className={styles.label}>ID da conta</span>
                                <span className={styles.resumoValor}>#{usuario?.usuarioid ?? '—'}</span>
                            </div>

                            <div className={styles.resumoSecao}>
                                <span className={styles.label}>CPF</span>
                                <span className={styles.resumoValor}>{usuario?.cpf || '—'}</span>
                            </div>
                        </div>
                      </div>

                    </div>
                )}
            </main>
        </div>
    )
}
