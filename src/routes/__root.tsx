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
  return (
    <header className="hg-header">
      <div className="hg-wrap hg-nav">
        <a className="hg-logo-link" href="/" aria-label="HIPERGIGA">
          <img src="/hipergiga-logo.svg" alt="HIPERGIGA"/>
        </a>

        <nav className="hg-menu">
          <a href="/#categorias">Categorias</a>
          <a href="/#achadinhos">Achadinhos</a>
          <a href="/#dicas">Dicas</a>
          <a href="/#sobre">Sobre</a>
        </nav>

        <div className="hg-header-actions">
          <div className="hg-search">
            <span>⌕</span>
            <input aria-label="Buscar" placeholder="O que você procura para o seu lar?"/>
          </div>
          <a className="hg-cta" href="/#achadinhos">Ver ofertas</a>
        </div>
      </div>
    </header>
  )
}

function Footer(){
  return (
    <footer className="hg-footer">
      <div className="hg-wrap hg-footer-grid">
        <div>
          <img className="hg-footer-logo" src="/hipergiga-logo.svg" alt="HIPERGIGA"/>
          <p>Mais praticidade para um lar mais feliz.</p>
        </div>
        <div>
          <b>Explore</b>
          <a href="/#categorias">Categorias</a>
          <a href="/#achadinhos">Achadinhos</a>
          <a href="/#dicas">Dicas</a>
          <a href="/#sobre">Sobre</a>
        </div>
        <div>
          <b>Transparência</b>
          <p>Alguns links podem gerar comissão sem custo extra para você.</p>
        </div>
        <div>
          <b>Admin</b>
          <a href="/auth">Acesso administrativo</a>
        </div>
      </div>
      <div className="hg-wrap hg-footer-bottom">© 2026 HIPERGIGA. Todos os direitos reservados.</div>
    </footer>
  )
}

function Document({children}:{children:ReactNode}){
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet"/>
      </head>
      <body>{children}<Scripts/></body>
    </html>
  )
}
