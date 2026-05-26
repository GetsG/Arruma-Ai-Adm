import { useEffect, useState } from 'react'
import { reports } from '@/app/services/reports'

export function useReport() {
    const [ocorrencias, setOcorrencias] = useState([])
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)

    useEffect(() => {
        reports(paginaAtual, 10)
            .then(({ data, pagination }) => {
                setOcorrencias(data.map(item => ({
                    protocolo: `#${String(item.problemaid).padStart(4, '0')}`,
                    titulo: item.descricao,
                    categoria: item.categoria,
                    bairro: item.endereco?.rua || '-',
                    prioridade: item.prioridade || '-',
                    status: item.status,
                    data: item.data,
                })))
                setTotalPaginas(Number(pagination.totalPages))
            })
            .catch(err => console.error('Erro ao buscar ocorrências:', err))
    }, [paginaAtual])

    return { ocorrencias, paginaAtual, setPaginaAtual, totalPaginas }
}
