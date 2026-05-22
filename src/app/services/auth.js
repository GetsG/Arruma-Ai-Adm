import axios from 'axios'

export async function loginAdmin(email, senha) {
    const resposta = await axios.post('https://arruma-ai-api.onrender.com/sessions/admin', {
        email,
        senha,
    })

    return resposta.data // retorna { token, usuario }
}