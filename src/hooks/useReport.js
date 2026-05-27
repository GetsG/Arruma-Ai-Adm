import { useEffect, useState, useMemo } from 'react'
import { reports } from '@/app/services/reports'

const LIMITE = 10

export function useReport(filtros) {
    const [todas, setTodas] = useState([])
    const [paginaAtual, setPaginaAtual] = useState(1)

    useEffect(() => {
        reports()
            .then(data => setTodas(data.map(item => ({
                protocolo: `#${String(item.problemaid).padStart(4, '0')}`,
                titulo: item.descricao,
                categoria: item.categoria,
                bairro: item.endereco?.rua || '-',
                prioridade: item.prioridade || '-',
                status: item.status,
                data: item.data,
            }))))
            .catch(err => console.error('Erro ao buscar ocorrências:', err))
    }, [])

    useEffect(() => {
        setPaginaAtual(1)
    }, [filtros.busca, filtros.categoria, filtros.status, filtros.prioridade, filtros.bairro, filtros.periodo])

    const filtradas = useMemo(() => {
        return todas.filter(item => {
            if (filtros.busca) {
                const busca = filtros.busca.toLowerCase()
                const bate = item.titulo?.toLowerCase().includes(busca)
                    || item.protocolo?.toLowerCase().includes(busca)
                    || item.bairro?.toLowerCase().includes(busca)
                    || item.categoria?.toLowerCase().includes(busca)
                if (!bate) return false
            }
            if (filtros.categoria !== 'todas' && item.categoria !== filtros.categoria) return false
            if (filtros.status !== 'todas' && item.status !== filtros.status) return false
            if (filtros.prioridade !== 'todas' && item.prioridade !== filtros.prioridade) return false
            if (filtros.bairro !== 'todas' && item.bairro !== filtros.bairro) return false
            return true
        })
    }, [todas, filtros.busca, filtros.categoria, filtros.status, filtros.prioridade, filtros.bairro, filtros.periodo])

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / LIMITE))
    const ocorrencias = filtradas.slice((paginaAtual - 1) * LIMITE, paginaAtual * LIMITE)

    return { ocorrencias, paginaAtual, setPaginaAtual, totalPaginas }
}
