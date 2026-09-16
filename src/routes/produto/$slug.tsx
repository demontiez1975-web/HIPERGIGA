import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/produto/$slug')({
  loader: async ({ params }) => {
    const { data: product, error } = await supabase
      .from('products')
      .select('id,title,slug,description,benefits,images,price,original_price,discount_percent,store_name,affiliate_url,badge,verified_at,category_id')
      .eq('slug', params.slug)
      .eq('active', true)
      .maybeSingle()

    if (error) throw error
    if (!product) return { product: null, related: [] }

    const { data: related } = await supabase
      .from('products')
      .select('id,title,slug,price,original_price,discount_percent,store_name,badge,images')
      .eq('category_id', product.category_id)
      .eq('active', true)
      .neq('id', product.id)
      .limit(4)

    return { product, related: related ?? [] }
  },
  component: Page,
})

function money(value: number | null) {
  if (value == null) return 'Consultar oferta'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Page() {
  const { product: product, related } = Route.useLoaderData()
  const images = product?.images ?? []
  const [selectedImage, setSelectedImage] = useState(images[0] ?? '')

  if (!product) {
    return <main className="page"><div className="wrap"><h1>Produto não encontrado</h1></div></main>
  }

  const benefits = Array.isArray(product.benefits)
    ? product.benefits.filter((item): item is string => typeof item === 'string')
    : []

  function handleOfferClick() {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)

    void supabase.from('affiliate_clicks').insert({
      product_id: product.id,
      store_name: product.store_name,
      source: 'product_page',
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      referrer: document.referrer || null,
      page_url: window.location.href,
    })
  }

  return (
    <main className="page product-page">
      <div className="wrap">
        <div className="product-detail">
          <div className="product-gallery">
            <div className="product-main-image">
              {selectedImage
                ? <img src={selectedImage} alt={product.title} />
                : <div className="product-placeholder large">HIPERGIGA</div>}
            </div>

            {images.length > 1 && (
              <div className="product-thumbs">
                {images.map((url, index) => (
                  <button
                    type="button"
                    key={url}
                    className={selectedImage === url ? 'active' : ''}
                    onClick={() => setSelectedImage(url)}
                    aria-label={'Ver imagem ' + (index + 1)}
                  >
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail-copy">
            {product.badge && <span className="eyebrow coral">{product.badge}</span>}
            <h1>{product.title}</h1>
            <p>{product.description}</p>

            {benefits.length > 0 && (
              <ul className="product-benefits">
                {benefits.map(item => <li key={item}>{item}</li>)}
              </ul>
            )}

            <div className="product-offer-price">
              {product.discount_percent > 0 && product.original_price != null && <del>{money(product.original_price)}</del>}
              <div>
                <strong className="price">{money(product.price)}</strong>
                {product.discount_percent > 0 && <span className="product-discount-pill">-{product.discount_percent}%</span>}
              </div>
            </div>
            <p className="muted">Loja parceira: {product.store_name}</p>
            {product.verified_at && (
              <p className="verified-date">
                Oferta verificada em {new Date(product.verified_at).toLocaleDateString('pt-BR')}
              </p>
            )}

            <a
              className="btn accent big"
              href={product.affiliate_url}
              onClick={handleOfferClick}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              Ver oferta na loja →
            </a>

            <small className="disclosure">
              Podemos receber comissão por compras feitas por este link, sem custo adicional para você.
            </small>
          </div>
        </div>

        {related.length > 0 && (
          <section className="related-section">
            <span className="eyebrow">VOCÊ TAMBÉM PODE GOSTAR</span>
            <h2>Produtos relacionados</h2>
            <div className="hg-product-grid">
              {related.map(item => (
                <article className="hg-product-card" key={item.id}>
                  <a className="hg-product-image" href={'/produto/' + item.slug}>
                    {item.images?.[0]
                      ? <img src={item.images[0]} alt={item.title} />
                      : <div className="product-placeholder">HIPERGIGA</div>}
                    {item.badge && <span>{item.badge}</span>}
                    {item.discount_percent > 0 && <i className="hg-discount-badge">-{item.discount_percent}%</i>}
                  </a>
                  <div className="hg-product-info">
                    <small>{item.store_name}</small>
                    <h3>{item.title}</h3>
                    <div className="hg-price-stack">
                      {item.original_price != null && item.discount_percent > 0 && <del>{money(item.original_price)}</del>}
                      <strong>{money(item.price)}</strong>
                    </div>
                    <a className="hg-product-btn" href={'/produto/' + item.slug}>Ver produto →</a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
