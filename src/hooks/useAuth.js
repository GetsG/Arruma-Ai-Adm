import { useEffect, useLayoutEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { meuPerfil } from '@/app/services/users'

const ROTA_PRESTADOR = '/ordens'

// No servidor não existe localStorage — usar useLayoutEffect (só roda no cliente)
// em vez de ler direto no render evita mismatch de hidratação.
const useLayoutEffectIsomorfico = typeof window !== 'undefined' ? useLayoutEffect : useEffect

function lerUsuarioCache() {
    try {
        const raw = localStorage.getItem('usuario') || sessionStorage.getItem('usuario')
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

function salvarUsuarioCache(usuario) {
    try {
        if (localStorage.getItem('token')) localStorage.setItem('usuario', JSON.stringify(usuario))
        else if (sessionStorage.getItem('token')) sessionStorage.setItem('usuario', JSON.stringify(usuario))
    } catch {}
}

export function useAuth({ somenteAdmin = false } = {}) {
    const router = useRouter()
    const [usuario, setUsuario] = useState(null)
    const [carregando, setCarregando] = useState(true)

    // Roda antes do navegador pintar a tela: se já tiver o papel em cache (salvo no
    // login), aplica na hora — sem esperar a rede e sem "piscar" itens indevidos.
    useLayoutEffectIsomorfico(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')

        if (!token) {
            router.push('/login')
            return
        }

        const cache = lerUsuarioCache()
        if (cache) {
            setUsuario(cache)
            setCarregando(false)
            if (somenteAdmin && cache.tipo !== 'admin') {
                router.push(ROTA_PRESTADOR)
            }
        }

        // Revalida em segundo plano (mantém o cache em dia e cobre o caso de ainda não ter cache)
        meuPerfil()
            .then(u => {
                setUsuario(u)
                salvarUsuarioCache(u)
                if (somenteAdmin && u?.tipo !== 'admin') {
                    router.push(ROTA_PRESTADOR)
                }
            })
            .catch(() => {
                router.push('/login')
            })
            .finally(() => setCarregando(false))
    }, [])

    return { usuario, carregando }
}
