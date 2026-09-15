import { FormEvent, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/auth')({ component: Auth })

function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && typeof window !== 'undefined') window.location.href = '/admin'
    })
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      setMessage('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError || !role) {
      await supabase.auth.signOut()
      setMessage('Esta conta não possui acesso administrativo.')
      setLoading(false)
      return
    }

    if (typeof window !== 'undefined') window.location.href = '/admin'
  }

  return (
    <main className="auth">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow coral">ACESSO RESTRITO</span>
        <h1>Entrar no Admin</h1>
        <p>Área exclusiva para administradores da HIPERGIGA.</p>

        <label>
          E-mail
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
          />
        </label>

        {message && <p className="form-message error">{message}</p>}

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
