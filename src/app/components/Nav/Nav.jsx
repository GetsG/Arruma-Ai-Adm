import styles from "./Nav.module.css"

import Image from "next/image";

import Logo from "../../../../public/Logo/Logo.png"


import GridViewIcon from '@mui/icons-material/GridView';            //Dashboard
import WarningAmberIcon from '@mui/icons-material/WarningAmber';    //Ocorrências
import ReceiptIcon from '@mui/icons-material/Receipt';              //Ordem De Serviço
import BarChartIcon from '@mui/icons-material/BarChart';            //Relatórios
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';          //Usuários
import SettingsIcon from '@mui/icons-material/Settings';            //Configurações

export default function Nav({tela}){
    return(
        <nav className={styles.navItems}>

            <div className={styles.componentLogo}>
                <Image className={styles.logo} src={Logo} alt="Logo"/>
                <h2>Arruma Aí</h2>
            </div>

            <a href="/dashboard" className={`${styles.navItem} ${tela === "dashboard" ? styles.navItemSelected : ""}`}>
                <GridViewIcon sx={{color: tela === "dashboard" ? "#fff" : "#6b7280"}}/>
                <p>Dashboard</p>
            </a>

            <a href="/ocorrencias" className={`${styles.navItem} ${tela === "ocorrencias" ? styles.navItemSelected : ""}`}>
                <WarningAmberIcon sx={{color: tela === "ocorrencias" ? "#fff" : "#6b7280"}}/>
                <p>Ocorrências</p>
            </a>

            <a href="/ordens" className={`${styles.navItem} ${tela === "ordemdeservico" ? styles.navItemSelected : ""}`}>
                <ReceiptIcon sx={{color: tela === "ordemdeservico" ? "#fff" : "#6b7280"}}/>
                <p>Ordens de Serviço</p>
            </a>

            <a href="/relatorios" className={`${styles.navItem} ${tela === "relatorios" ? styles.navItemSelected : ""}`}>
                <BarChartIcon sx={{color: tela === "relatorios" ? "#fff" : "#6b7280"}}/>
                <p>Relatórios</p>
            </a>

            <a href="/usuarios" className={`${styles.navItem} ${tela === "usuarios" ? styles.navItemSelected : ""}`}>
                <PeopleAltIcon sx={{color: tela === "usuarios" ? "#fff" : "#6b7280"}}/>
                <p>Usuários</p>
            </a>

            <a href="/configuracoes" className={`${styles.navItem} ${tela === "configuracoes" ? styles.navItemSelected : ""}`}>
                <SettingsIcon sx={{color: tela === "configuracoes" ? "#fff" : "#6b7280"}}/>
                <p>Configurações</p>
            </a>

        </nav>
    )
}