import { FormEvent, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
}

type Product = {
  id: string
  title: string
  slug: string
  price: number | null
  store_name: string
  badge: string | null
  category_id: string | null
}

type Article = {
  id: string
  title: string
  slug: string
  summary: string | null
  cover_image_url: string | null
}

export const Route = createFileRoute('/')({
  loader: async () => {
    const [
      { data: categories, error: categoriesError },
      { data: products, error: productsError },
      { data: articles, error: articlesError },
    ] = await Promise.all([
      supabase
        .from('categories')
        .select('id,name,slug,description')
        .eq('active', true)
        .order('sort_order'),
      supabase
        .from('products')
        .select('id,title,slug,price,store_name,badge,category_id')
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('verified_at', { ascending: false })
        .limit(20),
      supabase
        .from('articles')
        .select('id,title,slug,summary,cover_image_url')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(3),
    ])

    if (categoriesError) throw categoriesError
    if (productsError) throw productsError
    if (articlesError) throw articlesError

    return {
      categories: (categories ?? []) as Category[],
      products: (products ?? []) as Product[],
      articles: (articles ?? []) as Article[],
    }
  },
  component: Home,
})

function money(v: number | null) {
  if (v == null) return 'Consultar oferta'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function iconFor(slug: string) {
  const icons: Record<string, string> = {
    cozinha: '🍳',
    organizacao: '🧺',
    limpeza: '✨',
    banheiro: '🛁',
    'casas-pequenas': '🏠',
    decoracao: '🪴',
    'tecnologia-para-o-lar': '💡',
  }
  return icons[slug] ?? '🏡'
}

function emojiFor(index: number) {
  const items = ['🫙', '🧺', '🧽', '🧴', '🪑', '💡', '🔌', '🥡']
  return items[index % items.length]
}

function Home() {
  const { categories, products, articles } = Route.useLoaderData()
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewsletterLoading(true)
    setNewsletterMessage('')

    const { error } = await supabase.from('newsletter_subscribers').insert({
      email: newsletterEmail.trim().toLowerCase(),
      source: 'homepage',
    })

    if (error) {
      setNewsletterMessage(
        error.code === '23505'
          ? 'Esse e-mail já está cadastrado.'
          : 'Não foi possível cadastrar agora. Tente novamente.',
      )
      setNewsletterLoading(false)
      return
    }

    setNewsletterMessage('Cadastro realizado. Obrigado por acompanhar a HIPERGIGA!')
    setNewsletterEmail('')
    setNewsletterLoading(false)
  }

  return <main>
    <section className="hero"><div className="wrap hero-grid"><div><span className="eyebrow coral">CURADORIA PARA A VIDA REAL</span><h1>A gente pesquisa.<em>Você escolhe melhor.</em></h1><p>Achadinhos, utilidades e soluções para deixar sua casa mais prática — sem perder horas procurando.</p><div className="actions"><a className="btn accent" href="#achadinhos">Ver achadinhos</a><a className="btn ghost" href="#categorias">Explorar categorias</a></div><div className="trust"><span>✓ Curadoria humana</span><span>✓ Links verificados</span><span>✓ Transparência sempre</span></div></div><div className="hero-card"><div className="home">⌂</div><b>CASA PRÁTICA</b><span>escolha simples</span></div></div></section>

    <section id="categorias" className="section"><div className="wrap"><div className="heading"><div><span className="eyebrow">COMECE POR AQUI</span><h2>O que você quer facilitar hoje?</h2></div><p>Organizamos os achadinhos por necessidade para você ir direto ao que faz sentido.</p></div><div className="cats">{categories.map(c => <a href={'/categoria/' + c.slug} className="cat" key={c.id}><div className="cat-icon">{iconFor(c.slug)}</div><h3>{c.name}</h3><p>{c.description}</p></a>)}</div></div></section>

    <section id="achadinhos" className="section white"><div className="wrap"><div className="heading"><div><span className="eyebrow coral">SELEÇÃO HIPERGIGA</span><h2>Achadinhos em destaque</h2></div><p>Uma vitrine limpa para destacar só o que vale a sua atenção.</p></div><div className="products">{products.map((p, index) => <article className="product" key={p.id}><div className="visual"><span>{emojiFor(index)}</span>{p.badge && <i>{p.badge}</i>}</div><div className="product-body"><small>{p.store_name}</small><h3>{p.title}</h3><strong>{money(p.price)}</strong><a href={'/produto/' + p.slug} className="btn primary">Ver oferta</a><em>Link patrocinado</em></div></article>)}</div></div></section>

    <section className="why"><div className="wrap why-grid"><div><span className="eyebrow light">POR QUE SEGUIR A HIPERGIGA?</span><h2>Menos impulso.<br/>Mais coisa útil.</h2><p>A proposta é filtrar o excesso e destacar o que realmente pode fazer sentido para sua casa.</p></div><div className="reasons"><div><b>01</b><h3>Pesquisa antes da indicação</h3><p>A curadoria nasce da utilidade.</p></div><div><b>02</b><h3>Informação que ajuda a decidir</h3><p>Preço, loja e verificação à vista.</p></div><div><b>03</b><h3>Afiliados sem letra miúda</h3><p>Quando houver comissão, você vai saber.</p></div></div></div></section>

    <section id="dicas" className="section white"><div className="wrap"><div className="heading"><div><span className="eyebrow coral">DICAS HIPERGIGA</span><h2>Conteúdo para escolher melhor.</h2></div><p>Guias práticos, organização e ideias úteis para o dia a dia.</p></div><div className="article-grid">{articles.map(article => <a className="article-card" href={'/artigo/' + article.slug} key={article.id}><div className="article-cover">H</div><div><span className="eyebrow">GUIA HIPERGIGA</span><h3>{article.title}</h3><p>{article.summary}</p><b>Ler artigo →</b></div></a>)}</div></div></section>

    <section id="sobre" className="section"><div className="wrap about"><div className="big-h">H</div><div><span className="eyebrow coral">SOBRE A HIPERGIGA</span><h2>Uma curadoria feita para simplificar escolhas.</h2><p>A HIPERGIGA reúne achadinhos e utilidades para o lar de um jeito mais organizado, transparente e fácil de explorar.</p></div></div></section>

    <section className="affiliate-note"><div className="wrap"><strong>Transparência em primeiro lugar.</strong><p>Alguns links da HIPERGIGA são links de afiliados. Se você comprar por eles, podemos receber uma comissão, sem custo adicional para você.</p></div></section>

    <section className="newsletter"><div className="wrap news-grid"><div><span className="eyebrow light">ACHADINHOS NA SUA CAIXA DE ENTRADA</span><h2>Uma seleção boa vale mais que cem abas abertas.</h2></div><div><form onSubmit={subscribe}><input type="email" placeholder="Seu melhor e-mail" value={newsletterEmail} onChange={event => setNewsletterEmail(event.target.value)} required/><button className="btn accent" disabled={newsletterLoading}>{newsletterLoading ? 'Cadastrando...' : 'Quero receber'}</button></form>{newsletterMessage && <p className="newsletter-message">{newsletterMessage}</p>}</div></div></section>
  </main>
}
