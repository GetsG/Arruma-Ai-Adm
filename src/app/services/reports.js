import axios from 'axios'

const BASE_URL = 'https://arruma-ai-api.onrender.com'

// pega o token salvo no login, seja de "lembrar de mim" (localStorage) ou da sessão (sessionStorage)
function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
}

// busca todas as ocorrências cadastradas
export async function reports() {
    const resposta = await axios.get(`${BASE_URL}/problem/all`, {
        params: { limit: 9999 },
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data.data;
}

// atualiza o status de uma ocorrência (1 Pendente, 2 Em andamento, 3 Resolvido, 4 Em análise, 5 Atribuído, 6 Cancelado)
export async function updateStatus(id, statusid, extra = {}) {
    const resposta = await axios.put(`${BASE_URL}/problem/${id}/status`, { statusid, observacao: '', ...extra }, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}

// exclui uma ocorrência
export async function deleteProblem(id) {
    const resposta = await axios.delete(`${BASE_URL}/problem/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}

// cadastra uma nova ocorrência
export async function createProblem(payload) {
    const resposta = await axios.post(`${BASE_URL}/problem`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}
