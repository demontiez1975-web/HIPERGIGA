import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/categoria/$slug')({
  loader: async ({ params }) => {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id,name,slug,description')
      .eq('slug', params.slug)
      .eq('active', true)
      .maybeSingle()

    if (categoryError) throw categoryError
    if (!category) return { category: null, products: [] }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id,title,slug,store_name,badge,price')
      .eq('category_id', category.id)
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('verified_at', { ascending: false })

    if (productsError) throw productsError

    return { category, products: products ?? [] }
  },
  component: Page,
})

function money(v: number | null) {
  if (v == null) return 'Consultar oferta'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Page() {
  const { category, products } = Route.useLoaderData()

  if (!category) {
    return <main className="page"><div className="wrap"><h1>Categoria não encontrada</h1></div></main>
  }

  return <main className="page"><div className="wrap"><span className="eyebrow">CATEGORIA</span><h1>{category.name}</h1><p>{category.description}</p><div className="products">{products.map((p, index) => <article className="product" key={p.id}><div className="visual"><span>{['🫙','🧺','🧽','🧴','🪑','💡'][index % 6]}</span>{p.badge && <i>{p.badge}</i>}</div><div className="product-body"><small>{p.store_name}</small><h3>{p.title}</h3><strong>{money(p.price)}</strong><a className="btn primary" href={'/produto/' + p.slug}>Ver produto</a></div></article>)}</div></div></main>
}
