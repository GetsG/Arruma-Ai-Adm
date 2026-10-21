import axios from 'axios'

const BASE_URL = 'https://arruma-ai-api.onrender.com'

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
}

// cria uma OS a partir de uma ocorrência pendente, já atribuindo a um prestador
export async function criarOrdemServico(payload) {
    const resposta = await axios.post(`${BASE_URL}/ordemservico`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}

// lista todas as OS (usado pelo admin)
export async function listarOrdensServico() {
    const resposta = await axios.get(`${BASE_URL}/ordemservico`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data.data;
}

// lista só as OS do prestador logado
export async function listarOrdensServicoPrestador() {
    const resposta = await axios.get(`${BASE_URL}/ordemservico/prestador`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data.data;
}

// prestador atualiza o status/observação da própria OS
export async function atualizarOrdemServico(idordem, payload) {
    const resposta = await axios.put(`${BASE_URL}/ordemservico/${idordem}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}
