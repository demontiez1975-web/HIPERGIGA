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

function safeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
        .select('id,category_id,title,slug,description,benefits,images,price,store_name,affiliate_url,featured,badge,active')
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

  async function signOut() {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') window.location.href = '/auth'
  }

  async function uploadImage(file: File, folder: string) {
    if (!file.type.startsWith('image/')) throw new Error('Selecione apenas arquivos de imagem.')
    if (file.size > 5 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 5 MB.')

    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
    const base = safeName(file.name.replace(/\.[^.]+$/, '')) || 'imagem'
    const path = `${folder}/${Date.now()}-${base}.${ext}`

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
      const urls = []

      for (const file of selected) {
        urls.push(await uploadImage(file, 'products'))
      }

      setProductForm(current => ({
        ...current,
        images: [...current.images, ...urls],
      }))
      setMessage(`${urls.length} imagem(ns) enviada(s).`)
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

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const benefits = productForm.benefits
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)

    const payload = {
      category_id: productForm.category_id || null,
      title: productForm.title.trim(),
      slug: productForm.slug.trim(),
      description: productForm.description.trim() || null,
      benefits,
      images: productForm.images,
      price: productForm.price ? Number(productForm.price.replace(',', '.')) : null,
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
      setMessage(error.message)
      return
    }

    setProductForm({ ...emptyProduct })
    setMessage(productForm.id ? 'Produto atualizado.' : 'Produto criado.')
    await loadData()
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const payload = {
      name: categoryForm.name.trim(),
      slug: categoryForm.slug.trim(),
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

    const payload = {
      title: articleForm.title.trim(),
      slug: articleForm.slug.trim(),
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
      store_name: product.store_name,
      affiliate_url: product.affiliate_url,
      featured: product.featured,
      badge: product.badge ?? '',
      active: product.active,
    })
    setTab('products')
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
          </div>
          <a className="btn primary" href="/" target="_blank" rel="noreferrer">Ver site</a>
        </div>

        {message && <p className="form-message">{message}</p>}

        {tab === 'dashboard' && (
          <>
            <div className="metrics">
              <div><span>Produtos</span><strong>{products.length}</strong></div>
              <div><span>Cliques hoje</span><strong>{clicksToday}</strong></div>
              <div><span>Cliques em 7 dias</span><strong>{clicks7Days}</strong></div>
              <div><span>Assinantes</span><strong>{subscribers}</strong></div>
            </div>

            <div className="admin-card">
              <h2>Resumo do catálogo</h2>
              <p>{categories.length} categorias · {articles.length} artigos · {products.filter(product => product.active).length} produtos ativos.</p>
            </div>
          </>
        )}

        {tab === 'products' && (
          <div className="admin-grid">
            <form className="admin-card admin-form" onSubmit={saveProduct}>
              <h2>{productForm.id ? 'Editar produto' : 'Novo produto'}</h2>

              <label>
                Categoria
                <select value={productForm.category_id} onChange={event => setProductForm({ ...productForm, category_id: event.target.value })}>
                  <option value="">Sem categoria</option>
                  {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>

              <label>Título<input value={productForm.title} onChange={event => setProductForm({ ...productForm, title: event.target.value })} required /></label>
              <label>Slug<input value={productForm.slug} onChange={event => setProductForm({ ...productForm, slug: event.target.value })} required /></label>
              <label>Descrição<textarea value={productForm.description} onChange={event => setProductForm({ ...productForm, description: event.target.value })} /></label>
              <label>Benefícios <small>um por linha</small><textarea value={productForm.benefits} onChange={event => setProductForm({ ...productForm, benefits: event.target.value })} /></label>

              <div className="admin-upload-box">
                <div>
                  <b>Fotos do produto</b>
                  <small>Até 6 imagens. JPG, PNG, WEBP ou GIF, até 5 MB cada.</small>
                </div>
                <label className="btn ghost admin-file-btn">
                  {uploading ? 'Enviando...' : 'Carregar imagens'}
                  <input type="file" accept="image/*" multiple onChange={uploadProductImages} disabled={uploading || productForm.images.length >= 6} />
                </label>
              </div>

              {productForm.images.length > 0 && (
                <div className="admin-image-grid">
                  {productForm.images.map((url, index) => (
                    <div className="admin-image-thumb" key={url + index}>
                      <img src={url} alt={'Produto ' + (index + 1)} />
                      {index === 0 && <span>Principal</span>}
                      <button type="button" onClick={() => setProductForm(current => ({ ...current, images: current.images.filter((_, i) => i !== index) }))}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-row">
                <label>Preço<input inputMode="decimal" value={productForm.price} onChange={event => setProductForm({ ...productForm, price: event.target.value })} /></label>
                <label>Selo<input value={productForm.badge} onChange={event => setProductForm({ ...productForm, badge: event.target.value })} placeholder="Mais vendido" /></label>
              </div>

              <label>Loja parceira<input value={productForm.store_name} onChange={event => setProductForm({ ...productForm, store_name: event.target.value })} placeholder="Amazon, Mercado Livre, Shopee..." required /></label>
              <label>Link da oferta / afiliado<input type="url" value={productForm.affiliate_url} onChange={event => setProductForm({ ...productForm, affiliate_url: event.target.value })} placeholder="https://..." required /></label>

              <div className="check-row">
                <label><input type="checkbox" checked={productForm.featured} onChange={event => setProductForm({ ...productForm, featured: event.target.checked })} /> Destaque</label>
                <label><input type="checkbox" checked={productForm.active} onChange={event => setProductForm({ ...productForm, active: event.target.checked })} /> Ativo</label>
              </div>

              <div className="form-actions">
                <button className="btn primary" type="submit" disabled={uploading}>{productForm.id ? 'Salvar alterações' : 'Criar produto'}</button>
                {productForm.id && <button className="btn ghost" type="button" onClick={() => setProductForm({ ...emptyProduct })}>Cancelar</button>}
              </div>
            </form>

            <div className="admin-card admin-list">
              <h2>Produtos cadastrados</h2>
              {products.map(product => (
                <div className="admin-list-row" key={product.id}>
                  <div className="admin-list-item">
                    {product.images?.[0] && <img src={product.images[0]} alt="" />}
                    <div>
                      <b>{product.title}</b>
                      <small>{categoryName.get(product.category_id ?? '') ?? 'Sem categoria'} · {product.store_name}</small>
                    </div>
                  </div>
                  <div className="row-actions">
                    <button onClick={() => editProduct(product)}>Editar</button>
                    <button className="danger" onClick={() => removeRow('products', product.id)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'categories' && (
          <div className="admin-grid">
            <form className="admin-card admin-form" onSubmit={saveCategory}>
              <h2>{categoryForm.id ? 'Editar categoria' : 'Nova categoria'}</h2>
              <label>Nome<input value={categoryForm.name} onChange={event => setCategoryForm({ ...categoryForm, name: event.target.value })} required /></label>
              <label>Slug<input value={categoryForm.slug} onChange={event => setCategoryForm({ ...categoryForm, slug: event.target.value })} required /></label>
              <label>Descrição<textarea value={categoryForm.description} onChange={event => setCategoryForm({ ...categoryForm, description: event.target.value })} /></label>

              <div className="admin-upload-box">
                <div>
                  <b>Imagem da categoria</b>
                  <small>Imagem exibida nos cards da Home.</small>
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
              <label className="inline-check"><input type="checkbox" checked={categoryForm.active} onChange={event => setCategoryForm({ ...categoryForm, active: event.target.checked })} /> Ativa</label>

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
                      <small>/{category.slug} · ordem {category.sort_order}</small>
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
                      setTab('categories')
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
              <label>Título<input value={articleForm.title} onChange={event => setArticleForm({ ...articleForm, title: event.target.value })} required /></label>
              <label>Slug<input value={articleForm.slug} onChange={event => setArticleForm({ ...articleForm, slug: event.target.value })} required /></label>
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
                      setTab('articles')
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
