// fundo cinza por trás das telas de ordens de serviço
export default function OrdensLayout({ children }) {
    return (
        <div style={{ 
          background: "#f5f6f8",
          minHeight: "100vh",
          }}>
            {children}
        </div>
    )
}