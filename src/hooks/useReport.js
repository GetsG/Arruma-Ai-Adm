import { useEffect, useState, useMemo } from 'react'
import { reports } from '@/app/services/reports'

const LIMITE = 10

function parseDataBR(str) {
    if (!str) return null
    const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    if (!match) return null
    const [, dia, mes, ano] = match
    return new Date(Number(ano), Number(mes) - 1, Number(dia))
}

export function useReport(filtros) {
    const [todas, setTodas] = useState([])
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        reports()
            .then(data => setTodas(data.map(item => ({
                problemaid: item.problemaid,
                protocolo: `#${String(item.problemaid).padStart(4, '0')}`,
                titulo: item.descricao,
                categoria: item.categoria,
                endereco: item.endereco?.rua || '-',
                ponto_referencia: item.endereco?.ponto_referencia || '',
                status: item.status,
                data: item.data,
                fotos: item.imagem || [],
            })).sort((a, b) => b.problemaid - a.problemaid)))
            .catch(err => console.error('Erro ao buscar ocorrências:', err))
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => {
        setPaginaAtual(1)
    }, [filtros.busca, filtros.categoria, filtros.status, filtros.periodoInicio, filtros.periodoFim])

    const categoriasDisponiveis = useMemo(() => (
        [...new Set(todas.map(item => item.categoria).filter(Boolean))].sort()
    ), [todas])

    const filtradas = useMemo(() => {
        const inicio = filtros.periodoInicio ? new Date(`${filtros.periodoInicio}T00:00:00`) : null
        const fim = filtros.periodoFim ? new Date(`${filtros.periodoFim}T23:59:59`) : null

        return todas.filter(item => {
            if (filtros.busca) {
                const busca = filtros.busca.toLowerCase()
                const bate = item.titulo?.toLowerCase().includes(busca)
                    || item.protocolo?.toLowerCase().includes(busca)
                    || item.endereco?.toLowerCase().includes(busca)
                    || item.categoria?.toLowerCase().includes(busca)
                if (!bate) return false
            }
            if (filtros.categoria !== 'todas' && item.categoria !== filtros.categoria) return false
            if (filtros.status !== 'todas' && item.status !== filtros.status) return false
            if (inicio || fim) {
                const dataItem = parseDataBR(item.data)
                if (!dataItem) return false
                if (inicio && dataItem < inicio) return false
                if (fim && dataItem > fim) return false
            }
            return true
        })
    }, [todas, filtros.busca, filtros.categoria, filtros.status, filtros.periodoInicio, filtros.periodoFim])

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / LIMITE))
    const ocorrencias = filtradas.slice((paginaAtual - 1) * LIMITE, paginaAtual * LIMITE)

    function removerOcorrencia(problemaid) {
        setTodas(prev => prev.filter(item => item.problemaid !== problemaid))
    }

    return {
        ocorrencias,
        paginaAtual,
        setPaginaAtual,
        totalPaginas,
        total: filtradas.length,
        isLoading,
        categoriasDisponiveis,
        removerOcorrencia,
    }
}
