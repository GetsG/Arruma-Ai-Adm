'use client'

import { useState } from "react"
import { useLogin } from "@/hooks/useLogin"

import styles from "./page.module.css"

import Image from "next/image"
import Logo from "../../../public/Logo/Logo.png"

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import BuildIcon from '@mui/icons-material/Build'
import MailOutlineIcon from '@mui/icons-material/MailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import Loading from "../components/Loading/Loading"

const TIPOS_ACESSO = [
    { valor: 'admin', label: 'Administrador', Icone: AdminPanelSettingsIcon },
    { valor: 'prestador', label: 'Prestador', Icone: BuildIcon },
]

export default function Login(){

    const { register, handleSubmit, onSubmit, errors, isLoading, tipoAcesso, setTipoAcesso } = useLogin()
    const [mostrarSenha, setMostrarSenha] = useState(false)

    return(
        <div className={styles.container}>

            {isLoading && <Loading overlay size="large" text="Entrando..." />}

            <div className={styles.card}>

                {/* LOGO */}
                <div className={styles.containerLogo}>
                    <Image className={styles.logo} src={Logo} alt="Logo"/>
                    <h2>Arruma Aí</h2>
                    <p>Painel Administrativo</p>
                </div>

                <main className={styles.loginContainer}>

                    <div className={styles.headerTexto}>
                        <h2 className={styles.title}>Entrar no Painel</h2>
                        <p className={styles.subtitle}>Escolha o tipo de acesso e informe suas credenciais.</p>
                    </div>

                    {/* TIPO DE ACESSO */}
                    <div className={styles.tipoAcesso}>
                        {TIPOS_ACESSO.map(({ valor, label, Icone }) => (
                            <button
                                key={valor}
                                type="button"
                                className={`${styles.tipoAcessoBtn} ${tipoAcesso === valor ? styles.tipoAcessoBtnAtivo : ''}`}
                                onClick={() => setTipoAcesso(valor)}
                            >
                                <Icone sx={{ fontSize: 18 }} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* FORMULÁRIO */}
                    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                        {/* INPUT EMAIL */}
                        <div className={styles.formGroup}>
                            <label>E-mail</label>
                            <div className={`${styles.inputWrap} ${errors.email ? styles.inputWrapErro : ''}`}>
                                <MailOutlineIcon sx={{ fontSize: 19 }} className={styles.inputIcone} />
                                <input placeholder="seu@email.com" {...register('email')} />
                            </div>
                            {errors.email && <span className={styles.erros}>{errors.email.message}</span>}
                        </div>

                        {/* INPUT SENHA */}
                        <div className={styles.formGroup}>
                            <label>Senha</label>
                            <div className={`${styles.inputWrap} ${errors.senha ? styles.inputWrapErro : ''}`}>
                                <LockOutlinedIcon sx={{ fontSize: 19 }} className={styles.inputIcone} />
                                <input type={mostrarSenha ? 'text' : 'password'} placeholder="••••••••" {...register('senha')} />
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
                            {errors.senha && <span className={styles.erros}>{errors.senha.message}</span>}
                        </div>

                        {errors.acesso && <div className={styles.errosGeral}>{errors.acesso.message}</div>}

                        {/* FORM OPTIONS */}
                        <div className={styles.formOptions}>
                            <label className={styles.checkboxContainer}>
                                <input type="checkbox" {...register('lembrar')} />
                                Lembrar de mim
                            </label>

                            <span className={styles.forgotPassword}>Esqueci a senha</span>
                        </div>

                        {/* BOTÃO ACESSAR SISTEMA */}
                        <button type="submit" className={styles.submitButton} disabled={isLoading}>
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                </main>
            </div>
        </div>
    )
}
