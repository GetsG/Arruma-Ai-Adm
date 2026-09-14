'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/app/components/Nav/Nav'
import { useAuth } from '@/hooks/useAuth'
import { criarUsuario } from '@/app/services/users'
import styles from './page.module.css'

const TIPOS = [
    { valor: 'admin', label: 'Administrador' },
    { valor: 'prestador', label: 'Prestador' },
]

function apenasNumeros(valor) {
    return (valor || '').replace(/\D/g, '')
}

function formatarTelefone(valor) {
    const n = apenasNumeros(valor).slice(0, 11)
    if (n.length <= 2) return n
    if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`
    if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

function formatarCPF(valor) {
    const n = apenasNumeros(valor).slice(0, 11)
    if (n.length <= 3) return n
    if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
    if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}

function validarTelefone(valor) {
    const tel = apenasNumeros(valor)
    if (tel.length !== 10 && tel.length !== 11) return false
    const ddd = Number(tel.slice(0, 2))
    if (ddd < 11 || ddd > 99) return false
    if (tel.length === 11 && tel[2] !== '9') return false
    return true
}

function validarCPF(valor) {
    const cpf = apenasNumeros(valor)
    if (cpf.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cpf)) return false

    let soma = 0
    for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i)
    let resto = (soma * 10) % 11
    if (resto >= 10) resto = 0
    if (resto !== Number(cpf[9])) return false

    soma = 0
    for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i)
    resto = (soma * 10) % 11
    if (resto >= 10) resto = 0
    if (resto !== Number(cpf[10])) return false

    return true
}

export default function NovoUsuario() {
    useAuth()
    const router = useRouter()

    const [nome, setNome] = useState('')
    const [cargo, setCargo] = useState('')
    const [email, setEmail] = useState('')
    const [telefone, setTelefone] = useState('')
    const [cpf, setCpf] = useState('')
    const [senha, setSenha] = useState('')
    const [tipo, setTipo] = useState('')
    const [salvando, setSalvando] = useState(false)
    const [mensagem, setMensagem] = useState(null)
    const [erros, setErros] = useState({})

    function limparErro(campo) {
        setErros(prev => ({ ...prev, [campo]: undefined }))
    }

    function validar() {
        const novosErros = {}
        if (!nome.trim()) novosErros.nome = 'Informe o nome completo.'
        if (!cargo.trim()) novosErros.cargo = 'Informe o cargo ou setor.'
        if (!email.trim()) novosErros.email = 'Informe o e-mail.'
        if (!telefone.trim()) novosErros.telefone = 'Informe o telefone.'
        else if (!validarTelefone(telefone)) novosErros.telefone = 'Telefone inválido. Use (DD) 9XXXX-XXXX.'
        if (!cpf.trim()) novosErros.cpf = 'Informe o CPF.'
        else if (!validarCPF(cpf)) novosErros.cpf = 'CPF inválido.'
        if (!senha.trim()) novosErros.senha = 'Defina uma senha.'
        else if (senha.trim().length < 6) novosErros.senha = 'A senha deve ter pelo menos 6 caracteres.'
        if (!tipo) novosErros.tipo = 'Selecione o tipo de usuário.'
        setErros(novosErros)
        return Object.keys(novosErros).length === 0
    }

    async function handleCadastrar() {
        if (!validar()) {
            setMensagem({ tipo: 'erro', texto: 'Preencha os campos obrigatórios antes de cadastrar.' })
            setTimeout(() => setMensagem(null), 4000)
            return
        }
        setSalvando(true)
        try {
            await criarUsuario({
                nome: nome.trim(),
                email: email.trim(),
                senha,
                telefone: telefone.trim(),
                cpf: cpf.trim(),
                tipo,
                cargo: cargo.trim(),
            })
            router.push('/usuarios')
        } catch (err) {
            const motivo = err.response?.data?.message || err.response?.data?.error
            setMensagem({
                tipo: 'erro',
                texto: motivo ? `Erro ao cadastrar usuário: ${motivo}` : 'Erro ao cadastrar usuário. Verifique os dados e tente novamente.',
            })
            setTimeout(() => setMensagem(null), 6000)
        } finally {
            setSalvando(false)
        }
    }

    return (
        <div className={styles.container}>
            <Nav tela="usuarios" />
            <main>

                <div className={styles.topBar}>
                    <div>
                        <p className={styles.breadcrumb}>
                            Usuários &gt; <span className={styles.breadcrumbAtivo}>Novo usuário</span>
                        </p>
                        <h1 className={styles.titulo}>Cadastrar Usuário</h1>
                        <p className={styles.subtitulo}>Preencha os dados abaixo para criar um novo usuário.</p>
                    </div>
                    <div className={styles.acoesTopo}>
                        <button className={styles.btnVoltar} onClick={() => router.push('/usuarios')}>
                            ← Voltar
                        </button>
                        <button className={styles.btnSalvar} onClick={handleCadastrar} disabled={salvando}>
                            ✓ {salvando ? 'Cadastrando...' : 'Cadastrar usuário'}
                        </button>
                    </div>
                </div>

                {mensagem && (
                    <div className={`${styles.mensagem} ${styles[mensagem.tipo]}`}>
                        {mensagem.texto}
                    </div>
                )}

                <div className={styles.contentArea}>

                    {/* Coluna esquerda */}
                    <div className={styles.leftCol}>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>Informações pessoais</h3>

                            <div className={styles.campoGroup}>
                                <label className={styles.label}>Nome completo *</label>
                                <input
                                    className={`${styles.input} ${erros.nome ? styles.campoErro : ''}`}
                                    value={nome}
                                    onChange={e => { setNome(e.target.value); limparErro('nome') }}
                                    placeholder="Digite o nome completo"
                                />
                                {erros.nome && <span className={styles.erroTexto}>{erros.nome}</span>}
                            </div>

                            <div className={styles.campoGroup} style={{ marginTop: 16 }}>
                                <label className={styles.label}>Cargo / Setor *</label>
                                <input
                                    className={`${styles.input} ${erros.cargo ? styles.campoErro : ''}`}
                                    value={cargo}
                                    onChange={e => { setCargo(e.target.value); limparErro('cargo') }}
                                    placeholder="Ex.: Coordenador de Obras"
                                />
                                {erros.cargo && <span className={styles.erroTexto}>{erros.cargo}</span>}
                            </div>

                            <div className={styles.gridDois} style={{ marginTop: 16 }}>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>E-mail *</label>
                                    <input
                                        className={`${styles.input} ${erros.email ? styles.campoErro : ''}`}
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); limparErro('email') }}
                                        placeholder="Digite o e-mail"
                                    />
                                    {erros.email && <span className={styles.erroTexto}>{erros.email}</span>}
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Telefone *</label>
                                    <input
                                        className={`${styles.input} ${erros.telefone ? styles.campoErro : ''}`}
                                        value={telefone}
                                        onChange={e => { setTelefone(formatarTelefone(e.target.value)); limparErro('telefone') }}
                                        placeholder="(62) 99999-9999"
                                        inputMode="numeric"
                                        maxLength={15}
                                    />
                                    {erros.telefone && <span className={styles.erroTexto}>{erros.telefone}</span>}
                                </div>
                            </div>

                            <div className={styles.gridDois} style={{ marginTop: 16 }}>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>CPF *</label>
                                    <input
                                        className={`${styles.input} ${erros.cpf ? styles.campoErro : ''}`}
                                        value={cpf}
                                        onChange={e => { setCpf(formatarCPF(e.target.value)); limparErro('cpf') }}
                                        placeholder="000.000.000-00"
                                        inputMode="numeric"
                                        maxLength={14}
                                    />
                                    {erros.cpf && <span className={styles.erroTexto}>{erros.cpf}</span>}
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Senha *</label>
                                    <input
                                        className={`${styles.input} ${erros.senha ? styles.campoErro : ''}`}
                                        type="password"
                                        value={senha}
                                        onChange={e => { setSenha(e.target.value); limparErro('senha') }}
                                        placeholder="Defina uma senha de acesso"
                                    />
                                    {erros.senha && <span className={styles.erroTexto}>{erros.senha}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna direita */}
                    <div className={styles.rightCol}>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>Tipo de usuário *</h3>
                            <div className={styles.tipoLista}>
                                {TIPOS.map(t => (
                                    <label key={t.valor} className={styles.tipoOpcao}>
                                        <input
                                            type="radio"
                                            name="tipo"
                                            value={t.valor}
                                            checked={tipo === t.valor}
                                            onChange={() => { setTipo(t.valor); limparErro('tipo') }}
                                        />
                                        {t.label}
                                    </label>
                                ))}
                            </div>
                            {erros.tipo && <span className={styles.erroTexto}>{erros.tipo}</span>}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
