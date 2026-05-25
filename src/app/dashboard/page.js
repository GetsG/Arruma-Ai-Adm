'use client'
import { useAuth } from "@/hooks/useAuth";
import Nav from "../components/Nav/Nav";
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { useState } from "react";
import styles from "./page.module.css"
import { selectSx } from "../styles/selectSX";


export default function dashboard(){

    useAuth()
    const [status, setStatus] = useState("todas");
    const [categoria, setCategoria] = useState("todas");
    const [prioridade, setPrioridade] = useState("todas");
    const [equipe, setEquipe] = useState("todas");
    const [bairro, setBairro] = useState("todas");
    const [regiao, setRegiao] = useState("todas");
    const [periodo, setPeriodo] = useState("todas");
    const [tipoVia, setTipoVia] = useState("todas");

    return(

        <div className={styles.container}>

        <Nav tela="dashboard"/>

        <main>

            <div className={styles.titleDescription}>
                <h2>Dashboard</h2>
                <p>Visão geral da cidade em tempo real. Gerencia ocorrências, prioridades e equipes com mais eficiência.</p>
            </div>

            <div className={styles.selects}>
                <FormControl sx={selectSx}>
                    <InputLabel>Status</InputLabel>
                    <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <MenuItem value="todas">Todas</MenuItem>
                    </Select>
                </FormControl>

                <FormControl sx={selectSx}>
                    <InputLabel>Categoria</InputLabel>
                    <Select label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                        <MenuItem value="todas">Todas</MenuItem>
                    </Select>
                </FormControl>

                <FormControl sx={selectSx}>
                    <InputLabel>Prioridade</InputLabel>
                    <Select label="Prioridade" value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
                        <MenuItem value="todas">Todas</MenuItem>
                    </Select>
                </FormControl>

                <FormControl sx={selectSx}>
                    <InputLabel>Equipe</InputLabel>
                    <Select label="Equipe" value={equipe} onChange={(e) => setEquipe(e.target.value)}>
                        <MenuItem value="todas">Todas</MenuItem>
                    </Select>
                </FormControl>

                <FormControl sx={selectSx}>
                    <InputLabel>Bairro</InputLabel>
                    <Select label="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)}>
                        <MenuItem value="todas">Todas</MenuItem>
                    </Select>
                </FormControl>

                <FormControl sx={selectSx}>
                    <InputLabel>Região</InputLabel>
                    <Select label="Região" value={regiao} onChange={(e) => setRegiao(e.target.value)}>
                        <MenuItem value="todas">Todas</MenuItem>
                    </Select>
                </FormControl>

                <FormControl sx={selectSx}>
                    <InputLabel>Período</InputLabel>
                    <Select label="Período" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                        <MenuItem value="todas">Todas</MenuItem>
                    </Select>
                </FormControl>

                <FormControl sx={selectSx}>
                    <InputLabel>Tipo de via</InputLabel>
                    <Select label="Tipo de via" value={tipoVia} onChange={(e) => setTipoVia(e.target.value)}>
                        <MenuItem value="todas">Todas</MenuItem>
                    </Select>
                </FormControl>
            </div>

        </main>

        </div>

    );
}
