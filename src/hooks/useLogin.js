import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginAdmin, loginPrestador } from '@/app/services/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const schema = z.object({
    email: z.string().email('Email inválido'),
    senha: z.string().min(6, 'Mínimo 6 caracteres'),
    lembrar: z.boolean().optional(),
})

export function useLogin() {

    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [tipoAcesso, setTipoAcesso] = useState('admin')

    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        if (token) router.replace('/dashboard')
    }, [])

    const { register, handleSubmit, formState: { errors }, setError } = useForm({
        resolver: zodResolver(schema)
    })

    async function onSubmit(data) {
        setIsLoading(true)
        try {
            const resposta = tipoAcesso === 'admin'
                ? await loginAdmin(data.email, data.senha)
                : await loginPrestador(data.email, data.senha)
            const token = resposta.token
            const perfil = resposta.user

            const armazenamento = data.lembrar ? localStorage : sessionStorage
            armazenamento.setItem('token', token)
            if (perfil) armazenamento.setItem('usuario', JSON.stringify(perfil))

            router.push(tipoAcesso === 'admin' ? '/dashboard' : '/ordens')

        } catch (erro) {
            setError('acesso', { message: 'Email ou senha incorretos' })
        } finally {
            setIsLoading(false)
        }
    }

    return { register, handleSubmit, onSubmit, errors, isLoading, tipoAcesso, setTipoAcesso }
}
