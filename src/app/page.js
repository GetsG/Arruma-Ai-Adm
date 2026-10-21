import { redirect } from 'next/navigation'

// raiz do site ("/") só existe pra mandar direto pro login
export default function Home() {
    redirect('/login')
}
