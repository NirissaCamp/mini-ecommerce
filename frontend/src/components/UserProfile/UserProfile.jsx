import { useState, useEffect } from 'react'
import { getMe } from '../../api/auth'
import './UserProfile.css'

function mapAuthoritiesToRoleLabel(authorities){
    if(!authorities) return "-"
    const s = String(authorities)
    if(s.includes("ADMIN")) return "ADMIN"
    if(s.includes("USER")) return "USER"
    return s
}

export default function UserProfile({ onMessage }) {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [noToken, setNoToken] = useState(false)

    async function loadProfile() {
        const token = localStorage.getItem('token')
        if (!token) {
            setNoToken(true)
            setProfile(null)
            onMessage?.('Please Log In First!')
            return
        }
        setNoToken(false)
        setLoading(true)
        try {
            const data = await getMe(token)
            setProfile(data)
            // onMessage?.(JSON.stringify(data, null, 2))
        } catch (err) {
            setProfile(null)
            setNoToken(true)
            localStorage.removeItem('token')
            onMessage?.(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProfile()
    }, [])

    return (
        <main className="profile-page">
            <div className="profile-page__inner">
                {noToken && (
                    <section className="profile-empty" aria-live="polite">
                        <h1 className="profile-page__title">用户资料</h1>
                        <p className="profile-empty__text">请先登录后查看账户信息。</p>
                    </section>
                )}
                {!noToken && (
                    <>
                        {/*问候 + 核心信息 + 刷新*/}
                        <section className="profile-card profile-card--hero">
                            <div className="profile-hero__header">
                                <div className="profile-hero__avatar" aria-hidden>
                                    {profile?.username?.charAt(0)?.toUpperCase() ?? '?'}
                                </div>
                                <div>
                                    <p className="profile-hero__greeting">你好，{profile?.username ?? '…'}</p>
                                    <p className="profile-hero__sub">管理你的账户信息</p>
                                </div>
                            </div>

                            <dl className="profile-hero__meta">
                                <div className="profile-hero__row">
                                    <dt>用户名</dt>
                                    <dd>{profile?.username ?? '—'}</dd>
                                </div>
                                <div className="profile-hero__row">
                                    <dt>角色</dt>
                                    <dd>{mapAuthoritiesToRoleLabel(profile?.authorities)}</dd>
                                </div>
                            </dl>

                            <div className="profile-hero__actions">
                                <button
                                    type="button"
                                    className="profile-btn profile-btn--primary"
                                    onClick={loadProfile}
                                    disabled={loading}
                                >
                                    {loading ? '加载中…' : '刷新资料'}
                                </button>
                            </div>
                        </section>

                        {/*购物入口*/}
                        <section className="profile-card" aria-labelledby="profile-shop-heading">
                            <h2 id="profile-shop-heading" className="profile-card__title">
                                购物
                            </h2>
                            <ul className="profile-links">
                                <li>
                                    <a className="profile-links__item" href="#" onClick={(e) => e.preventDefault()}>
                                        <span className="profile-links__label">我的订单</span>
                                        <span className="profile-links__hint">即将推出</span>
                                    </a>
                                </li>
                                <li>
                                    <a className="profile-links__item" href="#" onClick={(e) => e.preventDefault()}>
                                        <span className="profile-links__label">收货地址</span>
                                        <span className="profile-links__hint">即将推出</span>
                                    </a>
                                </li>
                            </ul>
                        </section>

                        {/*账户与安全 + 可折叠「高级」*/}
                        <section className="profile-card" aria-labelledby="profile-security-heading">
                            <h2 id="profile-security-heading" className="profile-card__title">
                                账户与安全
                            </h2>
                            <ul className="profile-links">
                                <li>
              <span className="profile-links__item profile-links__item--disabled">
                <span className="profile-links__label">修改密码</span>
                <span className="profile-links__hint">即将推出</span>
              </span>
                                </li>
                                <li>
              <span className="profile-links__item profile-links__item--disabled">
                <span className="profile-links__label">邮件与通知</span>
                <span className="profile-links__hint">即将推出</span>
              </span>
                                </li>
                            </ul>

                            <details className="profile-advanced">
                                <summary className="profile-advanced__summary">高级</summary>
                                <div className="profile-advanced__body">
                                    <p className="profile-advanced__note">
                                        以后可放：登录设备、两步验证等。当前为占位。
                                    </p>
                                </div>
                            </details>
                        </section>

                        {/*加「页脚」小链接*/}
                        <footer className="profile-footer">
                            <a href="#" onClick={(e) => e.preventDefault()}>帮助中心</a>
                            <span className="profile-footer__sep"> · </span>
                            <a href="#" onClick={(e) => e.preventDefault()}>隐私声明</a>
                            <span className="profile-footer__sep"> · </span>
                            <a href="#" onClick={(e) => e.preventDefault()}>使用条款</a>
                        </footer>

                    </>
                )}


            </div>
        </main>
    )
}