import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getMe } from '../../api/auth.js'

/**
 * 仅允许已登录且 authorities 含 ROLE_ADMIN 的用户访问子路由。
 * Only renders children when JWT is valid and user has ROLE_ADMIN.
 */
export default function RequireAdmin({ children }) {
    const [status, setStatus] = useState('loading')

    useEffect(() => {
        const token = localStorage.getItem('token')

        if (!token) {
            setStatus('denied')
            return
        }

        getMe(token)
            .then((data) => {
                const auth = String(data?.authorities ?? '')
                if (auth.includes('ROLE_ADMIN')) {
                    setStatus('ok')
                } else {
                    setStatus('denied')
                }
            })
            .catch(() => {
                setStatus('denied')
            })
    }, [])

    if (status === 'loading') {
        return <p style={{ padding: '1rem' }}>Loading…</p>
    }

    if (status === 'denied') {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}