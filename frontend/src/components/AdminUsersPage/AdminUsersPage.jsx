import { useState, useEffect, useRef, useCallback } from 'react';
import {
    adminListUsers, adminCreateUser, adminUpdateUser, adminDeleteUser,
    adminBlacklistUser, adminUnblacklistUser,
    adminGetAddresses, adminGetLoginLogs, adminGetBlacklistHistory,
} from '../../api/adminUsers';
import './AdminUsersPage.css';

const STATUS_COLORS = {
    ACTIVE:   { color: '#1b5e20', background: '#e8f5e9' },
    INACTIVE: { color: '#424242', background: '#f5f5f5' },
    BANNED:   { color: '#b71c1c', background: '#ffebee' },
};

const ROLE_COLORS = {
    ROLE_ADMIN: { color: '#4527a0', background: '#ede7f6' },
    ROLE_USER:  { color: '#1565c0', background: '#e3f2fd' },
};

function StatusBadge({ status }) {
    const s = STATUS_COLORS[status] || { color: '#333', background: '#eee' };
    return <span style={{ ...s, padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{status}</span>;
}

function RoleBadge({ role }) {
    const s = ROLE_COLORS[role] || { color: '#333', background: '#eee' };
    return <span style={{ ...s, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, marginRight: 4 }}>{role.replace('ROLE_', '')}</span>;
}

function Modal({ title, onClose, children }) {
    return (
        <div className="aup-overlay" onClick={onClose}>
            <div className="aup-modal" onClick={e => e.stopPropagation()}>
                <div className="aup-modal-header">
                    <span>{title}</span>
                    <button className="aup-close" onClick={onClose}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}

const EMPTY_FORM = { username: '', email: '', phone: '', password: '', roleNames: ['ROLE_USER'], status: 'ACTIVE' };

export default function AdminUsersPage() {
    const token = localStorage.getItem('token');

    // List
    const [users, setUsers]               = useState([]);
    const [loading, setLoading]           = useState(false);
    const [listError, setListError]       = useState('');
    const [keyword, setKeyword]           = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const debounceRef = useRef(null);

    // Detail panel
    const [selected, setSelected]     = useState(null);
    const [detailTab, setDetailTab]   = useState('info');
    const [addresses, setAddresses]   = useState([]);
    const [addrLoaded, setAddrLoaded] = useState(false);
    const [loginLogs, setLoginLogs]   = useState([]);
    const [logsLoaded, setLogsLoaded] = useState(false);
    const [blHistory, setBlHistory]   = useState([]);
    const [blLoaded, setBlLoaded]     = useState(false);
    const [subLoading, setSubLoading] = useState(false);

    // Blacklist modal
    const [blModal, setBlModal]   = useState(false);
    const [blReason, setBlReason] = useState('');
    const [blError, setBlError]   = useState('');

    // Create/Edit modal
    const [userModal, setUserModal] = useState(false);
    const [editing, setEditing]     = useState(null);
    const [form, setForm]           = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [saving, setSaving]       = useState(false);

    // ── Fetch users ──────────────────────────────────────────────
    const fetchUsers = useCallback(async (kw, st) => {
        setLoading(true);
        setListError('');
        try {
            const data = await adminListUsers(token, { keyword: kw || undefined, status: st || undefined });
            setUsers(data);
        } catch (e) {
            setListError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchUsers('', ''); }, [fetchUsers]);
    useEffect(() => { fetchUsers(keyword, statusFilter); }, [statusFilter]);

    function handleKeywordChange(val) {
        setKeyword(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchUsers(val, statusFilter), 400);
    }

    // ── Select user ───────────────────────────────────────────────
    function selectUser(user) {
        setSelected(user);
        setDetailTab('info');
        setAddresses([]); setAddrLoaded(false);
        setLoginLogs([]); setLogsLoaded(false);
        setBlHistory([]); setBlLoaded(false);
    }

    // ── Load tab data ─────────────────────────────────────────────
    async function loadTab(tab) {
        setDetailTab(tab);
        if (!selected) return;
        if (tab === 'addresses' && !addrLoaded) {
            setSubLoading(true);
            try { setAddresses(await adminGetAddresses(token, selected.id)); setAddrLoaded(true); }
            catch { } finally { setSubLoading(false); }
        }
        if (tab === 'logs' && !logsLoaded) {
            setSubLoading(true);
            try { setLoginLogs(await adminGetLoginLogs(token, selected.id)); setLogsLoaded(true); }
            catch { } finally { setSubLoading(false); }
        }
        if (tab === 'blacklist' && !blLoaded) {
            setSubLoading(true);
            try { setBlHistory(await adminGetBlacklistHistory(token, selected.id)); setBlLoaded(true); }
            catch { } finally { setSubLoading(false); }
        }
    }

    // ── Blacklist ─────────────────────────────────────────────────
    async function submitBlacklist() {
        if (!blReason.trim()) { setBlError('Reason is required'); return; }
        setSaving(true); setBlError('');
        try {
            const updated = await adminBlacklistUser(token, selected.id, blReason.trim());
            patchUser(updated);
            setBlHistory([]);
            setBlLoaded(false);
            setBlModal(false); setBlReason('');
        } catch (e) { setBlError(e.message); }
        finally { setSaving(false); }
    }

    async function unblacklist() {
        setSaving(true);
        try {
            patchUser(await adminUnblacklistUser(token, selected.id));
            setBlHistory([]);
            setBlLoaded(false)
        }
        catch { } finally { setSaving(false); }
    }

    // ── Create / Edit ─────────────────────────────────────────────
    function openCreate() {
        setEditing(null); setForm(EMPTY_FORM); setFormError(''); setUserModal(true);
    }

    function openEdit(user) {
        setEditing(user);
        setForm({ username: user.username, email: user.email || '', phone: user.phone || '',
            password: '', roleNames: [...(user.roles || ['ROLE_USER'])], status: user.status });
        setFormError(''); setUserModal(true);
    }

    function toggleRole(role) {
        setForm(f => ({
            ...f,
            roleNames: f.roleNames.includes(role) ? f.roleNames.filter(r => r !== role) : [...f.roleNames, role],
        }));
    }

    async function submitUserForm() {
        setFormError('');
        if (!editing && !form.username.trim()) { setFormError('Username is required'); return; }
        if (!editing && !form.password.trim()) { setFormError('Password is required'); return; }
        if (form.roleNames.length === 0) { setFormError('Select at least one role'); return; }
        setSaving(true);
        try {
            const body = { email: form.email || null, phone: form.phone || null,
                roleNames: form.roleNames, status: form.status };
            if (!editing) { body.username = form.username.trim(); body.password = form.password; }
            if (editing && form.password) body.password = form.password;

            if (editing) {
                patchUser(await adminUpdateUser(token, editing.id, body));
            } else {
                const created = await adminCreateUser(token, body);
                setUsers(prev => [created, ...prev]);
            }
            setUserModal(false);
        } catch (e) { setFormError(e.message); }
        finally { setSaving(false); }
    }

    // ── Delete ────────────────────────────────────────────────────
    async function deleteUser(user) {
        if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
        try {
            await adminDeleteUser(token, user.id);
            setUsers(prev => prev.filter(u => u.id !== user.id));
            if (selected?.id === user.id) setSelected(null);
        } catch (e) { alert(e.message); }
    }

    function patchUser(updated) {
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        setSelected(updated);
    }

    // ── Render ────────────────────────────────────────────────────
    return (
        <div className="aup-root">
            {/* Toolbar */}
            <div className="aup-toolbar">
                <h1 className="aup-title">Users</h1>
                <div className="aup-toolbar-right">
                    <input className="aup-search" placeholder="Search username…"
                           value={keyword} onChange={e => handleKeywordChange(e.target.value)} />
                    <select className="aup-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="BANNED">Banned</option>
                    </select>
                    <button className="aup-btn aup-btn--primary" onClick={openCreate}>+ New User</button>
                </div>
            </div>

            {/* Body */}
            <div className="aup-body">
                {/* Table */}
                <div className={`aup-table-wrap ${selected ? 'aup-table-wrap--split' : ''}`}>
                    {listError && <div className="aup-error" style={{ padding: 16 }}>{listError}</div>}
                    {loading ? (
                        <div className="aup-placeholder">Loading…</div>
                    ) : users.length === 0 ? (
                        <div className="aup-placeholder">No users found.</div>
                    ) : (
                        <table className="aup-table">
                            <thead>
                            <tr>
                                <th>ID</th><th>Username</th><th>Email</th>
                                <th>Roles</th><th>Status</th><th>Joined</th><th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.map(u => (
                                <tr key={u.id}
                                    className={`aup-row ${selected?.id === u.id ? 'aup-row--active' : ''}`}
                                    onClick={() => selectUser(u)}>
                                    <td className="aup-cell--muted">{u.id}</td>
                                    <td><strong>{u.username}</strong></td>
                                    <td className="aup-cell--muted">{u.email || '—'}</td>
                                    <td>{(u.roles || []).map(r => <RoleBadge key={r} role={r} />)}</td>
                                    <td><StatusBadge status={u.status} /></td>
                                    <td className="aup-cell--muted">
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <button className="aup-btn aup-btn--sm" onClick={() => openEdit(u)}>Edit</button>
                                        {' '}
                                        <button className="aup-btn aup-btn--sm aup-btn--danger" onClick={() => deleteUser(u)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Detail panel */}
                {selected && (
                    <div className="aup-detail">
                        <div className="aup-detail-header">
                            <div>
                                <div className="aup-detail-name">{selected.username}</div>
                                <div className="aup-detail-meta">{selected.email || 'No email'} · {selected.phone || 'No phone'}</div>
                                <div style={{ marginTop: 6 }}>
                                    {(selected.roles || []).map(r => <RoleBadge key={r} role={r} />)}
                                    <StatusBadge status={selected.status} />
                                </div>
                            </div>
                            <button className="aup-close" onClick={() => setSelected(null)}>✕</button>
                        </div>

                        <div className="aup-detail-actions">
                            <button className="aup-btn aup-btn--sm" onClick={() => openEdit(selected)}>Edit</button>
                            {selected.blacklisted ? (
                                <button className="aup-btn aup-btn--sm aup-btn--success" onClick={unblacklist} disabled={saving}>Unblacklist</button>
                            ) : (
                                <button className="aup-btn aup-btn--sm aup-btn--danger" onClick={() => { setBlError(''); setBlReason(''); setBlModal(true); }}>Blacklist</button>
                            )}
                            <button className="aup-btn aup-btn--sm aup-btn--danger" onClick={() => deleteUser(selected)}>Delete</button>
                        </div>

                        <div className="aup-tabs">
                            {[['info','Info'],['addresses','Addresses'],['logs','Login Logs'],['blacklist','Blacklist']].map(([t, label]) => (
                                <button key={t} className={`aup-tab ${detailTab === t ? 'aup-tab--active' : ''}`} onClick={() => loadTab(t)}>{label}</button>
                            ))}
                        </div>

                        <div className="aup-tab-content">
                            {subLoading ? <div className="aup-placeholder">Loading…</div>
                                : detailTab === 'info'      ? <InfoTab user={selected} />
                                    : detailTab === 'addresses' ? <AddressesTab addresses={addresses} />
                                        : detailTab === 'logs'      ? <LogsTab logs={loginLogs} />
                                            :                             <BlacklistTab history={blHistory} />}
                        </div>
                    </div>
                )}
            </div>

            {/* Blacklist modal */}
            {blModal && (
                <Modal title="Blacklist User" onClose={() => setBlModal(false)}>
                    <p style={{ color: '#555', marginBottom: 12 }}>
                        Banning <strong>{selected?.username}</strong>. Please provide a reason:
                    </p>
                    <textarea className="aup-textarea" rows={3} value={blReason}
                              onChange={e => setBlReason(e.target.value)} placeholder="e.g. Fraudulent activity" />
                    {blError && <div className="aup-error">{blError}</div>}
                    <div className="aup-modal-footer">
                        <button className="aup-btn" onClick={() => setBlModal(false)}>Cancel</button>
                        <button className="aup-btn aup-btn--danger" onClick={submitBlacklist} disabled={saving}>
                            {saving ? 'Banning…' : 'Confirm Ban'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Create / Edit modal */}
            {userModal && (
                <Modal title={editing ? `Edit — ${editing.username}` : 'Create User'} onClose={() => setUserModal(false)}>
                    <div className="aup-form">
                        {!editing && (<><label>Username *</label><input className="aup-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                        /></>)}
                        <label>Email</label>
                        <input className="aup-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        <label>Phone</label>
                        <input className="aup-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        <label>{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                        <input className="aup-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                        <label>Roles</label>
                        <div className="aup-checkboxes">
                            {['ROLE_USER', 'ROLE_ADMIN'].map(r => (
                                <label key={r} className="aup-checkbox-label">
                                    <input type="checkbox" checked={form.roleNames.includes(r)} onChange={() => toggleRole(r)} />
                                    {r.replace('ROLE_', '')}
                                </label>
                            ))}
                        </div>
                        {editing && (<><label>Status</label>
                            <select className="aup-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="BANNED">Banned</option>
                            </select></>)}
                    </div>
                    {formError && <div className="aup-error">{formError}</div>}
                    <div className="aup-modal-footer">
                        <button className="aup-btn" onClick={() => setUserModal(false)}>Cancel</button>
                        <button className="aup-btn aup-btn--primary" onClick={submitUserForm} disabled={saving}>
                            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ── Tab content components ───────────────────────────────────────────────────

function InfoTab({ user }) {
    const rows = [
        ['ID', user.id], ['Username', user.username], ['Email', user.email || '—'],
        ['Phone', user.phone || '—'], ['Status', user.status], ['Level', user.levelId ?? '—'],
        ['Blacklisted', user.blacklisted ? 'Yes' : 'No'],
        ['Created', user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'],
        ['Updated', user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '—'],
    ];
    return (
        <table className="aup-info-table"><tbody>
        {rows.map(([k, v]) => (
            <tr key={k}><td className="aup-info-key">{k}</td><td>{v}</td></tr>
        ))}
        </tbody></table>
    );
}

function AddressesTab({ addresses }) {
    if (!addresses.length) return <div className="aup-placeholder">No addresses.</div>;
    return (
        <div className="aup-sub-list">
            {addresses.map(a => (
                <div key={a.id} className="aup-sub-card">
                    <div><strong>{a.receiverName}</strong> · {a.receiverPhone}</div>
                    <div className="aup-cell--muted">{[a.state, a.city, a.district, a.detailAddress].filter(Boolean).join(', ')}</div>
                    {a.isDefault && <span className="aup-badge-default">Default</span>}
                </div>
            ))}
        </div>
    );
}

function LogsTab({ logs }) {
    if (!logs.length) return <div className="aup-placeholder">No login records.</div>;
    return (
        <table className="aup-table aup-table--compact"><thead>
        <tr><th>Time</th><th>IP</th><th>Device</th><th>Result</th></tr>
        </thead><tbody>
        {logs.map(l => (
            <tr key={l.id}>
                <td className="aup-cell--muted">{l.loginTime ? new Date(l.loginTime).toLocaleString() : '—'}</td>
                <td>{l.loginIp || '—'}</td>
                <td className="aup-cell--muted">{l.deviceInfo || '—'}</td>
                <td><span style={{ color: l.successFlag ? '#2e7d32' : '#b71c1c', fontWeight: 600 }}>{l.successFlag ? 'OK' : 'Fail'}</span></td>
            </tr>
        ))}
        </tbody></table>
    );
}

function BlacklistTab({ history }) {
    if (!history.length) return <div className="aup-placeholder">No blacklist records.</div>;
    return (
        <div className="aup-sub-list">
            {history.map(b => (
                <div key={b.id} className="aup-sub-card">
                    <div className="aup-cell--muted" style={{ fontSize: 12 }}>{b.createdAt ? new Date(b.createdAt).toLocaleString() : '—'}</div>
                    <div>{b.reason || 'No reason given'}</div>
                </div>
            ))}
        </div>
    );
}


