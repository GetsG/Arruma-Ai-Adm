'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { esqueciSenha, redefinirSenha } from "@/app/services/auth"

import styles from "../page.module.css"

import Image from "next/image"
import Logo from "../../../../public/Logo/Logo.png"

import MailOutlineIcon from '@mui/icons-material/MailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// recuperação de senha em duas etapas: pede o código por e-mail, depois troca a senha com esse código
export default function EsqueciSenha() {
    const router = useRouter()
    const [etapa, setEtapa] = useState('email') // email -> codigo -> concluido
    const [email, setEmail] = useState('')
    const [codigo, setCodigo] = useState('')
    const [novaSenha, setNovaSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [erro, setErro] = useState(null)

    // dispara o e-mail com o código de 5 dígitos
    async function handleEnviarEmail(e) {
        e.preventDefault()
        if (!email.trim()) {
            setErro('Informe o seu e-mail.')
            return
        }
        setErro(null)
        setIsLoading(true)
        try {
            await esqueciSenha(email.trim())
            setEtapa('codigo')
        } catch {
            setErro('Não foi possível enviar o e-mail agora. Tente novamente em alguns instantes.')
        } finally {
            setIsLoading(false)
        }
    }

    // valida o código + nova senha e chama o reset
    async function handleRedefinir(e) {
        e.preventDefault()
        if (codigo.trim().length !== 6) {
            setErro('Informe o código de 6 dígitos recebido por e-mail.')
            return
        }
        if (novaSenha.length < 6) {
            setErro('A senha deve ter pelo menos 6 caracteres.')
            return
        }
        if (novaSenha !== confirmarSenha) {
            setErro('As senhas não coincidem.')
            return
        }

        setErro(null)
        setIsLoading(true)
        try {
            await redefinirSenha(codigo.trim(), novaSenha)
            setEtapa('concluido')
        } catch {
            setErro('Código inválido ou expirado. Solicite um novo e tente de novo.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>

                {/* LOGO */}
                <div className={styles.containerLogo}>
                    <Image className={styles.logo} src={Logo} alt="Logo" />
                    <h2>Arruma Aí</h2>
                    <p>Painel Administrativo</p>
                </div>

                <main className={styles.loginContainer}>

                    {etapa === 'email' && (
                        <>
                            <div className={styles.headerTexto}>
                                <h2 className={styles.title}>Esqueci minha senha</h2>
                                <p className={styles.subtitle}>Informe o e-mail cadastrado para receber o código de verificação.</p>
                            </div>

                            <form onSubmit={handleEnviarEmail} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label>E-mail</label>
                                    <div className={`${styles.inputWrap} ${erro ? styles.inputWrapErro : ''}`}>
                                        <MailOutlineIcon sx={{ fontSize: 19 }} className={styles.inputIcone} />
                                        <input
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={e => { setEmail(e.target.value); setErro(null) }}
                                        />
                                    </div>
                                    {erro && <span className={styles.erros}>{erro}</span>}
                                </div>

                                <button type="submit" className={styles.submitButton} disabled={isLoading}>
                                    {isLoading ? 'Enviando...' : 'Enviar código'}
                                </button>

                                <button type="button" className={styles.linkVoltar} onClick={() => router.push('/login')}>
                                    <ArrowBackIcon sx={{ fontSize: 16 }} /> Voltar para o login
                                </button>
                            </form>
                        </>
                    )}

                    {etapa === 'codigo' && (
                        <>
                            <div className={styles.headerTexto}>
                                <h2 className={styles.title}>Digite o código</h2>
                                <p className={styles.subtitle}>
                                    Enviamos um código de 6 dígitos para <strong>{email}</strong>. Informe o código e a nova senha.
                                </p>
                            </div>

                            <form onSubmit={handleRedefinir} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label>Código de verificação</label>
                                    <div className={`${styles.inputWrap} ${erro ? styles.inputWrapErro : ''}`}>
                                        <input
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="000000"
                                            style={{ paddingLeft: 14, letterSpacing: '4px', textAlign: 'center', fontWeight: 700 }}
                                            value={codigo}
                                            onChange={e => { setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6)); setErro(null) }}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Nova senha</label>
                                    <div className={styles.inputWrap}>
                                        <LockOutlinedIcon sx={{ fontSize: 19 }} className={styles.inputIcone} />
                                        <input
                                            type={mostrarSenha ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={novaSenha}
                                            onChange={e => { setNovaSenha(e.target.value); setErro(null) }}
                                        />
                                        <button
                                            type="button"
                                            className={styles.botaoOlho}
                                            onClick={() => setMostrarSenha(v => !v)}
                                            tabIndex={-1}
                                            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                                        >
                                            {mostrarSenha ? <VisibilityOffIcon sx={{ fontSize: 19 }} /> : <VisibilityIcon sx={{ fontSize: 19 }} />}
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Confirmar senha</label>
                                    <div className={styles.inputWrap}>
                                        <LockOutlinedIcon sx={{ fontSize: 19 }} className={styles.inputIcone} />
                                        <input
                                            type={mostrarSenha ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={confirmarSenha}
                                            onChange={e => { setConfirmarSenha(e.target.value); setErro(null) }}
                                        />
                                    </div>
                                    {erro && <span className={styles.erros}>{erro}</span>}
                                </div>

                                <button type="submit" className={styles.submitButton} disabled={isLoading}>
                                    {isLoading ? 'Redefinindo...' : 'Redefinir senha'}
                                </button>

                                <button type="button" className={styles.linkVoltar} onClick={() => { setEtapa('email'); setErro(null) }}>
                                    <ArrowBackIcon sx={{ fontSize: 16 }} /> Reenviar código
                                </button>
                            </form>
                        </>
                    )}

                    {etapa === 'concluido' && (
                        <>
                            <div className={styles.headerTexto}>
                                <h2 className={styles.title}>Senha redefinida!</h2>
                                <p className={styles.subtitle}>Sua senha foi alterada com sucesso. Agora você já pode entrar com ela.</p>
                            </div>
                            <button type="button" className={styles.submitButton} onClick={() => router.push('/login')}>
                                Ir para o login
                            </button>
                        </>
                    )}

                </main>
            </div>
        </div>
    )
}
