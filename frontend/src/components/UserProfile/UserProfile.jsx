import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMe } from '../../api/auth'
import { listAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../api/addresses'
import {getProfile, updateProfile, changePassword} from "../../api/userProfile.js";
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
                        <h1 className="profile-page__title">Profile</h1>
                        <p className="profile-empty__text">Please sign in to view your account information.</p>
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
                                    <p className="profile-hero__greeting">hello, {profile?.username ?? '…'}</p>
                                    <p className="profile-hero__sub">Manage your account information</p>
                                </div>
                            </div>

                            <dl className="profile-hero__meta">
                                <div className="profile-hero__row">
                                    <dt>Username</dt>
                                    <dd>{profile?.username ?? '—'}</dd>
                                </div>
                                <div className="profile-hero__row">
                                    <dt>Role</dt>
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
                                    {loading ? 'loading…' : 'Refresh profile'}
                                </button>
                            </div>
                        </section>

                        {/*购物入口*/}
                        <section className="profile-card" aria-labelledby="profile-shop-heading">
                            <h2 id="profile-shop-heading" className="profile-card__title">
                                Shopping
                            </h2>
                            <ul className="profile-links">
                                <li>
                                    <Link className="profile-links__item" to="/orders">
                                        <span className="profile-links__label">My orders</span>
                                    </Link>
                                </li>
                                <li>
                                    <AddressSection/>
                                </li>
                            </ul>
                        </section>

                        {/*账户与安全 + 可折叠「高级」*/}
                        <section className="profile-card" aria-labelledby="profile-security-heading">
                            <h2 id="profile-security-heading" className="profile-card__title">
                                Account & Security
                            </h2>
                            <ul className="profile-links">
                                <li>
                                    <PasswordSection/>
                                </li>
                                <li>
                                    <EmailSection/>
                                </li>
                            </ul>

                            <details className="profile-advanced">
                                <summary className="profile-advanced__summary">Advanced</summary>
                                <div className="profile-advanced__body">
                                    <p className="profile-advanced__note">
                                        you can add login devices,two-step verification
                                    </p>
                                </div>
                            </details>
                        </section>

                        {/*加「页脚」小链接*/}
                        <footer className="profile-footer">
                            <a href="#" onClick={(e) => e.preventDefault()}>Help center</a>
                            <span className="profile-footer__sep"> · </span>
                            <a href="#" onClick={(e) => e.preventDefault()}>Privacy policy</a>
                            <span className="profile-footer__sep"> · </span>
                            <a href="#" onClick={(e) => e.preventDefault()}>Terms of service</a>
                        </footer>

                    </>
                )}


            </div>
        </main>
    )
}

function AddressSection() {
    const token = localStorage.getItem('token');
    const [open, setOpen]         = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading]   = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing]   = useState(null);
    const [error, setError]       = useState('');
    const [saving, setSaving]     = useState(false);

    const EMPTY = { receiverName: '', receiverPhone: '', state: '', city: '', district: '', detailAddress: '', isDefault: false };
    const [form, setForm] = useState(EMPTY);

    async function load() {
        setLoading(true);
        try { setAddresses(await listAddresses(token)); }
        catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }

    function toggle() {
        if (!open) load();
        setOpen(o => !o);
        setShowForm(false);
    }

    function openAdd() { setEditing(null); setForm(EMPTY); setError(''); setShowForm(true); }
    function openEdit(a) {
        setEditing(a);
        setForm({ receiverName: a.receiverName || '', receiverPhone: a.receiverPhone || '',
            state: a.state || '', city: a.city || '', district: a.district || '',
            detailAddress: a.detailAddress || '', isDefault: a.isDefault || false });
        setError(''); setShowForm(true);
    }

    async function save() {
        setSaving(true); setError('');
        if(!form.receiverName.trim()) {
            setError('Receiver name is required');
            setSaving(false); return;
        }
        if(!form.receiverPhone.trim()){
            setError("Receiver phone is required");
            setSaving(false);
            return;
        }
        if (!/^[0-9+\-()\s]*$/.test(form.receiverPhone)){
            setError('Phone number contains invalid characters');
            setSaving(false);
            return;
        }
        if (!form.state.trim())          { setError('State is required');            setSaving(false); return; }
        if (!form.city.trim())           { setError('City is required');             setSaving(false); return; }
        if (!form.detailAddress.trim())  { setError('Detail address is required');   setSaving(false); return; }

        try {
            if (editing) {
                const updated = await updateAddress(token, editing.id, form);
                setAddresses(prev => prev.map(a => a.id === updated.id ? updated : a));
            } else {
                const created = await addAddress(token, form);
                setAddresses(prev => [...prev, created]);
            }
            setShowForm(false);
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    }

    async function remove(id) {
        if (!window.confirm('Delete this address?')) return;
        try {
            await deleteAddress(token, id);
            setAddresses(prev => prev.filter(a => a.id !== id));
        } catch (e) { setError(e.message); }
    }

    async function setDefault(id) {
        try {
            const updated = await setDefaultAddress(token, id);
            setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === updated.id })));
        } catch (e) { setError(e.message); }
    }

    const field = (label, key, type = 'text') => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: 12, color: '#888' }}>{label}</label>
            <input type={type} value={form[key]}
                   onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                   style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14 }} />
        </div>
    );

    return (
        <div>
            <button className="profile-links__item" onClick={toggle}
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                <span className="profile-links__label">Shipping addresses</span>
                <span className="profile-links__hint">{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {error && <p style={{ color: '#c62828', fontSize: 13 }}>{error}</p>}
                    {loading ? <p style={{ color: '#aaa', fontSize: 13 }}>Loading…</p> : (
                        addresses.length === 0 && !showForm
                            ? <p style={{ color: '#aaa', fontSize: 13 }}>No addresses yet.</p>
                            : addresses.map(a => (
                                <div key={a.id} style={{ background: '#f8f9ff', borderRadius: 8, padding: '12px 14px', fontSize: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <strong>{a.receiverName}</strong> · {a.receiverPhone}
                                            {a.isDefault && <span style={{ marginLeft: 8, padding: '1px 7px', background: '#e3f2fd', color:
                                                    '#1565c0', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>Default</span>}
                                            <div style={{ color: '#888', fontSize: 13, marginTop: 3 }}>
                                                {[a.state, a.city, a.district, a.detailAddress].filter(Boolean).join(', ')}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                            {!a.isDefault && <button onClick={() => setDefault(a.id)} style={{ fontSize: 12, padding: '3px 8px', border: '1px solid #ddd',
                                                borderRadius: 6, cursor: 'pointer', background: '#fff' }}>Set default</button>}
                                            <button onClick={() => openEdit(a)} style={{ fontSize: 12, padding: '3px 8px', border: '1px solid #ddd', borderRadius: 6, cursor:
                                                    'pointer', background: '#fff' }}>Edit</button>
                                            <button onClick={() => remove(a.id)} style={{ fontSize: 12, padding: '3px 8px', border: '1px solid #ffcdd2', borderRadius: 6, cursor:
                                                    'pointer', background: '#fff', color: '#c62828' }}>Delete</button>
                                        </div>
                                                </div>
                                                </div>
                                                ))
                                                )}

                                            {showForm ? (
                                                <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 16, display: 'flex',
                                                flexDirection: 'column', gap: 10 }}>
                                                <strong style={{ fontSize: 14 }}>{editing ? 'Edit Address' : 'New Address'}</strong>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                    {field('Receiver name', 'receiverName')}
                                                    {field('Receiver phone', 'receiverPhone')}
                                                    {field('State / Province', 'state')}
                                                    {field('City', 'city')}
                                                    {field('District', 'district')}
                                                    {field('Detail address', 'detailAddress')}
                                                </div>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                                                    <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault:
                                                        e.target.checked }))} />
                                                    Set as default
                                                </label>
                                                {error && <p style={{ color: '#c62828', fontSize: 13 }}>{error}</p>}
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                    <button onClick={() => setShowForm(false)} style={{ padding: '6px 14px', border: '1px solid #ddd',
                                                        borderRadius: 7, cursor: 'pointer', background: '#fff', fontSize: 13 }}>Cancel</button>
                                                    <button onClick={save} disabled={saving} style={{ padding: '6px 14px', border: 'none', borderRadius: 7, cursor:
                                                            'pointer', background: '#5c6bc0', color: '#fff', fontSize: 13 }}>
                                                        {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Address'}
                                                    </button>
                                                </div>
                                            </div>
                                                ) : (
                                                <button onClick={openAdd} style={{ alignSelf: 'flex-start', padding: '6px 14px', border: '1px dashed #5c6bc0',
                                            borderRadius: 7, cursor: 'pointer', background: '#fff', color: '#5c6bc0', fontSize: 13 }}>
                                            + Add address
                                        </button>
                                        )}
                                    </div>
                                    )}
                                </div>
                            );
}

function EmailSection() {
    const token = localStorage.getItem('token');
    const [open, setOpen]       = useState(false);
    const [form, setForm]       = useState({ email: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState('');
    const [success, setSuccess] = useState('');

    async function load() {
        setLoading(true); setError(''); setSuccess('');
        try {
            const data = await getProfile(token);
            setForm({ email: data.email || '', phone: data.phone || '' });
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }

    function toggle() {
        if (!open) load();
        setOpen(o => !o);
    }

    async function save() {
        setSaving(true); setError(''); setSuccess('');
        try {
            if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                setError('Invalid email format');
                return;
            }
            if (form.phone && form.phone.length > 20) {
                setError('Phone number must not exceed 20 characters');
                return;
            }
            if (form.phone && !/^[0-9+\-()\s]*$/.test(form.phone)) {
                setError('Phone number contains invalid characters');
                return;
            }
            const updated = await updateProfile(token, form);
            setForm({ email: updated.email || '', phone: updated.phone || '' });
            setSuccess('Saved successfully.');
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    }

    return (
        <div>
            <button onClick={toggle} className="profile-links__item"
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                <span className="profile-links__label">Email &amp; Phone</span>
                <span className="profile-links__hint">{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <div className="profile-email__body">
                    {loading ? <p className="profile-email__msg--error">Loading…</p> : (
                        <>
                            <div className="profile-email__grid">
                                <div className="profile-email__field">
                                    <label className="profile-email__label">Email</label>
                                    <input className="profile-email__input" value={form.email}
                                           placeholder="your@email.com"
                                           onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                                </div>
                                <div className="profile-email__field">
                                    <label className="profile-email__label">Phone</label>
                                    <input className="profile-email__input" value={form.phone}
                                           placeholder="+1 234 567 8900"
                                           onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                                </div>
                            </div>
                            {error   && <p className="profile-email__msg--error">{error}</p>}
                            {success && <p className="profile-email__msg--success">{success}</p>}
                            <div className="profile-email__footer">
                                <button className="profile-email__save" onClick={save} disabled={saving}>
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function PasswordSection() {
    const token = localStorage.getItem('token');
    const [open, setOpen]     = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    function toggle() {
        setOpen(o => !o);
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setError(''); setSuccess('');
    }

    async function save() {
        setError(''); setSuccess('');
        if (!form.currentPassword) { setError('Please enter your current password'); return; }
        if (form.newPassword.length < 6) { setError('New password must be at least 6 characters'); return; }
        if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match'); return; }

        setSaving(true);
        try {
            await changePassword(token, {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            setSuccess('Password changed successfully.');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    }

    const field = (label, key) => (
        <div className="profile-password__field">
            <label className="profile-password__label">{label}</label>
            <input type="password" className="profile-password__input"
                   value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
        </div>
    );

    return (
        <div>
            <button onClick={toggle} className="profile-links__item"
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                <span className="profile-links__label">Change password</span>
                <span className="profile-links__hint">{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <div className="profile-password__body">
                    {field('Current password', 'currentPassword')}
                    {field('New password', 'newPassword')}
                    {field('Confirm new password', 'confirmPassword')}
                    {error   && <p className="profile-password__msg--error">{error}</p>}
                    {success && <p className="profile-password__msg--success">{success}</p>}
                    <div className="profile-password__footer">
                        <button className="profile-password__save" onClick={save} disabled={saving}>
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}