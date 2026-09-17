import axios from 'axios'

const BASE_URL = 'https://arruma-ai-api.onrender.com'

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
}

export async function criarOrdemServico(payload) {
    const resposta = await axios.post(`${BASE_URL}/ordemservico`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}

export async function listarOrdensServico() {
    const resposta = await axios.get(`${BASE_URL}/ordemservico`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data.data;
}

export async function listarOrdensServicoPrestador() {
    const resposta = await axios.get(`${BASE_URL}/ordemservico/prestador`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data.data;
}

export async function atualizarOrdemServico(idordem, payload) {
    const resposta = await axios.put(`${BASE_URL}/ordemservico/${idordem}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}
