import { useState } from 'react'

function Register({ onRegister, onLoginClick }) {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')

    async function handleRegister(event) {
        event.preventDefault()

        setMessage('')

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setMessage(data.message)
                return
            }

            setMessage('Registration successful!')

            if (onRegister) {
                onRegister()
            }
        } catch (error) {
            console.error('Registration failed:', error)
            setMessage('Unable to connect to server')
        }
    }

    return (
        <div>
            <h2>Register</h2>

            <form onSubmit={handleRegister}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(event) =>
                        setUsername(event.target.value)
                    }
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) =>
                        setEmail(event.target.value)
                    }
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                />

                <button type="submit">
                    Register
                </button>
            </form>

            <p>{message}</p>

            <button onClick={onLoginClick}>
                Back to Login
            </button>
        </div>
    )
}

export default Register