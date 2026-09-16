import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import '../styles/global.css'
import { supabase } from '../lib/supabase'

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
    <>
      <div className="hg-topbar">
        <div className="hg-wrap hg-topbar-inner">
          <span>🚚 Curadoria para todo o Brasil</span>
          <span>✓ Produtos selecionados</span>
          <span>♢ Transparência em afiliados</span>
          <b>Mais praticidade para a sua casa.</b>
          <AdminAccess/>
        </div>
      </div>
      <header className="hg-header">
      <div className="hg-wrap hg-nav">
        <button className="hg-mobile-menu" aria-label="Abrir menu">☰</button>
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
          <a className="hg-mobile-search" href="/#categorias" aria-label="Pesquisar">⌕</a>
          <div className="hg-search">
            <span>⌕</span>
            <input aria-label="Buscar" placeholder="O que você procura para o seu lar?"/>
          </div>
          <a className="hg-cta" href="/#achadinhos">Ver ofertas</a>
        </div>
      </div>
    </header>
    </>
  )
}

function AdminAccess(){
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true

    async function checkAdmin() {
      const { data } = await supabase.auth.getUser()
      if (!data.user || !active) return

      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle()

      if (active) setIsAdmin(Boolean(role))
    }

    checkAdmin()

    return () => {
      active = false
    }
  }, [])

  if (!isAdmin) return null

  return <a className="hg-admin-access" href="/admin">⚙ Painel Admin</a>
}

function Footer(){
  return (
    <>
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
        </div>
        <div className="hg-wrap hg-footer-bottom">© 2026 HIPERGIGA. Todos os direitos reservados.</div>
      </footer>

      <nav className="hg-mobile-bottom" aria-label="Navegação mobile">
        <a href="/"><span>⌂</span><b>Início</b></a>
        <a href="/#categorias"><span>▦</span><b>Categorias</b></a>
        <a href="/#achadinhos"><span>♡</span><b>Achadinhos</b></a>
        <a href="/#dicas"><span>☷</span><b>Dicas</b></a>
      </nav>
    </>
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
