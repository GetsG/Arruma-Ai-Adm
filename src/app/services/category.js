import axios from 'axios'

const BASE_URL = 'https://arruma-ai-api.onrender.com'

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
}

export async function categories() {
    const resposta = await axios.get(`${BASE_URL}/category`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return resposta.data.categorys;
}
