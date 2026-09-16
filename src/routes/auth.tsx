import { FormEvent, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/auth')({ component: Auth })

const ADMIN_EMAIL = 'demontiez1975@gmail.com'

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

  async function finishAdminLogin(userId: string) {
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError || !role) {
      await supabase.auth.signOut()
      setMessage('Esta conta não possui acesso administrativo.')
      return false
    }

    if (typeof window !== 'undefined') window.location.href = '/admin'
    return true
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    const normalizedEmail = email.trim().toLowerCase()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (!error && data.user) {
      await finishAdminLogin(data.user.id)
      setLoading(false)
      return
    }

    if (normalizedEmail !== ADMIN_EMAIL) {
      setMessage('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    })

    if (signupError || !signupData.user) {
      setMessage(signupError?.message || 'Não foi possível criar o primeiro acesso.')
      setLoading(false)
      return
    }

    if (!signupData.session) {
      setMessage('Primeiro acesso criado. Verifique seu e-mail para confirmar a conta e depois entre novamente.')
      setLoading(false)
      return
    }

    await finishAdminLogin(signupData.user.id)
    setLoading(false)
  }

  return (
    <main className="auth">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow coral">ACESSO RESTRITO</span>
        <h1>Entrar no Admin</h1>
        <p>Área exclusiva para administração da HIPERGIGA.</p>

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
