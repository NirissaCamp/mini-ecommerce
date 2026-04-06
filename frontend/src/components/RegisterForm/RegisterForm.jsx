import { useState } from 'react'
import { register } from '../../api/auth.js'

export default function RegisterForm({ onMessage, onLoggedIn, onClose }) {
    const [username,setUsername] = useState('')
    const [password, setPassword] = useState('')

    async function handleRegister(e){
        e.preventDefault()
        try {
            const data = await register({ username, password })
            onMessage(JSON.stringify(data, null, 2))
            if (data?.token) {
                localStorage.setItem('token', data.token)
            }
            if (onLoggedIn) {
                onLoggedIn(data?.username ?? username)
            }
            onClose?.()
        }catch (err) {
            onMessage(err.message)
        }
    }

    return (
        <section>
            <h2>注册</h2>
            <form onSubmit={handleRegister}>
                <div>
                    <input
                        type="text"
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button type="submit">注册</button>
            </form>
        </section>
    )
}