import { createFileRoute } from '@tanstack/react-router'
export const Route=createFileRoute('/auth')({component:Auth})
function Auth(){return <main className="auth"><form className="auth-card" onSubmit={e=>e.preventDefault()}><span className="eyebrow coral">ACESSO RESTRITO</span><h1>Entrar no Admin</h1><p>Autenticação será conectada ao Supabase na próxima etapa.</p><label>E-mail<input type="email" required/></label><label>Senha<input type="password" required/></label><button className="btn primary">Entrar</button></form></main>}
