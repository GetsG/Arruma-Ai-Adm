import { useEffect, useState, useMemo } from 'react'
import { reports } from '@/app/services/reports'

const LIMITE = 10

const PRIORIDADE_LABEL = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Crítica' }

// a API manda prioridadeid (número) ou prioridade_label (texto minúsculo) — aqui vira um rótulo só
function normalizarPrioridade(item) {
    if (PRIORIDADE_LABEL[item.prioridadeid]) return PRIORIDADE_LABEL[item.prioridadeid]
    if (item.prioridade_label) {
        const texto = item.prioridade_label.trim()
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
    }
    return null
}

// A API às vezes devolve o status sem acento (ex.: "Atribuido") — compara sem diferenciar acento/maiúscula
function normalizarTexto(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

// a data vem como texto "dd/mm/aaaa..." — converte pra Date pra dar pra comparar no filtro de período
function parseDataBR(str) {
    if (!str) return null
    const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    if (!match) return null
    const [, dia, mes, ano] = match
    return new Date(Number(ano), Number(mes) - 1, Number(dia))
}

// busca as ocorrências, aplica os filtros recebidos e já devolve paginado
export function useReport(filtros) {
    const [todas, setTodas] = useState([])
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [isLoading, setIsLoading] = useState(true)

    // carrega tudo uma vez só; os filtros depois são aplicados em memória
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
                prioridade: normalizarPrioridade(item),
                data: item.data,
                fotos: item.imagem || [],
            })).sort((a, b) => b.problemaid - a.problemaid)))
            .catch(err => console.error('Erro ao buscar ocorrências:', err))
            .finally(() => setIsLoading(false))
    }, [])

    // toda vez que um filtro muda, volta pra primeira página
    useEffect(() => {
        setPaginaAtual(1)
    }, [filtros.busca, filtros.categoria, filtros.status, filtros.periodoInicio, filtros.periodoFim])

    // lista de categorias únicas, pra popular o select de filtro
    const categoriasDisponiveis = useMemo(() => (
        [...new Set(todas.map(item => item.categoria).filter(Boolean))].sort()
    ), [todas])

    // aplica busca por texto, categoria, status e período sobre a lista completa
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
            if (filtros.status !== 'todas' && normalizarTexto(item.status) !== normalizarTexto(filtros.status)) return false
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

    // tira a ocorrência da lista local depois de excluir, sem precisar buscar tudo de novo
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
