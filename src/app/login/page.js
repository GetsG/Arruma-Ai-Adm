'use client'

import { useLogin } from "@/hooks/useLogin"

import styles from "./page.module.css"

import Image from "next/image"
import Logo from "../../../public/Logo/Logo.png"

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function Login(){

    const { register, handleSubmit, onSubmit, errors } = useLogin()

    return(
        <div className={styles.pageContainer}>

            {/* LOGO */}
            <div className={styles.containerLogo}>
                <Image className={styles.logo} src={Logo} alt="Logo"/>
                <h2>ARRUMA AI</h2>
                <p> 
                    <AdminPanelSettingsIcon sx={{color: "#fff"}}/>
                    Painel Administrativo
                </p>
            </div>

            <main className={styles.loginContainer}>

                <h2 className={styles.title}>Entrar no Painel</h2>

                {/* FORMULÁRIO */}
                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    {/* INPUT EMAIL */}
                    <div className={styles.formGroup}>
                        <p>Email administrativo</p>
                        <input {...register('email')} />
                        {errors.email && <p className={styles.erros}>{errors.email.message}</p>}

                    </div>
                    
                    {/* INPUT SENHA */}
                    <div className={styles.formGroup}>
                        <p>Senha</p>
                        <input type="password" {...register('senha')} />
                        {errors.senha && <p className={styles.erros}>{errors.senha.message}</p>}
                    </div>

                    {errors.acesso && <p className={styles.erros}>{errors.acesso.message}</p>}


                    {/* FORM OPTIONS */}
                    <div className={styles.formOptions}>
                        {/* CHECKBOX */}
                        <div className={styles.checkboxContainer}>
                            <input type="checkbox" {...register('lembrar')} />
                            <label>Lembrar de mim</label>
                        </div>

                        {/* ESQUECI A SENHA */}
                        <p className={styles.forgotPassword}>Esqueci a senha</p>
                    </div> 

                    {/* BOTÃO ACESSAR SISTEMA */}
                    <button type="submit" className={styles.submitButton}>Entrar</button>
                </form>

                {/* ERROS */}
                
                

                

            </main>
        </div>
    )
}