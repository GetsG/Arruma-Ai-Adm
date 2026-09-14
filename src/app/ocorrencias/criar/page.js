'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/app/components/Nav/Nav'
import MapGoiania from '@/app/components/Map/MapGoianiaWrapper'
import { createProblem } from '@/app/services/reports'
import { categories } from '@/app/services/category'
import { useAuth } from '@/hooks/useAuth'
import styles from './page.module.css'

function fileParaBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

export default function CriarOcorrencia() {
    useAuth()
    const router = useRouter()

    const [categoriasLista, setCategoriasLista] = useState([])
    const [categoriaid, setCategoriaid] = useState('')
    const [descricao, setDescricao] = useState('')
    const [rua, setRua] = useState('')
    const [pontoReferencia, setPontoReferencia] = useState('')
    const [latitude, setLatitude] = useState('')
    const [longitude, setLongitude] = useState('')
    const [imagens, setImagens] = useState([])
    const [salvando, setSalvando] = useState(false)
    const [enviandoImagens, setEnviandoImagens] = useState(false)
    const [mensagem, setMensagem] = useState(null)
    const [erros, setErros] = useState({})

    useEffect(() => {
        categories()
            .then(lista => setCategoriasLista(lista || []))
            .catch(err => console.error('Erro ao buscar categorias:', err))
    }, [])

    function handleMapClick(lat, lng) {
        setLatitude(lat.toFixed(6))
        setLongitude(lng.toFixed(6))
        setErros(prev => ({ ...prev, localizacao: undefined }))
    }

    function usarLocalizacaoAtual() {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
            pos => {
                setLatitude(pos.coords.latitude.toFixed(6))
                setLongitude(pos.coords.longitude.toFixed(6))
                setErros(prev => ({ ...prev, localizacao: undefined }))
            },
            () => {
                setMensagem({ tipo: 'erro', texto: 'Não foi possível obter sua localização atual.' })
                setTimeout(() => setMensagem(null), 4000)
            }
        )
    }

    async function handleImagens(e) {
        const arquivos = Array.from(e.target.files || [])
        if (arquivos.length === 0) return
        setEnviandoImagens(true)
        try {
            const base64s = await Promise.all(arquivos.map(fileParaBase64))
            setImagens(prev => [...prev, ...base64s])
        } finally {
            setEnviandoImagens(false)
            e.target.value = ''
        }
    }

    function removerImagem(index) {
        setImagens(prev => prev.filter((_, i) => i !== index))
    }

    function validar() {
        const novosErros = {}
        if (!descricao.trim()) novosErros.descricao = 'Informe a descrição da ocorrência.'
        if (!categoriaid) novosErros.categoriaid = 'Selecione uma categoria.'
        if (!latitude || !longitude) novosErros.localizacao = 'Marque a localização no mapa ou preencha latitude/longitude.'
        setErros(novosErros)
        return Object.keys(novosErros).length === 0
    }

    async function handleCadastrar() {
        if (!validar()) {
            setMensagem({ tipo: 'erro', texto: 'Preencha os campos obrigatórios antes de cadastrar.' })
            setTimeout(() => setMensagem(null), 4000)
            return
        }
        setSalvando(true)
        try {
            await createProblem({
                descricao: descricao.trim(),
                categoriaid: Number(categoriaid),
                latitude: String(latitude),
                longitude: String(longitude),
                rua: rua.trim(),
                ponto_referencia: pontoReferencia.trim(),
                imagens,
            })
            router.push('/ocorrencias')
        } catch (err) {
            setMensagem({ tipo: 'erro', texto: 'Erro ao cadastrar a ocorrência. Tente novamente.' })
            setTimeout(() => setMensagem(null), 4000)
        } finally {
            setSalvando(false)
        }
    }

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    const pontoMapa = (!isNaN(lat) && !isNaN(lng))
        ? [{ lat, lng, titulo: rua || 'Local selecionado' }]
        : []

    return (
        <div className={styles.container}>
            <Nav tela="ocorrencias" />
            <main>

                {/* Topo */}
                <div className={styles.topBar}>
                    <div>
                        <p className={styles.breadcrumb}>
                            Ocorrências &gt; <span className={styles.breadcrumbAtivo}>Nova ocorrência</span>
                        </p>
                        <h1 className={styles.titulo}>Nova Ocorrência</h1>
                        <p className={styles.subtitulo}>Cadastre manualmente uma nova ocorrência para a cidade.</p>
                    </div>
                    <div className={styles.acoesTopo}>
                        <button className={styles.btnVoltar} onClick={() => router.push('/ocorrencias')}>
                            ← Voltar para lista
                        </button>
                        <button className={styles.btnSalvar} onClick={handleCadastrar} disabled={salvando}>
                            ✓ {salvando ? 'Cadastrando...' : 'Cadastrar ocorrência'}
                        </button>
                    </div>
                </div>

                {mensagem && (
                    <div className={`${styles.mensagem} ${styles[mensagem.tipo]}`}>
                        {mensagem.texto}
                    </div>
                )}

                <div className={styles.contentArea}>

                    {/* Coluna esquerda */}
                    <div className={styles.leftCol}>

                        {/* Dados da ocorrência */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>⚠️ Dados da ocorrência</h3>
                            <div className={styles.campoGroup}>
                                <label className={styles.label}>Categoria *</label>
                                <select
                                    className={`${styles.select} ${erros.categoriaid ? styles.campoErro : ''}`}
                                    value={categoriaid}
                                    onChange={e => { setCategoriaid(e.target.value); setErros(prev => ({ ...prev, categoriaid: undefined })) }}
                                >
                                    <option value="">— Selecione a categoria</option>
                                    {categoriasLista.map(c => (
                                        <option key={c.categoriaid} value={c.categoriaid}>{c.nome}</option>
                                    ))}
                                </select>
                                {erros.categoriaid && <span className={styles.erroTexto}>{erros.categoriaid}</span>}
                            </div>

                            <div className={styles.campoGroup} style={{ marginTop: 16 }}>
                                <label className={styles.label}>Descrição *</label>
                                <div className={styles.textareaWrapper}>
                                    <textarea
                                        className={`${styles.textarea} ${erros.descricao ? styles.campoErro : ''}`}
                                        value={descricao}
                                        onChange={e => { setDescricao(e.target.value.slice(0, 500)); setErros(prev => ({ ...prev, descricao: undefined })) }}
                                        placeholder="Descreva o problema relatado..."
                                        maxLength={500}
                                        rows={4}
                                    />
                                    <span className={styles.charCount}>{descricao.length} / 500 caracteres</span>
                                </div>
                                {erros.descricao && <span className={styles.erroTexto}>{erros.descricao}</span>}
                            </div>
                        </div>

                        {/* Localização */}
                        <div className={styles.card}>
                            <div className={styles.localizacaoHeader}>
                                <h3 className={styles.cardTitulo}>📍 Localização *</h3>
                                <button type="button" className={styles.linkAcao} onClick={usarLocalizacaoAtual}>
                                    🧭 Usar minha localização atual
                                </button>
                            </div>

                            <div className={styles.gridDois}>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Rua / Logradouro</label>
                                    <input
                                        className={styles.input}
                                        value={rua}
                                        onChange={e => setRua(e.target.value)}
                                        placeholder="Ex: Rua 85"
                                    />
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Ponto de referência</label>
                                    <input
                                        className={styles.input}
                                        value={pontoReferencia}
                                        onChange={e => setPontoReferencia(e.target.value)}
                                        placeholder="Ex: Próximo ao mercado"
                                    />
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Latitude</label>
                                    <input
                                        className={`${styles.input} ${erros.localizacao ? styles.campoErro : ''}`}
                                        value={latitude}
                                        onChange={e => { setLatitude(e.target.value); setErros(prev => ({ ...prev, localizacao: undefined })) }}
                                        placeholder="-16.684531"
                                    />
                                </div>
                                <div className={styles.campoGroup}>
                                    <label className={styles.label}>Longitude</label>
                                    <input
                                        className={`${styles.input} ${erros.localizacao ? styles.campoErro : ''}`}
                                        value={longitude}
                                        onChange={e => { setLongitude(e.target.value); setErros(prev => ({ ...prev, localizacao: undefined })) }}
                                        placeholder="-49.254356"
                                    />
                                </div>
                            </div>

                            {erros.localizacao && <span className={styles.erroTexto}>{erros.localizacao}</span>}

                            <p className={styles.dicaMapa}>Clique no mapa para marcar o local exato da ocorrência.</p>
                            <div className={styles.mapaWrapper}>
                                <MapGoiania pontos={pontoMapa} onMapClick={handleMapClick} />
                            </div>
                        </div>

                    </div>

                    {/* Coluna direita */}
                    <div className={styles.rightCol}>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitulo}>🖼️ Imagens</h3>
                            <p className={styles.dicaMapa}>Anexe fotos que ajudem a equipe a entender o problema (opcional).</p>

                            <label className={styles.dropzone}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImagens}
                                    style={{ display: 'none' }}
                                />
                                <span className={styles.dropzoneIcone}>📷</span>
                                <span className={styles.dropzoneTexto}>
                                    {enviandoImagens ? 'Carregando imagens...' : 'Clique para selecionar fotos'}
                                </span>
                            </label>

                            {imagens.length > 0 && (
                                <div className={styles.imagensGrid}>
                                    {imagens.map((img, i) => (
                                        <div key={i} className={styles.imagemThumb}>
                                            <img src={img} alt={`Imagem ${i + 1}`} />
                                            <button
                                                type="button"
                                                className={styles.imagemRemover}
                                                onClick={() => removerImagem(i)}
                                                title="Remover"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
