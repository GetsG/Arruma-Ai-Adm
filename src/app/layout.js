import { Geist, Geist_Mono } from "next/font/google";
import { Poppins } from 'next/font/google'
import { Inter } from 'next/font/google'
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600'], // escolha os pesos que quiser
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400'], // pesos mais usados
})

export const metadata = {
  title: "Arruma Ai - Administrativo",
  description: "Sistema administrativo do Arruma Ai",
};



export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${inter.variable} ${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
