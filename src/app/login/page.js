import styles from "./page.module.css"

import Image from "next/image"
import Logo from "../../../public/Logo/Logo.png"

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function Login(){

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
                <form className={styles.form}>
                    {/* INPUT EMAIL */}
                    <div className={styles.formGroup}>
                        <p>Email administrativo</p>
                        <input/>
                    </div>
                    
                    {/* INPUT SENHA */}
                    <div className={styles.formGroup}>
                        <p>Senha</p>
                        <input/>
                    </div>

                    {/* FORM OPTIONS */}
                    <div className={styles.formOptions}>
                        {/* CHECKBOX */}
                        <div className={styles.checkboxContainer}>
                            <input type="checkbox"/>
                            <label>Lembrar de mim</label>
                        </div>

                        {/* ESQUECI A SENHA */}
                        <p className={styles.forgotPassword}>Esqueci a senha</p>
                    </div> 

                    {/* BOTÃO ACESSAR SISTEMA */}
                    <button className={styles.submitButton}>Entrar</button>
                </form>

            </main>
        </div>
    )
}