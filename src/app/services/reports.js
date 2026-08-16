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

export async function updateStatus(id, status) {
    const resposta = await axios.patch(`${BASE_URL}/problem/${id}/${encodeURIComponent(status)}`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}