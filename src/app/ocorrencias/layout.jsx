// fundo cinza por trás das telas de ocorrências (lista/criar/editar)
export default function OcorrenciaLayout({ children }) {
    return (
        <div style={{ 
          background: "#f5f6f8",
          minHeight: "100vh",
          }}>
            {children}
        </div>
    )
}