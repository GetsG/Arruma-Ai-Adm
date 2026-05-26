import axios from 'axios'

export async function reports(page = 1, limit = 10) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')

    const resposta = await axios.get('https://arruma-ai-api.onrender.com/problem/all', {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` }
    });

    return resposta.data;
}