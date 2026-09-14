"use client"
import { useEffect, useMemo, useState } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import Nav from "../components/Nav/Nav"
import { useAuth } from "@/hooks/useAuth"
import { reports } from "../services/reports"
import styles from "./page.module.css"
import Image from "next/image"

import BarChart from "../../../public/barchart.png"
import Arrow from "../../../public/arrow.png"
import Folder from "../../../public/folder.png"

const TIPOS_RELATORIO = [
    {
        chave: 'periodo',
        titulo: 'Ocorrências por período',
        descricao: 'Relatório de ocorrências registradas em um período específico.',
        icone: BarChart,
    },
    {
        chave: 'categoria',
        titulo: 'Ocorrências por categoria',
        descricao: 'Relatório de ocorrências agrupadas por categoria.',
        icone: Folder,
    },
]

const COR_VERDE = [45, 122, 58]
const COR_CINZA_TEXTO = [107, 114, 128]
const COR_CINZA_CLARO = [249, 250, 251]

function parseDataBR(str) {
    if (!str) return null
    const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/)
    if (!match) return null
    const [, dia, mes, ano, hora, min] = match
    return new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora || 0), Number(min || 0))
}

function baixarCSV(nomeArquivo, cabecalho, linhas) {
    const escapar = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const conteudo = [cabecalho, ...linhas].map(linha => linha.map(escapar).join(';')).join('\r\n')
    const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nomeArquivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

function cabecalhoPDF(doc, titulo, subtitulo) {
    const largura = doc.internal.pageSize.getWidth()

    doc.setFillColor(...COR_VERDE)
    doc.rect(0, 0, largura, 26, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('Arruma Aí', 14, 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Painel Administrativo', 14, 18)

    const agora = new Date().toLocaleString('pt-BR')
    doc.setFontSize(9)
    doc.text(`Gerado em ${agora}`, largura - 14, 15, { align: 'right' })

    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(titulo, 14, 36)

    if (subtitulo) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...COR_CINZA_TEXTO)
        doc.text(subtitulo, 14, 43)
    }
}

function rodapePDF(doc) {
    const totalPaginas = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i)
        const largura = doc.internal.pageSize.getWidth()
        const altura = doc.internal.pageSize.getHeight()
        doc.setDrawColor(229, 231, 235)
        doc.line(14, altura - 14, largura - 14, altura - 14)
        doc.setFontSize(8)
        doc.setTextColor(...COR_CINZA_TEXTO)
        doc.text('Arruma Aí — Relatório gerado automaticamente pelo painel administrativo', 14, altura - 8)
        doc.text(`Página ${i} de ${totalPaginas}`, largura - 14, altura - 8, { align: 'right' })
    }
}

export default function Relatorios() {
    useAuth()

    const [ocorrencias, setOcorrencias] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [relatorioAtivo, setRelatorioAtivo] = useState(null)
    const [periodoInicio, setPeriodoInicio] = useState('')
    const [periodoFim, setPeriodoFim] = useState('')

    useEffect(() => {
        setIsLoading(true)
        reports()
            .then(data => setOcorrencias(data.map(item => ({
                problemaid: item.problemaid,
                protocolo: `#${String(item.problemaid).padStart(4, '0')}`,
                descricao: item.descricao,
                categoria: item.categoria,
                status: item.status,
                endereco: item.endereco?.rua || '—',
                data: item.data,
                dataObj: parseDataBR(item.data),
            }))))
            .catch(err => console.error('Erro ao buscar ocorrências:', err))
            .finally(() => setIsLoading(false))
    }, [])

    // ── Relatório: Ocorrências por período ──
    const relatorioPeriodo = useMemo(() => {
        const inicio = periodoInicio ? new Date(`${periodoInicio}T00:00:00`) : null
        const fim = periodoFim ? new Date(`${periodoFim}T23:59:59`) : null
        const filtradas = ocorrencias.filter(o => {
            if (!o.dataObj) return false
            if (inicio && o.dataObj < inicio) return false
            if (fim && o.dataObj > fim) return false
            return true
        })
        const porStatus = {}
        filtradas.forEach(o => { porStatus[o.status] = (porStatus[o.status] || 0) + 1 })
        return { filtradas, porStatus }
    }, [ocorrencias, periodoInicio, periodoFim])

    // ── Relatório: Ocorrências por categoria ──
    const relatorioCategoria = useMemo(() => {
        const contagem = {}
        ocorrencias.forEach(o => {
            const cat = o.categoria || 'Sem categoria'
            contagem[cat] = (contagem[cat] || 0) + 1
        })
        const linhas = Object.entries(contagem).sort((a, b) => b[1] - a[1])
        const max = linhas.length > 0 ? linhas[0][1] : 0
        return { linhas, max }
    }, [ocorrencias])

    function subtituloPeriodo() {
        if (!periodoInicio && !periodoFim) return 'Todas as ocorrências registradas'
        const de = periodoInicio ? new Date(`${periodoInicio}T00:00:00`).toLocaleDateString('pt-BR') : 'o início'
        const ate = periodoFim ? new Date(`${periodoFim}T00:00:00`).toLocaleDateString('pt-BR') : 'hoje'
        return `Período de ${de} até ${ate}`
    }

    function exportarPeriodoCSV() {
        baixarCSV(
            'ocorrencias-por-periodo.csv',
            ['Protocolo', 'Descrição', 'Categoria', 'Status', 'Endereço', 'Data'],
            relatorioPeriodo.filtradas.map(o => [o.protocolo, o.descricao, o.categoria, o.status, o.endereco, o.data])
        )
    }

    function exportarPeriodoPDF() {
        const doc = new jsPDF()
        cabecalhoPDF(doc, 'Relatório de Ocorrências por Período', subtituloPeriodo())

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(17, 24, 39)
        doc.text(`Total: ${relatorioPeriodo.filtradas.length} ocorrências`, 14, 53)

        const resumoStatus = Object.entries(relatorioPeriodo.porStatus).map(([s, q]) => `${s}: ${q}`).join('    •    ')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...COR_CINZA_TEXTO)
        doc.text(resumoStatus || 'Nenhuma ocorrência no período selecionado', 14, 59)

        autoTable(doc, {
            startY: 66,
            head: [['Protocolo', 'Descrição', 'Categoria', 'Status', 'Data']],
            body: relatorioPeriodo.filtradas.map(o => [o.protocolo, o.descricao, o.categoria, o.status, o.data]),
            headStyles: { fillColor: COR_VERDE, textColor: 255, fontStyle: 'bold', fontSize: 9 },
            alternateRowStyles: { fillColor: COR_CINZA_CLARO },
            styles: { fontSize: 8.5, cellPadding: 4, textColor: [17, 24, 39] },
            columnStyles: { 1: { cellWidth: 60 } },
            margin: { top: 30, left: 14, right: 14 },
        })

        rodapePDF(doc)
        doc.save('ocorrencias-por-periodo.pdf')
    }

    function exportarCategoriaCSV() {
        baixarCSV(
            'ocorrencias-por-categoria.csv',
            ['Categoria', 'Quantidade'],
            relatorioCategoria.linhas.map(([categoria, qtd]) => [categoria, qtd])
        )
    }

    function exportarCategoriaPDF() {
        const doc = new jsPDF()
        const total = relatorioCategoria.linhas.reduce((s, [, q]) => s + q, 0)
        cabecalhoPDF(doc, 'Relatório de Ocorrências por Categoria', `${relatorioCategoria.linhas.length} categorias — ${total} ocorrências no total`)

        autoTable(doc, {
            startY: 53,
            head: [['Categoria', 'Quantidade', 'Proporção']],
            body: relatorioCategoria.linhas.map(([categoria, qtd]) => [categoria, String(qtd), '']),
            headStyles: { fillColor: COR_VERDE, textColor: 255, fontStyle: 'bold', fontSize: 9 },
            alternateRowStyles: { fillColor: COR_CINZA_CLARO },
            styles: { fontSize: 9.5, cellPadding: 5, textColor: [17, 24, 39] },
            columnStyles: {
                0: { cellWidth: 85 },
                1: { cellWidth: 32, halign: 'center' },
                2: { cellWidth: 58 },
            },
            margin: { top: 30, left: 14, right: 14 },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 2) {
                    const qtd = relatorioCategoria.linhas[data.row.index][1]
                    const larguraMax = data.cell.width - 6
                    const larguraBarra = relatorioCategoria.max > 0 ? (qtd / relatorioCategoria.max) * larguraMax : 0
                    const alturaBarra = 4.5
                    doc.setFillColor(229, 231, 235)
                    doc.roundedRect(data.cell.x + 3, data.cell.y + data.cell.height / 2 - alturaBarra / 2, larguraMax, alturaBarra, 1, 1, 'F')
                    doc.setFillColor(...COR_VERDE)
                    doc.roundedRect(data.cell.x + 3, data.cell.y + data.cell.height / 2 - alturaBarra / 2, larguraBarra, alturaBarra, 1, 1, 'F')
                }
            },
        })

        rodapePDF(doc)
        doc.save('ocorrencias-por-categoria.pdf')
    }

    return (
        <div className={styles.container}>

            <Nav tela="relatorios" />

            <main>

                <div className={styles.titleDescription}>
                    <h2>Relatórios</h2>
                    <p>Gere relatórios com base nas ocorrências registradas no sistema.</p>
                </div>

                <h3 className={styles.tittleTypesReports}>Tipos de relatório</h3>

                <div className={styles.containerReport}>
                    {TIPOS_RELATORIO.map(tipo => (
                        <button
                            key={tipo.chave}
                            className={`${styles.reportTypes} ${relatorioAtivo === tipo.chave ? styles.reportTypesAtivo : ''}`}
                            onClick={() => setRelatorioAtivo(prev => prev === tipo.chave ? null : tipo.chave)}
                        >
                            <div className={styles.reports}>
                                <Image className={styles.imageReport} src={tipo.icone} alt={tipo.titulo} />
                                <div>
                                    <h3>{tipo.titulo}</h3>
                                    <p>{tipo.descricao}</p>
                                </div>
                            </div>
                            <Image className={styles.imageArrow} src={Arrow} alt="seta" />
                        </button>
                    ))}
                </div>

                {relatorioAtivo && (isLoading ? (
                    <div className={styles.carregando}>Carregando ocorrências...</div>
                ) : (
                    <div className={styles.resultado}>

                        {relatorioAtivo === 'periodo' && (
                            <>
                                <div className={styles.resultadoHeader}>
                                    <h3>Ocorrências por período</h3>
                                    <div className={styles.botoesExportar}>
                                        <button className={styles.btnExportarPdf} onClick={exportarPeriodoPDF} disabled={relatorioPeriodo.filtradas.length === 0}>
                                            📄 Baixar PDF
                                        </button>
                                        <button className={styles.btnExportar} onClick={exportarPeriodoCSV} disabled={relatorioPeriodo.filtradas.length === 0}>
                                            ⬇ Baixar CSV
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.filtrosRelatorio}>
                                    <div className={styles.campoFiltro}>
                                        <label>De</label>
                                        <input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} max={periodoFim || undefined} />
                                    </div>
                                    <div className={styles.campoFiltro}>
                                        <label>Até</label>
                                        <input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} min={periodoInicio || undefined} />
                                    </div>
                                </div>

                                <div className={styles.resumoCards}>
                                    <div className={styles.resumoCard}>
                                        <span className={styles.resumoValor}>{relatorioPeriodo.filtradas.length}</span>
                                        <span className={styles.resumoLabel}>Total no período</span>
                                    </div>
                                    {Object.entries(relatorioPeriodo.porStatus).map(([status, qtd]) => (
                                        <div key={status} className={styles.resumoCard}>
                                            <span className={styles.resumoValor}>{qtd}</span>
                                            <span className={styles.resumoLabel}>{status}</span>
                                        </div>
                                    ))}
                                </div>

                                {relatorioPeriodo.filtradas.length === 0 ? (
                                    <p className={styles.semDados}>Nenhuma ocorrência encontrada nesse período.</p>
                                ) : (
                                    <table className={styles.tabela}>
                                        <thead>
                                            <tr>
                                                <th>Protocolo</th>
                                                <th>Descrição</th>
                                                <th>Categoria</th>
                                                <th>Status</th>
                                                <th>Data</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {relatorioPeriodo.filtradas.map(o => (
                                                <tr key={o.problemaid}>
                                                    <td>{o.protocolo}</td>
                                                    <td className={styles.tdTruncar}>{o.descricao}</td>
                                                    <td>{o.categoria}</td>
                                                    <td>{o.status}</td>
                                                    <td>{o.data}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </>
                        )}

                        {relatorioAtivo === 'categoria' && (
                            <>
                                <div className={styles.resultadoHeader}>
                                    <h3>Ocorrências por categoria</h3>
                                    <div className={styles.botoesExportar}>
                                        <button className={styles.btnExportarPdf} onClick={exportarCategoriaPDF} disabled={relatorioCategoria.linhas.length === 0}>
                                            📄 Baixar PDF
                                        </button>
                                        <button className={styles.btnExportar} onClick={exportarCategoriaCSV} disabled={relatorioCategoria.linhas.length === 0}>
                                            ⬇ Baixar CSV
                                        </button>
                                    </div>
                                </div>

                                {relatorioCategoria.linhas.length === 0 ? (
                                    <p className={styles.semDados}>Nenhuma ocorrência registrada ainda.</p>
                                ) : (
                                    <div className={styles.barrasLista}>
                                        {relatorioCategoria.linhas.map(([categoria, qtd]) => (
                                            <div key={categoria} className={styles.barraItem}>
                                                <span className={styles.barraLabel}>{categoria}</span>
                                                <div className={styles.barraTrilho}>
                                                    <div
                                                        className={styles.barraPreenchida}
                                                        style={{ width: `${(qtd / relatorioCategoria.max) * 100}%` }}
                                                    />
                                                </div>
                                                <span className={styles.barraValor}>{qtd}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                ))}

            </main>

        </div>

    );
}
