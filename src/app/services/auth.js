import axios from 'axios'

// login do administrador, endpoint separado do prestador
export async function loginAdmin(email, senha) {
    const resposta = await axios.post('https://arruma-ai-api.onrender.com/sessions/admin', {
        email,
        senha,
    })

    return resposta.data // retorna { token, user }
}

// login do prestador, mesma estrutura de resposta do admin
export async function loginPrestador(email, senha) {
    const resposta = await axios.post('https://arruma-ai-api.onrender.com/sessions', {
        email,
        senha,
    })

    return resposta.data // retorna { token, user }
}

// dispara o e-mail de recuperação de senha com o link/token de redefinição
export async function esqueciSenha(email) {
    const resposta = await axios.post('https://arruma-ai-api.onrender.com/users/forgot-password', {
        email,
    })

    return resposta.data
}

// troca a senha usando o token recebido por e-mail
export async function redefinirSenha(token, novaSenha) {
    const resposta = await axios.post('https://arruma-ai-api.onrender.com/users/reset-password', {
        token,
        nova_senha: novaSenha,
    })

    return resposta.data
}
