import { useState } from 'react'

function Login({ onLogin, onRegisterClick }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleLogin(event) {
    event.preventDefault()

    setMessage('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message)
        return
      }

      localStorage.setItem('token', data.token)

      onLogin()
    } catch (error) {
      console.error('Login failed:', error)
      setMessage('Unable to connect to server')
    }
  }

  return (
    <div>
      <h2>Login</h2>

        <form onSubmit={handleLogin}>
            <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            />

            <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            />

            <button type="submit">Login</button>
        </form>

        <p>{message}</p>

        <button onClick={onRegisterClick}>
            Create an account
        </button>
    </div>
  )
}

export default Login