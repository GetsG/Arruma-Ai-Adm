import axios from 'axios'

export async function reports() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')

    const resposta = await axios.get('https://arruma-ai-api.onrender.com/problem/all', {
        params: { limit: 9999 },
        headers: { Authorization: `Bearer ${token}` }
    });

    return resposta.data.data;
}