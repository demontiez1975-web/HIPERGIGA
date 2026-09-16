import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/artigo/$slug')({
  loader: async ({ params }) => {
    const { data: article, error } = await supabase
      .from('articles')
      .select('id,title,slug,summary,content,cover_image_url,published_at')
      .eq('slug', params.slug)
      .eq('published', true)
      .maybeSingle()

    if (error) throw error
    return { article }
  },
  component: ArticlePage,
})

function ArticlePage() {
  const { article } = Route.useLoaderData()

  if (!article) {
    return <main className="page"><div className="wrap"><h1>Artigo não encontrado</h1></div></main>
  }

  return (
    <main className="article-page">
      <div className="wrap article-layout">
        <header className="article-hero">
          <span className="eyebrow coral">DICAS HIPERGIGA</span>
          <h1>{article.title}</h1>
          {article.summary && <p>{article.summary}</p>}
        </header>
        <article className="article-content">
          {article.cover_image_url
            ? <img className="article-main-photo" src={article.cover_image_url} alt={article.title} />
            : <div className="article-main-cover">H</div>}
          <div className="article-body">
            {(article.content ?? '').split('\n').filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        </article>
      </div>
    </main>
  )
}
