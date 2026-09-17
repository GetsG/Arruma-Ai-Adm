import axios from 'axios'

const BASE_URL = 'https://arruma-ai-api.onrender.com'

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
}

export async function reports() {
    const resposta = await axios.get(`${BASE_URL}/problem/all`, {
        params: { limit: 9999 },
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data.data;
}

export async function updateStatus(id, statusid, extra = {}) {
    const resposta = await axios.put(`${BASE_URL}/problem/${id}/status`, { statusid, observacao: '', ...extra }, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}

export async function deleteProblem(id) {
    const resposta = await axios.delete(`${BASE_URL}/problem/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}

export async function createProblem(payload) {
    const resposta = await axios.post(`${BASE_URL}/problem`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}