import { createFileRoute } from '@tanstack/react-router'
import { categories, products } from '../../lib/demo-data'
export const Route=createFileRoute('/categoria/$slug')({component:Page})
function Page(){const {slug}=Route.useParams();const c=categories.find(x=>x.slug===slug);const list=products.filter(x=>x.category===slug);return <main className="page"><div className="wrap"><span className="eyebrow">CATEGORIA</span><h1>{c?.name||'Categoria'}</h1><p>{c?.desc}</p><div className="products">{list.map(p=><article className="product" key={p.slug}><div className="visual"><span>{p.emoji}</span><i>{p.badge}</i></div><div className="product-body"><small>{p.store}</small><h3>{p.title}</h3><a className="btn primary" href={'/produto/'+p.slug}>Ver produto</a></div></article>)}</div></div></main>}
