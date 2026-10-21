// fundo cinza por trás da tela de relatórios
export default function RelatorioLayout({ children }) {
    return (
        <div style={{ 
          background: "#f5f6f8",
          minHeight: "100vh",
          }}>
            {children}
        </div>
    )
}