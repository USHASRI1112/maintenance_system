import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login, register } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const redirectMap = {
  tenant: '/tenant',
  manager: '/manager',
  technician: '/technician',
}

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const completeLogin = async (userEmail, userPassword, welcomeMessage) => {
    const data = await login(userEmail, userPassword)
    loginUser(data.access_token, data.user)
    navigate(redirectMap[data.user.role] || '/')
    toast.success(welcomeMessage || `Welcome, ${data.user.full_name}`)
  }

  const handleSignIn = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)
    try {
      await completeLogin(email, password, `Welcome back, ${email}`)
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role: 'tenant',
      })
      await completeLogin(email, password, `Welcome, ${fullName}`)
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || 'Unable to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell auth-page">
      <div className="auth-shell auth-shell-centered">
        <section className="auth-card card auth-card-centered">
          <div className="auth-header">
            <h1 className="card-title">MaintainFlow</h1>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`button ${mode === 'signin' ? 'button-primary' : 'button-ghost'}`}
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`button ${mode === 'signup' ? 'button-primary' : 'button-ghost'}`}
              onClick={() => setMode('signup')}
            >
              Tenant sign up
            </button>
          </div>

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <div className="button-row">
              <button className="button button-primary auth-submit" type="submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp}>
              <div className="field">
                <label htmlFor="full-name">Full name</label>
                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="confirm-password">Confirm password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>

              <div className="button-row">
                <button className="button button-primary auth-submit" type="submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign up'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {errorMessage ? (
        <div className="modal-overlay" onClick={() => setErrorMessage('')}>
          <div className="alert-modal card" onClick={(event) => event.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Error</h2>
            <p className="muted">{errorMessage}</p>
            <div className="button-row">
              <button className="button button-primary" type="button" onClick={() => setErrorMessage('')}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
