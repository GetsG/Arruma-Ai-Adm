import dynamic from 'next/dynamic'

// Leaflet usa o objeto "window", então o mapa só pode carregar no navegador (ssr: false)
const MapGoiania = dynamic(() => import('./MapGoiania'), {
    ssr: false,
    loading: () => (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            borderRadius: '8px',
            color: '#888',
            fontSize: '14px',
        }}>
            Carregando mapa...
        </div>
    ),
})

export default MapGoiania
