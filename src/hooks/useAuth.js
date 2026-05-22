import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth() {
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')

        if (!token) {
            router.push('/login')
        }
    }, [])
}