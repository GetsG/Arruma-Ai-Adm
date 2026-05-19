export default function LoginLayout({ children }) {
    return (
        <div style={{ 
          background: "#2d7a3a",
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