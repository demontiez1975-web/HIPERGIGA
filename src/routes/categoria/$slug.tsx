import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/categoria/$slug')({
  loader: async ({ params }) => {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id,name,slug,description,image_url')
      .eq('slug', params.slug)
      .eq('active', true)
      .maybeSingle()

    if (categoryError) throw categoryError
    if (!category) return { category: null, products: [] }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id,title,slug,store_name,badge,price,images,affiliate_url')
      .eq('category_id', category.id)
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('verified_at', { ascending: false })

    if (productsError) throw productsError

    return { category, products: products ?? [] }
  },
  component: Page,
})

function money(value: number | null) {
  if (value == null) return 'Consultar oferta'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Page() {
  const { category, products } = Route.useLoaderData()

  function trackOffer(product: { id:string; store_name:string; affiliate_url:string }) {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)

    void supabase.from('affiliate_clicks').insert({
      product_id: product.id,
      store_name: product.store_name,
      source: 'category_page',
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      referrer: document.referrer || null,
      page_url: window.location.href,
    })
  }

  if (!category) {
    return <main className="page"><div className="wrap"><h1>Categoria não encontrada</h1></div></main>
  }

  return (
    <main className="page">
      <div className="wrap">
        <div className="category-page-head">
          <div>
            <span className="eyebrow">CATEGORIA</span>
            <h1>{category.name}</h1>
            <p>{category.description}</p>
          </div>
          {category.image_url && <img src={category.image_url} alt={category.name} />}
        </div>

        <div className="hg-product-grid category-products">
          {products.map(product => (
            <article className="hg-product-card" key={product.id}>
              <a className="hg-product-image" href={'/produto/' + product.slug}>
                {product.images?.[0]
                  ? <img src={product.images[0]} alt={product.title} />
                  : <div className="product-placeholder">HIPERGIGA</div>}
                {product.badge && <span>{product.badge}</span>}
              </a>
              <div className="hg-product-info">
                <small>{product.store_name}</small>
                <h3>{product.title}</h3>
                <strong>{money(product.price)}</strong>
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
    </main>
  )
}
