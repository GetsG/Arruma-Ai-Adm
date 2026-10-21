import axios from 'axios'

const BASE_URL = 'https://arruma-ai-api.onrender.com'

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
}

// lista todos os usuários (admins e prestadores)
export async function listarUsuarios() {
    const resposta = await axios.get(`${BASE_URL}/users`, {
        params: { limit: 9999 },
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data.data;
}

// cadastra um admin ou prestador (o tipo vai dentro do payload)
export async function criarUsuarioAdmin(payload) {
    const resposta = await axios.post(`${BASE_URL}/users/admin`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}

// busca os dados do usuário logado no momento (usado pra saber o tipo de acesso)
export async function meuPerfil() {
    const resposta = await axios.get(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data.user;
}

// atualiza os dados do próprio usuário logado
export async function atualizarPerfil(payload) {
    const resposta = await axios.patch(`${BASE_URL}/users/update`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data;
}
