"use client"
import Nav from "../components/Nav/Nav";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css";
import Image from "next/image";

import BarChart from "../../../public/barchart.png";
import Arrow from "../../../public/arrow.png";
import Dunger from "../../../public/dunger.png";
import Equipe from "../../../public/equipe.png";
import Folder from "../../../public/folder.png";
import Papel from "../../../public/papel.png";
import Paste from "../../../public/paste.png";
import Timer from "../../../public/timer.png";

export default function relatorios(){

    useAuth()

    return(

        <div className={styles.container}>

            <Nav tela="relatorios"/>

            <main>

                <div className={styles.titleDescription}>
                    <h2>Dashboard</h2>
                    <p>Visão geral da cidade em tempo real. Gerencia ocorrências, prioridades e equipes com mais eficiência.</p>
                </div>

                <h3 className={styles.tittleTypesReports}>Tipos de relatório</h3>

                <div className={styles.containerReport}>

                    <button className={styles.reportTypes}>
                        <div className={styles.reports}>
                            <Image className={styles.imageReport} src={BarChart} alt="Ocorrências por período"/>

                            <div>
                                <h3>Ocorrências por periodo</h3>
                                <p>Relatório de ocorrências registradas em um periodo específico.</p>
                            </div>
                        </div>
                        <Image className={styles.imageArrow} src={Arrow} alt="seta"/>
                    </button>

                    <button className={styles.reportTypes}>
                        <div className={styles.reports}>  
                            <Image className={styles.imageReport} src={Folder} alt="Ocorrências por categoria"/>
                            <div>
                                <h3>Ocorrências por categoria</h3>
                                <p>Relatório de ocorrências agrupadas por categoria.</p>
                            </div>
                        </div>
                        <Image className={styles.imageArrow} src={Arrow} alt="seta"/>
                    </button>

                    <button className={styles.reportTypes}>
                        <div className={styles.reports}>  
                            <Image className={styles.imageReport} src={Dunger} alt="Ocorrencias Críticas"/>

                            <div>
                                <h3>Ocorrências críticas</h3>
                                <p>Relatório de ocorrências classificadas como críticas.</p>
                            </div>
                        </div>
                        <Image className={styles.imageArrow} src={Arrow} alt="seta"/>
                    </button>

                    

                    

                    <button className={styles.reportTypes}>
                        <div className={styles.reports}>
                            <Image className={styles.imageReport} src={Timer} alt="Tempo médio de resolução"/>
                            <div>
                                <h3>Tempo médio de resolução</h3>
                                <p>Relatório com o tempo médio para resolução das ocorrências.</p>
                            </div>
                        </div>
                        <Image className={styles.imageArrow} src={Arrow} alt="seta"/>
                    </button>


                    <button className={styles.reportTypes}>
                        <div className={styles.reports}>

                            <Image className={styles.imageReport} src={Equipe} alt="Eficiência das equipes"/>

                            <div>
                                <h3>Eficiência das equipes</h3>
                                <p>Relatório de desempenho e produtividade das equipes responsáveis.</p>
                            </div>
                        </div>
                        <Image className={styles.imageArrow} src={Arrow} alt="seta"/>
                    </button>

                    

                    <button className={styles.reportTypes}>
                         <div className={styles.reports}>
                            <Image className={styles.imageReport} src={Paste} alt="Relatório de OS"/>
                            <div>
                                <h3>Relatório de OS</h3>
                                <p>Relatório geral de ordens de serviço geradas e executadas.</p>
                            </div>
                        </div>
                        <Image className={styles.imageArrow} src={Arrow} alt="seta"/>
                    </button>

                    <button className={styles.reportTypes}>
                        <div className={styles.reports}>   
                            <Image className={styles.imageReport} src={Papel} alt="Relatório de denúncias agrupadas"/>
                            <div>
                                <h3>Relatório de denúncias agrupadas</h3>
                                <p>Relatório de denúncias agrupadas por local, categoria e recorrência.</p>
                            </div>
                        </div>
                        <Image className={styles.imageArrow} src={Arrow} alt="seta"/>
                    </button>

                </div>

            </main>

        </div>

    );
}