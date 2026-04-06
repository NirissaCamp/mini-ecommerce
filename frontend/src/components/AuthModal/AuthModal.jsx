import { useState } from 'react'
import LoginForm from '../LoginForm/LoginForm.jsx'
import RegisterForm from '../RegisterForm/RegisterForm.jsx'
import './AuthModal.css'

export default function AuthModal({ open, onClose, onMessage, onLoggedIn }) {
    const [tab, setTab] = useState('login')

    if (!open) return null

    return (
        <div
            className="auth-modal__backdrop"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="auth-modal__panel"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="auth-modal__close"
                    onClick={onClose}
                    aria-label="关闭"
                >
                    ×
                </button>

                <h2 className="auth-modal__title">登录 / 注册</h2>
                <p className="auth-modal__hint">所有数据均受到保护（示例文案）</p>

                <div className="auth-modal__tabs">
                    <button
                        type="button"
                        className={tab === 'login' ? 'is-active' : ''}
                        onClick={() => setTab('login')}
                    >
                        登录
                    </button>
                    <button
                        type="button"
                        className={tab === 'register' ? 'is-active' : ''}
                        onClick={() => setTab('register')}
                    >
                        注册
                    </button>
                </div>

                <div className="auth-modal__body">
                    {tab === 'login' && (
                        <LoginForm onMessage={onMessage} onLoggedIn={onLoggedIn} />
                    )}
                    {tab === 'register' && (
                        <RegisterForm onMessage={onMessage} onLoggedIn={onLoggedIn} onClose={onClose} />
                    )}
                </div>
            </div>
        </div>
    )
}