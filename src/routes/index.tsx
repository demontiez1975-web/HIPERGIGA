import { FormEvent, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
}

type Product = {
  id: string
  title: string
  slug: string
  price: number | null
  original_price: number | null
  discount_percent: number
  store_name: string
  badge: string | null
  category_id: string | null
  images: string[]
  affiliate_url: string
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
        .select('id,name,slug,description,image_url')
        .eq('active', true)
        .order('sort_order'),
      supabase
        .from('products')
        .select('id,title,slug,price,original_price,discount_percent,store_name,badge,category_id,images,affiliate_url')
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('verified_at', { ascending: false })
        .limit(12),
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

function money(value: number | null) {
  if (value == null) return 'Consultar oferta'
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

const categoryPhotos: Record<string, string> = {
  cozinha:
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=82',
  organizacao:
    'https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=900&q=82',
  limpeza:
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=82',
  banheiro:
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=82',
  decoracao:
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=82',
  'casas-pequenas':
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=82',
  'tecnologia-para-o-lar':
    'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=900&q=82',
}

const productPhotos = [
  'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=900&q=82',
  'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=900&q=82',
  'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=82',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=82',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=82',
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=82',
  'https://images.unsplash.com/photo-1600494603989-9650cf6ddd3d?auto=format&fit=crop&w=900&q=82',
  'https://images.unsplash.com/photo-1594224457860-23bdb45f8e3d?auto=format&fit=crop&w=900&q=82',
]

const articlePhotos = [
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=82',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=82',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=82',
]

const heroPhoto =
  'https://images.pexels.com/photos/3960720/pexels-photo-3960720.jpeg?auto=compress&cs=tinysrgb&w=1800'

function Home() {
  const { categories, products, articles } = Route.useLoaderData()

  function trackOffer(product: Product) {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)

    void supabase.from('affiliate_clicks').insert({
      product_id: product.id,
      store_name: product.store_name,
      source: 'homepage',
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      referrer: document.referrer || null,
      page_url: window.location.href,
    })
  }
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('newsletter_subscribers').insert({
      email: email.trim().toLowerCase(),
      source: 'homepage',
    })

    if (error) {
      setMessage(
        error.code === '23505'
          ? 'Esse e-mail já está cadastrado.'
          : 'Não foi possível cadastrar agora.',
      )
      setLoading(false)
      return
    }

    setMessage('Pronto! Você entrou para a lista da HIPERGIGA.')
    setEmail('')
    setLoading(false)
  }

  return (
    <main className="hg-home">
      <section className="hg-hero">
        <div className="hg-wrap hg-hero-grid">
          <div className="hg-hero-copy">
            <span className="hg-kicker">
              IDEIAS REAIS PARA UMA CASA MAIS FELIZ
            </span>

            <h1>
              A gente pesquisa.
              <br />
              <em>Você escolhe melhor.</em>
            </h1>

            <p>
              Achadinhos, utilidades e soluções para o seu lar, tudo em um só
              lugar. Nós pesquisamos, comparamos e destacamos boas escolhas para
              facilitar a sua rotina.
            </p>

            <div className="hg-hero-actions">
              <a className="hg-btn hg-btn-coral" href="#achadinhos">
                Ver achadinhos →
              </a>
              <a className="hg-btn hg-btn-soft" href="#sobre">
                Conheça nosso trabalho
              </a>
            </div>

            <div className="hg-trust-row">
              <div>
                <span>✓</span>
                <b>Seleção confiável</b>
                <small>Curadoria humana</small>
              </div>
              <div>
                <span>♢</span>
                <b>Parceiros verificados</b>
                <small>Lojas e ofertas</small>
              </div>
              <div>
                <span>♡</span>
                <b>Mais praticidade</b>
                <small>Para o dia a dia</small>
              </div>
            </div>
          </div>

          <div className="hg-hero-photo">
            <img
              src={heroPhoto}
              alt="Mulher jovem cozinhando em uma cozinha moderna e organizada"
            />
            <div className="hg-hero-note">
              Pequenas escolhas,
              <br />
              grandes mudanças ♥
            </div>
            <div className="hg-photo-card">
              <span>⌂</span>
              <div>
                <b>Organização também é qualidade de vida.</b>
                <small>Ideias simples para uma rotina mais leve.</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="categorias" className="hg-section">
        <div className="hg-wrap">
          <div className="hg-section-head">
            <div>
              <h2>Categorias em destaque</h2>
              <p>Tudo para um lar mais prático, bonito e funcional.</p>
            </div>
            <a href="#categorias">Ver todas as categorias →</a>
          </div>

          <div className="hg-category-row">
            {categories.map((category) => (
              <a
                className="hg-category-card"
                href={'/categoria/' + category.slug}
                key={category.id}
              >
                <img
                  src={category.image_url || categoryPhotos[category.slug] || categoryPhotos.cozinha}
                  alt={category.name}
                />
                <div>
                  <b>{category.name}</b>
                  <span>›</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="achadinhos" className="hg-section hg-white">
        <div className="hg-wrap">
          <div className="hg-section-head">
            <div>
              <h2>Achadinhos em destaque</h2>
              <p>Produtos selecionados para deixar sua casa ainda melhor.</p>
            </div>
            <a href="#achadinhos">Ver mais produtos →</a>
          </div>

          <div className="hg-product-grid">
            {products.slice(0, 8).map((product, index) => (
              <article className="hg-product-card" key={product.id}>
                <a
                  className="hg-product-image"
                  href={'/produto/' + product.slug}
                >
                  <img
                    src={product.images?.[0] || productPhotos[index % productPhotos.length]}
                    alt={product.title}
                  />
                  {product.badge && <span>{product.badge}</span>}
                  {product.discount_percent > 0 && <i className="hg-discount-badge">-{product.discount_percent}%</i>}
                </a>

                <div className="hg-product-info">
                  <small>{product.store_name}</small>
                  <h3>{product.title}</h3>
                  <div className="hg-price-stack">
                    {product.original_price != null && product.discount_percent > 0 && <del>{money(product.original_price)}</del>}
                    <strong>{money(product.price)}</strong>
                  </div>
                  <a
                    className="hg-product-btn"
                    href={product.affiliate_url}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    onClick={() => trackOffer(product)}
                  >
                    Ver na loja →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hg-benefits">
        <div className="hg-wrap hg-benefit-layout">
          <div>
            <h2>Por que seguir a Hipergiga?</h2>
            <p>Mais do que produtos, a gente entrega clareza e praticidade.</p>
          </div>

          <div className="hg-benefit-cards">
            <div>
              <span>⌕</span>
              <b>Curadoria de verdade</b>
              <p>Selecionamos só o que realmente vale a pena.</p>
            </div>
            <div>
              <span>★</span>
              <b>Economia de tempo</b>
              <p>Menos horas pesquisando e mais escolhas úteis.</p>
            </div>
            <div>
              <span>♡</span>
              <b>Um lar mais prático</b>
              <p>Soluções para simplificar sua rotina.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="dicas" className="hg-section">
        <div className="hg-wrap">
          <div className="hg-section-head">
            <div>
              <h2>Dicas para um lar melhor</h2>
              <p>Conteúdo útil, prático e feito para o seu dia a dia.</p>
            </div>
            <a href="#dicas">Ver todas as dicas →</a>
          </div>

          <div className="hg-articles">
            {articles.map((article, index) => (
              <a
                className="hg-article-card"
                href={'/artigo/' + article.slug}
                key={article.id}
              >
                <img
                  src={article.cover_image_url || articlePhotos[index % articlePhotos.length]}
                  alt={article.title}
                />
                <div>
                  <span>GUIA HIPERGIGA</span>
                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>
                  <b>Ler artigo →</b>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="sobre" className="hg-about-band">
        <div className="hg-wrap hg-about-grid">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=86"
            alt="Sala aconchegante"
          />
          <div>
            <span className="hg-kicker">SOBRE A HIPERGIGA</span>
            <h2>Boas escolhas deixam a casa mais leve.</h2>
            <p>
              A HIPERGIGA existe para organizar o excesso de opções e transformar
              pesquisa em recomendações simples, bonitas e úteis para a vida real.
            </p>
            <div className="hg-about-tags">
              <span>Curadoria</span>
              <span>Praticidade</span>
              <span>Transparência</span>
            </div>
          </div>
        </div>
      </section>

      <section className="hg-newsletter">
        <div className="hg-wrap hg-newsletter-grid">
          <div>
            <span>✉</span>
            <div>
              <h3>Receba os melhores achadinhos no seu e-mail</h3>
              <p>Dicas, ofertas e novidades para um lar mais prático.</p>
            </div>
          </div>

          <div>
            <form onSubmit={subscribe}>
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <button disabled={loading}>
                {loading ? 'Enviando...' : 'Quero receber →'}
              </button>
            </form>
            {message && <small>{message}</small>}
          </div>
        </div>
      </section>

      <section className="hg-disclosure">
        <div className="hg-wrap">
          <b>ⓘ Transparência sempre</b>
          <p>
            A HIPERGIGA pode receber comissão por compras realizadas através de
            alguns links, sem nenhum custo adicional para você.
          </p>
        </div>
      </section>
    </main>
  )
}
