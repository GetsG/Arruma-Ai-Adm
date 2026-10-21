// fundo com degradê verde, centraliza o card de login na tela
export default function LoginLayout({ children }) {
    return (
        <div style={{
          background: "radial-gradient(circle at 30% 20%, #35935f 0%, #1f5c2b 55%, #16401e 100%)",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",

          }}>
            {children}
        </div>
    )
}