'use client'
import Nav from "../components/Nav/Nav";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css"
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { useState } from "react";
import { selectSx } from "../styles/selectSX";


export default function ocorrencias(){

    useAuth();
    const [categoria, setCategoria] = useState("todas");
    const [bairro, setBairro] = useState("todas");
    const [prioridade, setPrioridade] = useState("todas");
    const [status, setStatus] = useState("todas");
    const [periodo, setPeriodo] = useState("todas");
    
    return(

        <div className={styles.container}>

        <Nav tela="ocorrencias"/>

        <main>
            <div className={styles.search}>
                <input type="search" placeholder="Buscar por protocolo, título, endereço, bairro ou palavra-chave..."/>
                <button>+ Nova Ocorrência</button>
            </div>

            <div className={styles.titleDescription}>
                <h2>Gerenciamento de Ocorrências</h2>
                <p>Acompanhe e gerencie todas as ocorrências registradas pelos cidadãos.</p>
            </div>

            <div className={styles.selects}>

                    <FormControl sx={selectSx}>
                        <InputLabel>Categoria</InputLabel>
                        <Select label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
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
                        <InputLabel>Prioridade</InputLabel>
                        <Select label="Prioridade" value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
                            <MenuItem value="todas">Todas</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={selectSx}>
                        <InputLabel>Status</InputLabel>
                        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <MenuItem value="todas">Todas</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <FormControl className={styles.filters} sx={selectSx}>
                        <InputLabel>Periodo</InputLabel>
                        <Select label="Periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                            <MenuItem value="todas">Todas</MenuItem>
                        </Select>
                    </FormControl>

                    <button className={styles.buttonRemoveFilters}>Limpar filtros</button>
            </div>




        </main>

        </div>

    );
}