import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginAdmin } from '@/app/services/auth'
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
            const resposta = await loginAdmin(data.email, data.senha)
            const token = resposta.token

            if (data.lembrar) {
                localStorage.setItem('token', token)
            } else {
                sessionStorage.setItem('token', token)
            }

            router.push('/dashboard')

        } catch (erro) {
            setError('acesso', { message: 'Email ou senha incorretos' })
        } finally {
            setIsLoading(false)
        }
    }

    return { register, handleSubmit, onSubmit, errors, isLoading }
}