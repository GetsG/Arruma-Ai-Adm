import { useEffect, useState, useMemo } from 'react'
import { reports } from '@/app/services/reports'

const LIMITE = 10

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
            }))))
            .catch(err => console.error('Erro ao buscar ocorrências:', err))
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => {
        setPaginaAtual(1)
    }, [filtros.busca, filtros.categoria, filtros.status, filtros.periodo])

    const filtradas = useMemo(() => {
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
            return true
        })
    }, [todas, filtros.busca, filtros.categoria, filtros.status, filtros.periodo])

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / LIMITE))
    const ocorrencias = filtradas.slice((paginaAtual - 1) * LIMITE, paginaAtual * LIMITE)

    return { ocorrencias, paginaAtual, setPaginaAtual, totalPaginas, total: filtradas.length, isLoading }
}
