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

  return <main className="home-page">
    <section className="hero hero-premium">
      <div className="wrap hero-premium-grid">
        <div className="hero-copy">
          <span className="eyebrow coral">CURADORIA PARA A VIDA REAL</span>
          <h1>Achadinhos para uma casa <em>mais prática, bonita e inteligente.</em></h1>
          <p>Selecionamos utilidades e boas ideias para você comprar melhor, organizar melhor e perder menos tempo procurando.</p>
          <div className="actions">
            <a className="btn accent" href="#achadinhos">Ver achadinhos</a>
            <a className="btn soft" href="#categorias">Explorar categorias</a>
          </div>
          <div className="hero-proof">
            <span>Curadoria humana</span>
            <span>Links verificados</span>
            <span>Transparência em afiliados</span>
          </div>
        </div>

        <div className="hero-showcase">
          <div className="showcase-card main-showcase">
            <span className="showcase-kicker">HIPERGIGA ESCOLHE</span>
            <div className="showcase-visual">🏡</div>
            <div className="showcase-copy">
              <b>Casa prática sem complicação</b>
              <p>Ideias úteis, achados inteligentes e escolhas simples para o dia a dia.</p>
            </div>
          </div>
          <div className="floating-card floating-top"><span>✓</span><b>Curadoria que poupa tempo</b></div>
          <div className="floating-card floating-bottom"><span>↗</span><b>Achados que fazem sentido</b></div>
        </div>
      </div>
    </section>

    <section id="categorias" className="section category-section">
      <div className="wrap">
        <div className="section-intro">
          <div>
            <span className="eyebrow">COMECE POR AQUI</span>
            <h2>Encontre o que facilita sua rotina.</h2>
          </div>
          <p>Organizamos a curadoria por ambiente e necessidade, para você chegar mais rápido ao que realmente interessa.</p>
        </div>

        <div className="category-grid-pro">
          {categories.map((c, index) => (
            <a href={'/categoria/' + c.slug} className="category-card-pro" key={c.id}>
              <div className="category-icon-pro">{iconFor(c.slug)}</div>
              <div className="category-content-pro">
                <span>0{index + 1}</span>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
              </div>
              <b>Explorar →</b>
            </a>
          ))}
        </div>
      </div>
    </section>

    <section id="achadinhos" className="section featured-section">
      <div className="wrap">
        <div className="section-intro">
          <div>
            <span className="eyebrow coral">SELEÇÃO HIPERGIGA</span>
            <h2>Achadinhos em destaque.</h2>
          </div>
          <p>Uma seleção enxuta, clara e pensada para facilitar a sua decisão.</p>
        </div>

        <div className="product-grid-pro">
          {products.slice(0, 8).map((p, index) => (
            <article className="product-card-pro" key={p.id}>
              <a href={'/produto/' + p.slug} className="product-visual-pro">
                <span className="product-emoji">{emojiFor(index)}</span>
                {p.badge && <i>{p.badge}</i>}
              </a>
              <div className="product-content-pro">
                <small>{p.store_name}</small>
                <h3><a href={'/produto/' + p.slug}>{p.title}</a></h3>
                <div className="product-bottom-pro">
                  <strong>{money(p.price)}</strong>
                  <a href={'/produto/' + p.slug} className="circle-link">↗</a>
                </div>
                <em>Link patrocinado</em>
              </div>
            </article>
          ))}
        </div>

        <div className="center-action"><a className="btn soft" href="#categorias">Ver mais categorias</a></div>
      </div>
    </section>

    <section className="editorial-strip">
      <div className="wrap editorial-grid">
        <div>
          <span className="eyebrow light">POR QUE HIPERGIGA?</span>
          <h2>Menos excesso.<br/>Mais escolha boa.</h2>
        </div>
        <div className="editorial-points">
          <div><span>01</span><h3>Pesquisa antes da indicação</h3><p>A curadoria nasce da utilidade, não do volume.</p></div>
          <div><span>02</span><h3>Informação que ajuda a decidir</h3><p>Preço, loja e contexto aparecem de forma simples.</p></div>
          <div><span>03</span><h3>Afiliados sem letra miúda</h3><p>Quando houver comissão, você vai saber.</p></div>
        </div>
      </div>
    </section>

    <section id="dicas" className="section article-section">
      <div className="wrap">
        <div className="section-intro">
          <div>
            <span className="eyebrow coral">DICAS HIPERGIGA</span>
            <h2>Conteúdo que ajuda a escolher melhor.</h2>
          </div>
          <p>Guias rápidos, organização, decoração e utilidades para a vida real.</p>
        </div>

        <div className="article-grid-pro">
          {articles.map((article, index) => (
            <a className="article-card-pro" href={'/artigo/' + article.slug} key={article.id}>
              <div className="article-number">0{index + 1}</div>
              <div className="article-image-pro">H</div>
              <div className="article-copy-pro">
                <span className="eyebrow">GUIA HIPERGIGA</span>
                <h3>{article.title}</h3>
                <p>{article.summary}</p>
                <b>Ler artigo →</b>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>

    <section id="sobre" className="section about-section-pro">
      <div className="wrap about-pro">
        <div className="about-brand-block">
          <span>H</span>
        </div>
        <div className="about-copy-pro">
          <span className="eyebrow coral">SOBRE A HIPERGIGA</span>
          <h2>Uma curadoria feita para simplificar escolhas.</h2>
          <p>A HIPERGIGA reúne achadinhos e utilidades para o lar de um jeito organizado, transparente e agradável de explorar.</p>
          <div className="about-chips"><span>Curadoria</span><span>Praticidade</span><span>Transparência</span></div>
        </div>
      </div>
    </section>

    <section className="affiliate-note affiliate-note-pro">
      <div className="wrap">
        <strong>Transparência em primeiro lugar.</strong>
        <p>Alguns links da HIPERGIGA são links de afiliados. Se você comprar por eles, podemos receber uma comissão, sem custo adicional para você.</p>
      </div>
    </section>

    <section className="newsletter newsletter-pro">
      <div className="wrap news-grid-pro">
        <div>
          <span className="eyebrow light">ACHADINHOS NA SUA CAIXA DE ENTRADA</span>
          <h2>Uma seleção boa vale mais que cem abas abertas.</h2>
          <p>Receba novidades e achados selecionados pela HIPERGIGA.</p>
        </div>
        <div className="newsletter-panel">
          <form onSubmit={subscribe}>
            <input type="email" placeholder="Seu melhor e-mail" value={newsletterEmail} onChange={event => setNewsletterEmail(event.target.value)} required/>
            <button className="btn accent" disabled={newsletterLoading}>{newsletterLoading ? 'Cadastrando...' : 'Quero receber'}</button>
          </form>
          {newsletterMessage && <p className="newsletter-message">{newsletterMessage}</p>}
        </div>
      </div>
    </section>
  </main>
}
