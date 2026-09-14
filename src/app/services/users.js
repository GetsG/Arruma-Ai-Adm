import axios from 'axios'

const BASE_URL = 'https://arruma-ai-api.onrender.com'

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
}

export async function listarUsuarios() {
    const resposta = await axios.get(`${BASE_URL}/users`, {
        params: { limit: 9999 },
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data.data;
}

export async function criarUsuario(payload) {
    const resposta = await axios.post(`${BASE_URL}/users`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}

export async function meuPerfil() {
    const resposta = await axios.get(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data.user;
}

export async function atualizarPerfil(payload) {
    const resposta = await axios.patch(`${BASE_URL}/users/update`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}
