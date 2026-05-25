"use client"
import Nav from "../components/Nav/Nav";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css";
import Image from "next/image";

import BarChart from "../../../public/barchart.png";
import Arrow from "../../../public/arrow.png";
import Paste from "../../../public/paste.png";
import Timer from "../../../public/timer.png";
import Shield from "../../../public/shield.png";
import Sino from "../../../public/sino.png";
import Log from "../../../public/log.png";



export default function dashboard(){

    useAuth()

    return(

        <div className={styles.container}>

            <Nav tela="configuracoes"/>

            <main>

                <div className={styles.titleDescription}>
                    <h2>Configurações</h2>
                    <p>Gerencie os parâmetros e regras que controlam o funcionamento do sistema.</p>
                </div>

                <div className={styles.tittleTypesConfigs}>
                    <h3>Central de Configurações</h3>
                    <p>Personalize o sistema de acordo com as necessidades da sua gestão. Selecione uma das opções abaixo para começar.</p>
                </div>

                <div className={styles.containerConfigs}>

                    <button className={styles.configTypes}>
                        <div className={styles.config}>
                            <Image className={styles.imageConfig} src={Paste} alt="Categorias e Subcategorias"/>

                            <div>
                                <h3>Categorias e Subcategorias</h3>
                                <p>Crie, edite e gerencie as categorias e subcategorias usadas nas ocorrências e ordens de serviço.</p>
                            </div>
                        </div>
                        <Image className={styles.imageArrow} src={Arrow} alt="seta"/>
                    </button>

                    <button className={styles.configTypes}>
                        <div className={styles.config}>
                            <Image className={styles.imageConfig} src={Timer} alt="Prazos de Atendimento"/>

                            <div>
                                <h3>Prazos de Atendimento</h3>
                                <p>Defina prazos padrão de atendimento para cada categoria e acompanhe o cumprimento dos prazos.</p>
                            </div>
                        </div>
                        <Image className={styles.imageArrow} src={Arrow} alt="seta"/>
                    </button>

                    <button className={styles.configTypes}>
                        <div className={styles.config}>
                            <Image className={styles.imageConfig} src={Sino} alt="Notificações"/>

                            <div>
                                <h3>Notificações</h3>
                                <p>Configure regras de notificações e modelos de mensagens enviados para cidadãos e equipes.</p>
                            </div>
                        </div>
                        <Image className={styles.imageArrow} src={Arrow} alt="seta"/>
                    </button>

                    <button className={styles.configTypes}>
                        <div className={styles.config}>
                            <Image className={styles.imageConfig} src={Log} alt="Auditoria e Logs"/>

                            <div>
                                <h3>Auditoria e Logs</h3>
                                <p>Visualize logs estruturados e filtre operações realizadas por usuários no sistema.</p>
                            </div>
                        </div>
                        <Image className={styles.imageArrow} src={Arrow} alt="seta"/>
                    </button>

                    <button className={styles.configTypes}>
                        <div className={styles.config}>
                            <Image className={styles.imageConfig} src={Shield} alt="Segurança e governança"/>

                            <div>
                                <h3>Segurança e governança</h3>
                                <p>Todas as alterações realizadas nas configurações são registradas e podem ser auditadas.</p>
                            </div>
                        </div>
                        <Image className={styles.imageArrow} src={Arrow} alt="seta"/>
                    </button>

                </div>

            </main>

        </div>

    );
}