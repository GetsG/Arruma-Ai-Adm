import axios from 'axios'

const BASE_URL = 'https://arruma-ai-api.onrender.com'

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
}

// tira os filtros vazios antes de mandar pra API (undefined/"" não deveriam virar query string)
function limparParams(params) {
    return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
}

function get(caminho, params) {
    return axios.get(`${BASE_URL}${caminho}`, {
        params: limparParams(params),
        headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.data)
}

// Gráfico 1: cards de KPI com sparkline (dias, categoriaid, bairro)
export function relatorioKpis(params = {}) {
    return get('/relatorios/kpis', params)
}

// Gráfico 2: ocorrências abertas x resolvidas por semana (semanas, categoriaid, bairro)
export function relatorioAbertasResolvidas(params = {}) {
    return get('/relatorios/abertas-resolvidas', params)
}

// Gráfico 6: SLA por categoria, em barras empilhadas (data_inicio, data_fim, categoriaid, bairro)
export function relatorioSlaCategoria(params = {}) {
    return get('/relatorios/sla-categoria', params)
}

// Gráfico 7: funil do processo da ocorrência (data_inicio, data_fim, categoriaid, bairro)
export function relatorioFunil(params = {}) {
    return get('/relatorios/funil', params)
}

// Gráfico 8: boxplot do tempo de resolução por categoria (data_inicio, data_fim, categoriaid, bairro)
export function relatorioTempoResolucao(params = {}) {
    return get('/relatorios/tempo-resolucao', params)
}

// Gráfico 9: O.S. em aberto por tempo restante até o prazo (categoriaid, usuarioid, limite)
export function relatorioOsPrazo(params = {}) {
    return get('/relatorios/os-prazo', params)
}

// Gráfico 10: carga de trabalho por prestador (categoriaid)
export function relatorioCargaPrestadores(params = {}) {
    return get('/relatorios/carga-prestadores', params)
}
