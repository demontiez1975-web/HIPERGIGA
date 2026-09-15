import { createFileRoute } from '@tanstack/react-router'
export const Route=createFileRoute('/admin/')({component:Admin})
function Admin(){return <main className="page"><div className="wrap"><span className="eyebrow coral">PAINEL ADMINISTRATIVO</span><h1>HIPERGIGA Admin</h1><p>Estrutura inicial. As métricas serão alimentadas pelo Supabase.</p><div className="metrics"><div><span>Produtos</span><strong>8</strong></div><div><span>Cliques hoje</span><strong>0</strong></div><div><span>7 dias</span><strong>0</strong></div><div><span>Assinantes</span><strong>0</strong></div></div></div></main>}
