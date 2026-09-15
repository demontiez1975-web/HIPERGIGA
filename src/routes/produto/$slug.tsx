import { MouseEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/produto/$slug')({
  loader: async ({ params }) => {
    const { data: product, error } = await supabase
      .from('products')
      .select('id,title,slug,description,benefits,images,price,store_name,affiliate_url,badge,verified_at,category_id')
      .eq('slug', params.slug)
      .eq('active', true)
      .maybeSingle()

    if (error) throw error
    if (!product) return { product: null, related: [] }

    const { data: related } = await supabase
      .from('products')
      .select('id,title,slug,price,store_name,badge')
      .eq('category_id', product.category_id)
      .eq('active', true)
      .neq('id', product.id)
      .limit(4)

    return { product, related: related ?? [] }
  },
  component: Page,
})

function Page() {
  const { product: p, related } = Route.useLoaderData()

  if (!p) return <main className="page"><div className="wrap"><h1>Produto não encontrado</h1></div></main>

  const benefits = Array.isArray(p.benefits) ? p.benefits.filter((x): x is string => typeof x === 'string') : []

  async function handleOfferClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()

    const target = p.affiliate_url
    const pageUrl = typeof window !== 'undefined' ? window.location.href : null
    const referrer = typeof document !== 'undefined' ? document.referrer || null : null
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null

    const insertPromise = supabase.from('affiliate_clicks').insert({
      product_id: p.id,
      store_name: p.store_name,
      source: 'product_page',
      utm_source: params?.get('utm_source'),
      utm_medium: params?.get('utm_medium'),
      utm_campaign: params?.get('utm_campaign'),
      utm_content: params?.get('utm_content'),
      utm_term: params?.get('utm_term'),
      referrer,
      page_url: pageUrl,
    })

    const timeout = new Promise(resolve => setTimeout(resolve, 250))
    await Promise.race([insertPromise, timeout])

    if (typeof window !== 'undefined') {
      window.open(target, '_blank', 'noopener,noreferrer')
    }
  }

  return <main className="page"><div className="wrap">
    <div className="detail">
      <div className="detail-visual">🏡</div>
      <div>
        {p.badge && <span className="eyebrow coral">{p.badge}</span>}
        <h1>{p.title}</h1>
        <p>{p.description}</p>
        {benefits.length > 0 && <ul>{benefits.map(item => <li key={item}>{item}</li>)}</ul>}
        <strong className="price">{p.price == null ? 'Consultar oferta' : p.price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong>
        <p className="muted">Loja parceira: {p.store_name}</p>
        <a className="btn accent big" href={p.affiliate_url} onClick={handleOfferClick} target="_blank" rel="sponsored noopener noreferrer">Ver oferta na loja</a>
        <small className="disclosure">Podemos receber comissão por compras feitas por este link, sem custo adicional para você.</small>
      </div>
    </div>
    {related.length > 0 && <section className="section"><span className="eyebrow">VOCÊ TAMBÉM PODE GOSTAR</span><div className="products">{related.map(r => <article className="product" key={r.id}><div className="product-body"><small>{r.store_name}</small><h3>{r.title}</h3><a className="btn primary" href={'/produto/' + r.slug}>Ver produto</a></div></article>)}</div></section>}
  </div></main>
}
