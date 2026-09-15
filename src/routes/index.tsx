import { createFileRoute } from '@tanstack/react-router'
import { categories, products } from '../lib/demo-data'

export const Route=createFileRoute('/')({component:Home})

function money(v:number){return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}

function Home(){
return <main>
<section className="hero"><div className="wrap hero-grid"><div><span className="eyebrow coral">CURADORIA PARA A VIDA REAL</span><h1>A gente pesquisa.<em>Você escolhe melhor.</em></h1><p>Achadinhos, utilidades e soluções para deixar sua casa mais prática — sem perder horas procurando.</p><div className="actions"><a className="btn accent" href="#achadinhos">Ver achadinhos</a><a className="btn ghost" href="#categorias">Explorar categorias</a></div><div className="trust"><span>✓ Curadoria humana</span><span>✓ Links verificados</span><span>✓ Transparência sempre</span></div></div><div className="hero-card"><div className="home">⌂</div><b>CASA PRÁTICA</b><span>escolha simples</span></div></div></section>

<section id="categorias" className="section"><div className="wrap"><div className="heading"><div><span className="eyebrow">COMECE POR AQUI</span><h2>O que você quer facilitar hoje?</h2></div><p>Organizamos os achadinhos por necessidade para você ir direto ao que faz sentido.</p></div><div className="cats">{categories.map(c=><a href={'/categoria/'+c.slug} className="cat" key={c.slug}><div className="cat-icon">{c.icon}</div><h3>{c.name}</h3><p>{c.desc}</p></a>)}</div></div></section>

<section id="achadinhos" className="section white"><div className="wrap"><div className="heading"><div><span className="eyebrow coral">SELEÇÃO HIPERGIGA</span><h2>Achadinhos em destaque</h2></div><p>Uma vitrine limpa para destacar só o que vale a sua atenção.</p></div><div className="products">{products.map(p=><article className="product" key={p.slug}><div className="visual"><span>{p.emoji}</span><i>{p.badge}</i></div><div className="product-body"><small>{p.store}</small><h3>{p.title}</h3><strong>{money(p.price)}</strong><a href={'/produto/'+p.slug} className="btn primary">Ver oferta</a><em>Link patrocinado</em></div></article>)}</div></div></section>

<section className="why"><div className="wrap why-grid"><div><span className="eyebrow light">POR QUE SEGUIR A HIPERGIGA?</span><h2>Menos impulso.<br/>Mais coisa útil.</h2><p>A proposta é filtrar o excesso e destacar o que realmente pode fazer sentido para sua casa.</p></div><div className="reasons"><div><b>01</b><h3>Pesquisa antes da indicação</h3><p>A curadoria nasce da utilidade.</p></div><div><b>02</b><h3>Informação que ajuda a decidir</h3><p>Preço, loja e verificação à vista.</p></div><div><b>03</b><h3>Afiliados sem letra miúda</h3><p>Quando houver comissão, você vai saber.</p></div></div></div></section>

<section id="sobre" className="section"><div className="wrap about"><div className="big-h">H</div><div><span className="eyebrow coral">SOBRE A HIPERGIGA</span><h2>Uma curadoria feita para simplificar escolhas.</h2><p>A HIPERGIGA reúne achadinhos e utilidades para o lar de um jeito mais organizado, transparente e fácil de explorar.</p></div></div></section>

<section className="newsletter"><div className="wrap news-grid"><div><span className="eyebrow light">ACHADINHOS NA SUA CAIXA DE ENTRADA</span><h2>Uma seleção boa vale mais que cem abas abertas.</h2></div><form onSubmit={e=>e.preventDefault()}><input type="email" placeholder="Seu melhor e-mail" required/><button className="btn accent">Quero receber</button></form></div></section>
</main>
}
