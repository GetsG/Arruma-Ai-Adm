'use client'
import Nav from "../components/Nav/Nav";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css"
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { useState } from "react";
import { selectSx } from "../styles/selectSX";

export default function usuarios(){

    useAuth();
    const [tipo, setTipo] = useState("todas");
    const [cargo, setCargo] = useState("todas");
    const [nivel, setNivel] = useState("todas");
    const [status, setStatus] = useState("todas");
    
    return(

        <div className={styles.container}>

        <Nav tela="usuarios"/>

        <main>
            <div className={styles.search}>
                <input type="search" placeholder="Buscar usuário, equipe, cargo ou email..."/>
                <button>+ Novo Usuário</button>
            </div>

            <div className={styles.titleDescription}>
                <h2>Usuários</h2>
                <p>Gerencie usuários, equipes e permissões de acesso ao sistema.</p>
            </div>

            <div className={styles.selects}>

                    <FormControl sx={selectSx}>
                        <InputLabel>Tipo</InputLabel>
                        <Select label="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                            <MenuItem value="todas">Todas</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={selectSx}>
                        <InputLabel>Cargo / Setor</InputLabel>
                        <Select label="Cargo / Setor" value={cargo} onChange={(e) => setCargo(e.target.value)}>
                            <MenuItem value="todas">Todas</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={selectSx}>
                        <InputLabel>Nivel de acesso</InputLabel>
                        <Select label="Nivel de acesso" value={nivel} onChange={(e) => setNivel(e.target.value)}>
                            <MenuItem value="todas">Todas</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={selectSx}>
                        <InputLabel>Status</InputLabel>
                        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <MenuItem value="todas">Todas</MenuItem>
                        </Select>
                    </FormControl>

                    <button className={styles.buttonRemoveFilters}>Limpar filtros</button>

            </div>




        </main>

        </div>
    );
}