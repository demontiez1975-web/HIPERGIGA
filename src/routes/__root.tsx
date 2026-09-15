import type { ReactNode } from 'react'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import '../styles/global.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'HIPERGIGA — Achadinhos para o lar' },
      { name: 'description', content: 'A gente pesquisa. Você escolhe melhor.' },
      { name: 'theme-color', content: '#075A5A' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  component: Root,
})

function Root() {
  return <Document><Header/><Outlet/><Footer/></Document>
}

function Header(){
  return <header className="header header-pro"><div className="wrap nav nav-pro"><a className="brand brand-pro" href="/"><span>H</span><strong>HIPERGIGA</strong></a><nav><a href="/#categorias">Categorias</a><a href="/#achadinhos">Achadinhos</a><a href="/#dicas">Dicas</a><a href="/#sobre">Sobre</a></nav><a className="pill" href="/#achadinhos">Ver achadinhos</a></div></header>
}

function Footer(){
  return <footer className="footer footer-pro"><div className="wrap footer-grid-pro"><div><div className="brand light brand-pro"><span>H</span><strong>HIPERGIGA</strong></div><p>Curadoria de achadinhos e utilidades para o lar.</p></div><div><b>Explore</b><a href="/#categorias">Categorias</a><a href="/#achadinhos">Achadinhos</a><a href="/#dicas">Dicas</a></div><div><b>Transparência</b><p>Alguns links podem gerar comissão sem custo extra para você.</p></div><div><b>Admin</b><a href="/auth">Acesso administrativo</a></div></div><div className="wrap footer-bottom">© 2026 HIPERGIGA. Curadoria simples, escolha melhor.</div></footer>
}

function Document({children}:{children:ReactNode}){
  return <html lang="pt-BR"><head><HeadContent/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet"/></head><body>{children}<Scripts/></body></html>
}
