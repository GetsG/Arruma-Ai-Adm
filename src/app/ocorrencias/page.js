'use client'
import Nav from "../components/Nav/Nav";
import styles from "./page.module.css"
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { selectSx } from "../styles/selectSX";
import CardReport from "../components/Report/CardReport";
import { useReport } from "@/hooks/useReport";
import { useAuth } from "@/hooks/useAuth";

const STATUS_COLOR = {
    'Em análise':   '#7c3aed',
    'Atribuída':    '#2563eb',
    'Aguardando OS':'#d97706',
    'Nova':         '#6b7280',
    'Em execução':  '#16a34a',
    'Concluída':    '#16a34a',
}

export default function ocorrencias(){

    useAuth();
    const router = useRouter();
    const [busca, setBusca] = useState("");
    const [categoria, setCategoria] = useState("todas");
    const [status, setStatus] = useState("todas");
    const [periodo, setPeriodo] = useState("todas");
    const [selecionada, setSelecionada] = useState(null);

    const { ocorrencias, paginaAtual, setPaginaAtual, totalPaginas, total, isLoading } = useReport({ busca, categoria, status, periodo });

    function limparFiltros() {
        setBusca("");
        setCategoria("todas");
        setStatus("todas");
        setPeriodo("todas");
    }


    return(

        <div className={styles.container}>

        <Nav tela="ocorrencias"/>

        <main>
            <div className={styles.search}>
                <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por protocolo, título, endereço, bairro ou palavra-chave..."/>
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
                        <InputLabel>Status</InputLabel>
                        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <MenuItem value="todas">Todos</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl className={styles.filters} sx={selectSx}>
                        <InputLabel>Periodo</InputLabel>
                        <Select label="Periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                            <MenuItem value="todas">Todos</MenuItem>
                        </Select>
                    </FormControl>

                    <button className={styles.buttonRemoveFilters} onClick={limparFiltros}>Limpar filtros</button>
            </div>

            <div className={styles.contentArea}>
                <div className={styles.tableArea}>
                    <CardReport
                        ocorrencias={ocorrencias}
                        paginaAtual={paginaAtual}
                        totalPaginas={totalPaginas}
                        onPaginaChange={setPaginaAtual}
                        total={total}
                        onSelect={setSelecionada}
                        selecionada={selecionada}
                        onEdit={(id) => router.push(`/ocorrencias/editar/${id}`)}
                        isLoading={isLoading}
                    />
                </div>

                {selecionada && (
                    <div className={styles.painel}>
                        <div className={styles.painelHeader}>
                            <span className={styles.painelTitulo}>Detalhes da ocorrência</span>
                            <button className={styles.painelEditar} title="Editar">✏️</button>
                        </div>

                        <div className={styles.painelSubheader}>
                            <span className={styles.painelProtocolo}>{selecionada.protocolo}</span>
                            <span
                                className={styles.painelStatusChip}
                                style={{ color: STATUS_COLOR[selecionada.status] || '#6b7280', background: `${STATUS_COLOR[selecionada.status]}18` || '#f3f4f6' }}
                            >
                                {selecionada.status}
                            </span>
                        </div>

                        {selecionada.endereco !== '-' && (
                            <div className={styles.painelEndereco}>
                                📍 {selecionada.endereco}
                            </div>
                        )}

                        <div className={styles.painelFoto}>
                            {selecionada.fotos?.length > 0
                                ? <img src={selecionada.fotos[0]} alt="Foto da ocorrência" />
                                : <div className={styles.painelFotoPlaceholder} />
                            }
                        </div>

                        <div className={styles.painelGrid}>
                            <div className={styles.painelGridItem}>
                                <span className={styles.painelLabel}>Categoria</span>
                                <span className={styles.painelValue}>{selecionada.categoria}</span>
                            </div>
                            <div className={styles.painelGridItem}>
                                <span className={styles.painelLabel}>Status</span>
                                <span style={{ fontSize: 13, fontWeight: 500, color: STATUS_COLOR[selecionada.status] || '#6b7280' }}>
                                    {selecionada.status}
                                </span>
                            </div>
                            <div className={styles.painelGridItem} style={{ gridColumn: '1 / -1' }}>
                                <span className={styles.painelLabel}>Data de criação</span>
                                <span className={styles.painelValue}>{selecionada.data}</span>
                            </div>
                        </div>

                        <div className={styles.painelSecao}>
                            <span className={styles.painelLabel}>Descrição</span>
                            <p className={styles.painelDescricao}>{selecionada.titulo}</p>
                        </div>

                        <div className={styles.painelSecao}>
                            <span className={styles.painelLabel}>Endereço</span>
                            <span className={styles.painelValue}>{selecionada.endereco}</span>
                        </div>

                        {selecionada.ponto_referencia && (
                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>Ponto de referência</span>
                                <span className={styles.painelValue}>{selecionada.ponto_referencia}</span>
                            </div>
                        )}

                        {selecionada.fotos?.length > 0 && (
                            <div className={styles.painelSecao}>
                                <span className={styles.painelLabel}>Anexos</span>
                                <div className={styles.painelAnexos}>
                                    {selecionada.fotos.map((foto, i) => (
                                        <img key={i} src={foto} alt={`Anexo ${i + 1}`} className={styles.painelAnexoImg} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </main>

        </div>

    );
}
