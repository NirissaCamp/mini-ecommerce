import { useState } from 'react'
import { login } from '../../api/auth.js'
import './LoginForm.css'

export default function LoginForm({ onMessage, onLoggedIn }) {
    const [username,setUsername] = useState('')
    const [password, setPassword] = useState('')

    async function handleLogin(e) {
        e.preventDefault()
        try {
            const data = await login({ username, password })
            // onMessage(JSON.stringify(data, null, 2))
            onMessage('')
            if (data?.token) {
                localStorage.setItem('token', data.token)
            }
            if (onLoggedIn) {
                onLoggedIn(data?.username ?? username)
            }
        } catch (err) {
            onMessage(err.message)
        }
    }

    return (
        <section>
            <h2>登录</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <input
                        type="text"
                        placeholder="username"
                        value={username}
                        onChange={(e) => {
                            onMessage?.('')
                            setUsername(e.target.value)
                        }}
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="password"
                        value={password}
                        onChange={(e) => {
                            onMessage?.('')
                            setPassword(e.target.value)
                        }}
                    />
                </div>
                <button type="submit">登录</button>
            </form>
        </section>
    )
}