import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/admin/')({ component: Admin })

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  active: boolean
}

type Product = {
  id: string
  category_id: string | null
  title: string
  slug: string
  description: string | null
  benefits: unknown
  images: string[]
  price: number | null
  original_price: number | null
  discount_percent: number
  store_name: string
  affiliate_url: string
  featured: boolean
  badge: string | null
  active: boolean
}

type Article = {
  id: string
  title: string
  slug: string
  summary: string | null
  content: string | null
  cover_image_url: string | null
  published: boolean
}

type Tab = 'dashboard' | 'products' | 'categories' | 'articles'

const emptyProduct = {
  id: '',
  category_id: '',
  title: '',
  slug: '',
  description: '',
  benefits: '',
  images: [] as string[],
  price: '',
  original_price: '',
  has_discount: false,
  discount_percent: '0',
  store_name: '',
  affiliate_url: '',
  featured: false,
  badge: '',
  active: true,
}

const emptyCategory = {
  id: '',
  name: '',
  slug: '',
  description: '',
  image_url: '',
  sort_order: '0',
  active: true,
}

const emptyArticle = {
  id: '',
  title: '',
  slug: '',
  summary: '',
  content: '',
  cover_image_url: '',
  published: false,
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function safeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parsePrice(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed
  const number = Number(normalized)
  return Number.isFinite(number) ? number : null
}

function money(value: number | null) {
  if (value == null) return 'Preço não informado'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function calculateDiscount(original: number | null, current: number | null) {
  if (!original || !current || original <= current) return 0
  return Math.min(99, Math.max(1, Math.round((1 - current / original) * 100)))
}

function Admin() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [clicksToday, setClicksToday] = useState(0)
  const [clicks7Days, setClicks7Days] = useState(0)
  const [subscribers, setSubscribers] = useState(0)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [productForm, setProductForm] = useState({ ...emptyProduct })
  const [categoryForm, setCategoryForm] = useState({ ...emptyCategory })
  const [articleForm, setArticleForm] = useState({ ...emptyArticle })

  const loadData = useCallback(async () => {
    const now = new Date()
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const start7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      categoriesResult,
      productsResult,
      articlesResult,
      clicksTodayResult,
      clicks7DaysResult,
      subscribersResult,
    ] = await Promise.all([
      supabase
        .from('categories')
        .select('id,name,slug,description,image_url,sort_order,active')
        .order('sort_order'),
      supabase
        .from('products')
        .select('id,category_id,title,slug,description,benefits,images,price,original_price,discount_percent,store_name,affiliate_url,featured,badge,active')
        .neq('affiliate_url', 'https://example.com')
        .order('created_at', { ascending: false }),
      supabase
        .from('articles')
        .select('id,title,slug,summary,content,cover_image_url,published')
        .order('created_at', { ascending: false }),
      supabase.from('affiliate_clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', startToday),
      supabase.from('affiliate_clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', start7Days),
      supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
    ])

    if (categoriesResult.error) throw categoriesResult.error
    if (productsResult.error) throw productsResult.error
    if (articlesResult.error) throw articlesResult.error

    setCategories((categoriesResult.data ?? []) as Category[])
    setProducts((productsResult.data ?? []) as Product[])
    setArticles((articlesResult.data ?? []) as Article[])
    setClicksToday(clicksTodayResult.count ?? 0)
    setClicks7Days(clicks7DaysResult.count ?? 0)
    setSubscribers(subscribersResult.count ?? 0)
  }, [])

  useEffect(() => {
    async function checkAccess() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        if (typeof window !== 'undefined') window.location.href = '/auth'
        return
      }

      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle()

      if (!role) {
        await supabase.auth.signOut()
        if (typeof window !== 'undefined') window.location.href = '/auth'
        return
      }

      setAuthorized(true)

      try {
        await loadData()
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Não foi possível carregar o painel.')
      }
    }

    checkAccess()
  }, [loadData])

  const categoryName = useMemo(
    () => new Map(categories.map(category => [category.id, category.name])),
    [categories],
  )

  const previewPrice = parsePrice(productForm.price)
  const previewOriginal = productForm.has_discount ? parsePrice(productForm.original_price) : null
  const previewDiscount = productForm.has_discount ? Number(productForm.discount_percent || 0) : 0

  async function signOut() {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') window.location.href = '/auth'
  }

  async function uploadImage(file: File, folder: string) {
    if (!file.type.startsWith('image/')) throw new Error('Selecione apenas arquivos de imagem.')
    if (file.size > 5 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 5 MB.')

    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
    const base = safeName(file.name.replace(/\.[^.]+$/, '')) || 'imagem'
    const path = folder + '/' + Date.now() + '-' + base + '.' + ext

    const { error } = await supabase.storage
      .from('hipergiga-media')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    const { data } = supabase.storage.from('hipergiga-media').getPublicUrl(path)
    return data.publicUrl
  }

  async function uploadProductImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    setMessage('Enviando imagens...')

    try {
      const remaining = Math.max(0, 6 - productForm.images.length)
      const selected = files.slice(0, remaining)
      const urls: string[] = []

      for (const file of selected) {
        urls.push(await uploadImage(file, 'products'))
      }

      setProductForm(current => ({
        ...current,
        images: [...current.images, ...urls],
      }))
      setMessage(urls.length + ' imagem(ns) enviada(s).')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha no upload.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function uploadCategoryImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage('Enviando imagem...')

    try {
      const url = await uploadImage(file, 'categories')
      setCategoryForm(current => ({ ...current, image_url: url }))
      setMessage('Imagem da categoria enviada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha no upload.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function uploadArticleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage('Enviando capa...')

    try {
      const url = await uploadImage(file, 'articles')
      setArticleForm(current => ({ ...current, cover_image_url: url }))
      setMessage('Capa enviada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha no upload.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  function makeMainImage(index: number) {
    setProductForm(current => {
      const images = [...current.images]
      const selected = images.splice(index, 1)[0]
      return { ...current, images: [selected, ...images] }
    })
  }

  function updateCurrentPrice(value: string) {
    const original = parsePrice(productForm.original_price)
    const current = parsePrice(value)
    const autoDiscount = calculateDiscount(original, current)

    setProductForm(currentForm => ({
      ...currentForm,
      price: value,
      discount_percent:
        currentForm.has_discount && autoDiscount > 0
          ? String(autoDiscount)
          : currentForm.discount_percent,
    }))
  }

  function updateOriginalPrice(value: string) {
    const original = parsePrice(value)
    const current = parsePrice(productForm.price)
    const autoDiscount = calculateDiscount(original, current)

    setProductForm(currentForm => ({
      ...currentForm,
      original_price: value,
      discount_percent: autoDiscount > 0 ? String(autoDiscount) : currentForm.discount_percent,
    }))
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (!productForm.category_id) {
      setMessage('Escolha uma categoria para o produto.')
      return
    }

    if (!productForm.images.length) {
      setMessage('Carregue pelo menos uma foto do produto.')
      return
    }

    const price = parsePrice(productForm.price)
    const originalPrice = productForm.has_discount ? parsePrice(productForm.original_price) : null
    const discountPercent = productForm.has_discount
      ? Math.min(99, Math.max(0, Number(productForm.discount_percent || 0)))
      : 0

    if (price == null || price < 0) {
      setMessage('Informe um preço válido.')
      return
    }

    if (productForm.has_discount && discountPercent <= 0) {
      setMessage('Informe a porcentagem do desconto.')
      return
    }

    const benefits = productForm.benefits
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)

    const generatedSlug = productForm.slug || slugify(productForm.title)

    const payload = {
      category_id: productForm.category_id,
      title: productForm.title.trim(),
      slug: generatedSlug,
      description: productForm.description.trim() || null,
      benefits,
      images: productForm.images,
      price,
      original_price: originalPrice,
      discount_percent: discountPercent,
      store_name: productForm.store_name.trim(),
      affiliate_url: productForm.affiliate_url.trim(),
      featured: productForm.featured,
      badge: productForm.badge.trim() || null,
      active: productForm.active,
      verified_at: new Date().toISOString(),
    }

    const query = productForm.id
      ? supabase.from('products').update(payload).eq('id', productForm.id)
      : supabase.from('products').insert(payload)

    const { error } = await query

    if (error) {
      setMessage(error.code === '23505' ? 'Já existe um produto com esse nome/slug.' : error.message)
      return
    }

    setProductForm({ ...emptyProduct })
    setMessage(productForm.id ? 'Produto atualizado com sucesso.' : 'Produto publicado com sucesso.')
    await loadData()
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const generatedSlug = categoryForm.slug || slugify(categoryForm.name)
    const payload = {
      name: categoryForm.name.trim(),
      slug: generatedSlug,
      description: categoryForm.description.trim() || null,
      image_url: categoryForm.image_url.trim() || null,
      sort_order: Number(categoryForm.sort_order || 0),
      active: categoryForm.active,
    }

    const query = categoryForm.id
      ? supabase.from('categories').update(payload).eq('id', categoryForm.id)
      : supabase.from('categories').insert(payload)

    const { error } = await query
    if (error) {
      setMessage(error.message)
      return
    }

    setCategoryForm({ ...emptyCategory })
    setMessage(categoryForm.id ? 'Categoria atualizada.' : 'Categoria criada.')
    await loadData()
  }

  async function saveArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const generatedSlug = articleForm.slug || slugify(articleForm.title)
    const payload = {
      title: articleForm.title.trim(),
      slug: generatedSlug,
      summary: articleForm.summary.trim() || null,
      content: articleForm.content.trim() || null,
      cover_image_url: articleForm.cover_image_url.trim() || null,
      published: articleForm.published,
      published_at: articleForm.published ? new Date().toISOString() : null,
    }

    const query = articleForm.id
      ? supabase.from('articles').update(payload).eq('id', articleForm.id)
      : supabase.from('articles').insert(payload)

    const { error } = await query
    if (error) {
      setMessage(error.message)
      return
    }

    setArticleForm({ ...emptyArticle })
    setMessage(articleForm.id ? 'Artigo atualizado.' : 'Artigo criado.')
    await loadData()
  }

  async function removeRow(table: 'products' | 'categories' | 'articles', id: string) {
    if (typeof window !== 'undefined' && !window.confirm('Deseja realmente excluir este item?')) return

    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Item excluído.')
    await loadData()
  }

  function editProduct(product: Product) {
    const benefits = Array.isArray(product.benefits)
      ? product.benefits.filter(item => typeof item === 'string').join('\n')
      : ''

    setProductForm({
      id: product.id,
      category_id: product.category_id ?? '',
      title: product.title,
      slug: product.slug,
      description: product.description ?? '',
      benefits,
      images: Array.isArray(product.images) ? product.images : [],
      price: product.price?.toString() ?? '',
      original_price: product.original_price?.toString() ?? '',
      has_discount: (product.discount_percent ?? 0) > 0,
      discount_percent: String(product.discount_percent ?? 0),
      store_name: product.store_name,
      affiliate_url: product.affiliate_url,
      featured: product.featured,
      badge: product.badge ?? '',
      active: product.active,
    })
    setTab('products')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (authorized === null) {
    return <main className="page"><div className="wrap"><p>Verificando acesso...</p></div></main>
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="brand admin-brand" href="/"><span>H</span>HIPERGIGA</a>
        <div className="admin-nav">
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Visão geral</button>
          <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Produtos</button>
          <button className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>Categorias</button>
          <button className={tab === 'articles' ? 'active' : ''} onClick={() => setTab('articles')}>Artigos</button>
        </div>
        <button className="btn ghost admin-logout" onClick={signOut}>Sair</button>
      </aside>

      <section className="admin-main">
        <div className="admin-top">
          <div>
            <span className="eyebrow coral">PAINEL ADMINISTRATIVO</span>
            <h1>HIPERGIGA Admin</h1>
            <p>Cadastre produtos, imagens, ofertas e links das lojas sem mexer no código.</p>
          </div>
          <a className="btn primary" href="/" target="_blank" rel="noreferrer">Ver site</a>
        </div>

        {message && <p className="form-message">{message}</p>}

        {tab === 'dashboard' && (
          <>
            <div className="metrics">
              <div><span>Produtos reais</span><strong>{products.length}</strong></div>
              <div><span>Cliques hoje</span><strong>{clicksToday}</strong></div>
              <div><span>Cliques em 7 dias</span><strong>{clicks7Days}</strong></div>
              <div><span>Assinantes</span><strong>{subscribers}</strong></div>
            </div>

            <div className="admin-quick-grid">
              <button className="admin-quick-card" onClick={() => { setProductForm({ ...emptyProduct }); setTab('products') }}>
                <span>＋</span>
                <div><b>Novo produto</b><small>Foto, preço, desconto e link da loja.</small></div>
              </button>
              <button className="admin-quick-card" onClick={() => setTab('categories')}>
                <span>▦</span>
                <div><b>Editar categorias</b><small>Imagens e organização da vitrine.</small></div>
              </button>
              <button className="admin-quick-card" onClick={() => setTab('articles')}>
                <span>✎</span>
                <div><b>Novo conteúdo</b><small>Dicas e artigos da HIPERGIGA.</small></div>
              </button>
            </div>

            <div className="admin-card">
              <h2>Catálogo</h2>
              <p>{categories.length} categorias · {products.filter(product => product.active).length} produtos publicados · {articles.length} artigos.</p>
            </div>
          </>
        )}

        {tab === 'products' && (
          <div className="admin-product-layout">
            <form className="admin-card admin-form admin-product-editor" onSubmit={saveProduct}>
              <div className="admin-form-title">
                <div>
                  <span className="admin-step">CATÁLOGO</span>
                  <h2>{productForm.id ? 'Editar produto' : 'Adicionar produto'}</h2>
                  <p>Preencha apenas o que o cliente precisa para escolher e comprar.</p>
                </div>
                {productForm.id && <button className="btn ghost" type="button" onClick={() => setProductForm({ ...emptyProduct })}>Novo produto</button>}
              </div>

              <section className="admin-form-section">
                <div className="admin-section-heading"><span>1</span><div><b>Produto</b><small>Informações principais da oferta.</small></div></div>

                <label>
                  Categoria
                  <select value={productForm.category_id} onChange={event => setProductForm({ ...productForm, category_id: event.target.value })} required>
                    <option value="">Escolha uma categoria</option>
                    {categories.filter(category => category.active).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>

                <label>
                  Nome do produto
                  <input
                    value={productForm.title}
                    onChange={event => setProductForm(current => ({
                      ...current,
                      title: event.target.value,
                      slug: current.id ? current.slug : slugify(event.target.value),
                    }))}
                    placeholder="Ex.: Organizador giratório para temperos"
                    required
                  />
                </label>

                <label>
                  Descrição
                  <textarea
                    value={productForm.description}
                    onChange={event => setProductForm({ ...productForm, description: event.target.value })}
                    placeholder="Explique em poucas linhas por que esse produto é útil."
                    required
                  />
                </label>

                <label>
                  Benefícios <small>um por linha</small>
                  <textarea
                    value={productForm.benefits}
                    onChange={event => setProductForm({ ...productForm, benefits: event.target.value })}
                    placeholder={'Economiza espaço\nFácil de limpar\nBoa avaliação dos compradores'}
                  />
                </label>
              </section>

              <section className="admin-form-section">
                <div className="admin-section-heading"><span>2</span><div><b>Fotos</b><small>A primeira imagem é a principal.</small></div></div>

                <div className="admin-upload-box">
                  <div>
                    <b>Fotos do produto</b>
                    <small>Até 6 imagens. JPG, PNG, WEBP ou GIF, até 5 MB cada.</small>
                  </div>
                  <label className="btn ghost admin-file-btn">
                    {uploading ? 'Enviando...' : 'Carregar fotos'}
                    <input type="file" accept="image/*" multiple onChange={uploadProductImages} disabled={uploading || productForm.images.length >= 6} />
                  </label>
                </div>

                {productForm.images.length > 0 && (
                  <div className="admin-image-grid">
                    {productForm.images.map((url, index) => (
                      <div className="admin-image-thumb" key={url + index}>
                        <img src={url} alt={'Produto ' + (index + 1)} />
                        {index === 0 ? <span>Principal</span> : <button className="make-main" type="button" onClick={() => makeMainImage(index)}>★</button>}
                        <button className="remove-image" type="button" onClick={() => setProductForm(current => ({ ...current, images: current.images.filter((_, i) => i !== index) }))}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="admin-form-section">
                <div className="admin-section-heading"><span>3</span><div><b>Oferta</b><small>Preço, desconto e destino da compra.</small></div></div>

                <div className="form-row">
                  <label>
                    Preço atual
                    <input inputMode="decimal" value={productForm.price} onChange={event => updateCurrentPrice(event.target.value)} placeholder="99,90" required />
                  </label>

                  <label>
                    Loja
                    <input value={productForm.store_name} onChange={event => setProductForm({ ...productForm, store_name: event.target.value })} placeholder="Amazon, Shopee, Mercado Livre..." required />
                  </label>
                </div>

                <label className="admin-toggle-line">
                  <input
                    type="checkbox"
                    checked={productForm.has_discount}
                    onChange={event => setProductForm(current => ({
                      ...current,
                      has_discount: event.target.checked,
                      original_price: event.target.checked ? current.original_price : '',
                      discount_percent: event.target.checked ? current.discount_percent : '0',
                    }))}
                  />
                  <span><b>Este produto está com desconto</b><small>Mostra a porcentagem de economia para o cliente.</small></span>
                </label>

                {productForm.has_discount && (
                  <div className="form-row">
                    <label>
                      Preço anterior <small>opcional</small>
                      <input inputMode="decimal" value={productForm.original_price} onChange={event => updateOriginalPrice(event.target.value)} placeholder="129,90" />
                    </label>
                    <label>
                      Desconto (%)
                      <input type="number" min="1" max="99" value={productForm.discount_percent} onChange={event => setProductForm({ ...productForm, discount_percent: event.target.value })} placeholder="20" required />
                    </label>
                  </div>
                )}

                <label>
                  Link para comprar / link de afiliado
                  <input
                    type="url"
                    value={productForm.affiliate_url}
                    onChange={event => setProductForm({ ...productForm, affiliate_url: event.target.value })}
                    placeholder="https://..."
                    required
                  />
                  <small>Quando o cliente clicar em “Ver na loja”, ele será enviado diretamente para este endereço.</small>
                </label>

                <label>
                  Selo <small>opcional</small>
                  <input value={productForm.badge} onChange={event => setProductForm({ ...productForm, badge: event.target.value })} placeholder="Ex.: Mais vendido, Achadinho, Oferta do dia" />
                </label>
              </section>

              <section className="admin-form-section">
                <div className="admin-section-heading"><span>4</span><div><b>Publicação</b><small>Controle onde o produto aparece.</small></div></div>

                <div className="admin-publish-options">
                  <label>
                    <input type="checkbox" checked={productForm.featured} onChange={event => setProductForm({ ...productForm, featured: event.target.checked })} />
                    <span><b>Destaque na Home</b><small>Coloca o produto entre os principais achadinhos.</small></span>
                  </label>
                  <label>
                    <input type="checkbox" checked={productForm.active} onChange={event => setProductForm({ ...productForm, active: event.target.checked })} />
                    <span><b>Publicado no site</b><small>Desmarque para salvar sem exibir aos clientes.</small></span>
                  </label>
                </div>
              </section>

              <div className="admin-save-bar">
                <button className="btn primary" type="submit" disabled={uploading}>
                  {productForm.id ? 'Salvar alterações' : 'Adicionar produto'}
                </button>
                {productForm.id && <button className="btn ghost" type="button" onClick={() => setProductForm({ ...emptyProduct })}>Cancelar edição</button>}
              </div>
            </form>

            <aside className="admin-product-side">
              <div className="admin-card admin-preview-card">
                <span className="admin-step">PRÉVIA</span>
                <h3>Como o cliente vai ver</h3>
                <div className="admin-preview-image">
                  {productForm.images[0]
                    ? <img src={productForm.images[0]} alt="" />
                    : <div>Carregue uma foto</div>}
                  {previewDiscount > 0 && <span>-{previewDiscount}%</span>}
                </div>
                <small>{productForm.store_name || 'Loja parceira'}</small>
                <b>{productForm.title || 'Nome do produto'}</b>
                {previewOriginal && <del>{money(previewOriginal)}</del>}
                <strong>{money(previewPrice)}</strong>
                <button type="button" disabled>Ver na loja →</button>
              </div>

              <div className="admin-card admin-list">
                <div className="admin-list-title">
                  <h2>Produtos</h2>
                  <span>{products.length}</span>
                </div>
                {products.length === 0 && <p className="admin-empty">Nenhum produto real cadastrado ainda.</p>}
                {products.map(product => (
                  <div className="admin-list-row" key={product.id}>
                    <div className="admin-list-item">
                      {product.images?.[0] && <img src={product.images[0]} alt="" />}
                      <div>
                        <b>{product.title}</b>
                        <small>{categoryName.get(product.category_id ?? '') ?? 'Sem categoria'} · {money(product.price)}</small>
                        <div className="admin-status-row">
                          <span className={product.active ? 'status-live' : 'status-draft'}>{product.active ? 'Publicado' : 'Rascunho'}</span>
                          {product.featured && <span className="status-featured">Destaque</span>}
                          {product.discount_percent > 0 && <span className="status-sale">-{product.discount_percent}%</span>}
                        </div>
                      </div>
                    </div>
                    <div className="row-actions">
                      <button onClick={() => editProduct(product)}>Editar</button>
                      <button className="danger" onClick={() => removeRow('products', product.id)}>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}

        {tab === 'categories' && (
          <div className="admin-grid">
            <form className="admin-card admin-form" onSubmit={saveCategory}>
              <h2>{categoryForm.id ? 'Editar categoria' : 'Nova categoria'}</h2>
              <label>Nome<input value={categoryForm.name} onChange={event => setCategoryForm(current => ({ ...current, name: event.target.value, slug: current.id ? current.slug : slugify(event.target.value) }))} required /></label>
              <label>Descrição<textarea value={categoryForm.description} onChange={event => setCategoryForm({ ...categoryForm, description: event.target.value })} /></label>

              <div className="admin-upload-box">
                <div>
                  <b>Imagem da categoria</b>
                  <small>Essa imagem aparece nos cards da Home.</small>
                </div>
                <label className="btn ghost admin-file-btn">
                  {uploading ? 'Enviando...' : 'Carregar imagem'}
                  <input type="file" accept="image/*" onChange={uploadCategoryImage} disabled={uploading} />
                </label>
              </div>

              {categoryForm.image_url && (
                <div className="admin-single-preview">
                  <img src={categoryForm.image_url} alt="Categoria" />
                  <button type="button" onClick={() => setCategoryForm({ ...categoryForm, image_url: '' })}>Remover</button>
                </div>
              )}

              <label>Ordem<input type="number" value={categoryForm.sort_order} onChange={event => setCategoryForm({ ...categoryForm, sort_order: event.target.value })} /></label>
              <label className="inline-check"><input type="checkbox" checked={categoryForm.active} onChange={event => setCategoryForm({ ...categoryForm, active: event.target.checked })} /> Categoria ativa</label>

              <div className="form-actions">
                <button className="btn primary" type="submit" disabled={uploading}>{categoryForm.id ? 'Salvar alterações' : 'Criar categoria'}</button>
                {categoryForm.id && <button className="btn ghost" type="button" onClick={() => setCategoryForm({ ...emptyCategory })}>Cancelar</button>}
              </div>
            </form>

            <div className="admin-card admin-list">
              <h2>Categorias</h2>
              {categories.map(category => (
                <div className="admin-list-row" key={category.id}>
                  <div className="admin-list-item">
                    {category.image_url && <img src={category.image_url} alt="" />}
                    <div>
                      <b>{category.name}</b>
                      <small>ordem {category.sort_order} · {category.active ? 'ativa' : 'oculta'}</small>
                    </div>
                  </div>
                  <div className="row-actions">
                    <button onClick={() => {
                      setCategoryForm({
                        id: category.id,
                        name: category.name,
                        slug: category.slug,
                        description: category.description ?? '',
                        image_url: category.image_url ?? '',
                        sort_order: String(category.sort_order),
                        active: category.active,
                      })
                    }}>Editar</button>
                    <button className="danger" onClick={() => removeRow('categories', category.id)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'articles' && (
          <div className="admin-grid">
            <form className="admin-card admin-form" onSubmit={saveArticle}>
              <h2>{articleForm.id ? 'Editar artigo' : 'Novo artigo'}</h2>
              <label>Título<input value={articleForm.title} onChange={event => setArticleForm(current => ({ ...current, title: event.target.value, slug: current.id ? current.slug : slugify(event.target.value) }))} required /></label>
              <label>Resumo<textarea value={articleForm.summary} onChange={event => setArticleForm({ ...articleForm, summary: event.target.value })} /></label>
              <label>Conteúdo<textarea className="large-textarea" value={articleForm.content} onChange={event => setArticleForm({ ...articleForm, content: event.target.value })} /></label>

              <div className="admin-upload-box">
                <div>
                  <b>Capa do artigo</b>
                  <small>Imagem principal do conteúdo.</small>
                </div>
                <label className="btn ghost admin-file-btn">
                  {uploading ? 'Enviando...' : 'Carregar capa'}
                  <input type="file" accept="image/*" onChange={uploadArticleImage} disabled={uploading} />
                </label>
              </div>

              {articleForm.cover_image_url && (
                <div className="admin-single-preview">
                  <img src={articleForm.cover_image_url} alt="Capa" />
                  <button type="button" onClick={() => setArticleForm({ ...articleForm, cover_image_url: '' })}>Remover</button>
                </div>
              )}

              <label className="inline-check"><input type="checkbox" checked={articleForm.published} onChange={event => setArticleForm({ ...articleForm, published: event.target.checked })} /> Publicado</label>

              <div className="form-actions">
                <button className="btn primary" type="submit" disabled={uploading}>{articleForm.id ? 'Salvar alterações' : 'Criar artigo'}</button>
                {articleForm.id && <button className="btn ghost" type="button" onClick={() => setArticleForm({ ...emptyArticle })}>Cancelar</button>}
              </div>
            </form>

            <div className="admin-card admin-list">
              <h2>Artigos</h2>
              {articles.map(article => (
                <div className="admin-list-row" key={article.id}>
                  <div className="admin-list-item">
                    {article.cover_image_url && <img src={article.cover_image_url} alt="" />}
                    <div>
                      <b>{article.title}</b>
                      <small>{article.published ? 'Publicado' : 'Rascunho'}</small>
                    </div>
                  </div>
                  <div className="row-actions">
                    <button onClick={() => {
                      setArticleForm({
                        id: article.id,
                        title: article.title,
                        slug: article.slug,
                        summary: article.summary ?? '',
                        content: article.content ?? '',
                        cover_image_url: article.cover_image_url ?? '',
                        published: article.published,
                      })
                    }}>Editar</button>
                    <button className="danger" onClick={() => removeRow('articles', article.id)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
