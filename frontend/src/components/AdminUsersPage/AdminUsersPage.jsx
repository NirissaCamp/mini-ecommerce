import { useState, useEffect, useRef, useCallback } from 'react';
import {
    adminListUsers, adminUpdateUser, adminDeleteUser,
    adminBlacklistUser, adminUnblacklistUser,
    adminGetAddresses, adminGetLoginLogs,
    adminGetAllOperationLogs, adminGetAllLoginLogs,
    adminListRoles, adminCreateRole, adminUpdateRole, adminDeleteRole,
    adminAddUserToRole, adminRemoveUserFromRole,
    adminAddPermissionToRole, adminRemovePermissionFromRole,
    adminGetAllBlacklist,
} from '../../api/adminUsers';
import './AdminUsersPage.css';

function ErrorBanner({ message, onClose }) {
    if (!message) return null;
    return (
        <div className="aup-error-banner">
            <span>⚠ {message}</span>
            <button onClick={onClose}>✕</button>
        </div>
    );
}

// ── Shared badge components ───────────────────────────────────────────────────

const STATUS_COLORS = {
    ACTIVE:   { color: '#1b5e20', background: '#e8f5e9' },
    INACTIVE: { color: '#424242', background: '#f5f5f5' },
    BANNED:   { color: '#b71c1c', background: '#ffebee' },
};
const ROLE_COLORS = {
    ROLE_ADMIN: { color: '#4527a0', background: '#ede7f6' },
    ROLE_USER:  { color: '#1565c0', background: '#e3f2fd' },
};
const ROLE_PALETTE = [
    { color: '#1b5e20', background: '#e8f5e9' },
    { color: '#e65100', background: '#fff3e0' },
    { color: '#880e4f', background: '#fce4ec' },
    { color: '#006064', background: '#e0f7fa' },
    { color: '#bf360c', background: '#fbe9e7' },
    { color: '#33691e', background: '#f1f8e9' },
];
function roleColor(name) {
    if (ROLE_COLORS[name]) return ROLE_COLORS[name];
    const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % ROLE_PALETTE.length;
    return ROLE_PALETTE[idx];
}
const ACTION_STYLES = {
    CREATE:      { color: '#2e7d32', background: '#e8f5e9' },
    UPDATE:      { color: '#4527a0', background: '#ede7f6' },
    DELETE:      { color: '#b71c1c', background: '#ffebee' },
    BLACKLIST:   { color: '#b71c1c', background: '#ffebee' },
    UNBLACKLIST: { color: '#1565c0', background: '#e3f2fd' },
};

function StatusBadge({ status }) {
    const s = STATUS_COLORS[status] || { color: '#333', background: '#eee' };
    return <span style={{ ...s, padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{status}</span>;
}
function RoleBadge({ role }) {
    const s = roleColor(role);
    return <span style={{ ...s, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, marginRight: 4 }}>{role}</span>;
}
function ActionBadge({ action }) {
    const s = ACTION_STYLES[action] || { color: '#333', background: '#eee' };
    return <span style={{ ...s, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{action}</span>;
}

const AVATAR_COLORS = ['#5c6bc0','#26a69a','#ef5350','#ab47bc','#42a5f5','#ff7043','#66bb6a'];
function avatarColor(name) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }

function AvatarGroup({ users = [] }) {
    const previews = users.slice(0, 3);
    const extra = users.length - previews.length;
    if (users.length === 0) return <span className="aup-cell--muted" style={{ fontSize: 13 }}>—</span>;
    return (
        <div className="aup-avatar-group">
            {previews.map(u => (
                <div key={u.id} className="aup-avatar" style={{ background: avatarColor(u.username) }} title={u.username}>
                    {u.username[0].toUpperCase()}
                </div>
            ))}
            {extra > 0 && <div className="aup-avatar aup-avatar--more">+{extra}</div>}
        </div>
    );
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

// ── Permission config (static for mini-ecommerce) ────────────────────────────

const PERMISSION_CONFIG = [
    { resource: 'Products', items: [
        { code: 'PRODUCT_BROWSE', label: 'Browse' },
        { code: 'PRODUCT_CREATE', label: 'Create' },
        { code: 'PRODUCT_EDIT',   label: 'Edit' },
        { code: 'PRODUCT_DELETE', label: 'Delete' },
    ]},
    { resource: 'Inventory', items: [
        { code: 'INVENTORY_VIEW',   label: 'View' },
        { code: 'INVENTORY_MANAGE', label: 'Manage' },
    ]},
    { resource: 'Orders', items: [
        { code: 'ORDER_VIEW_ALL',      label: 'View All' },
        { code: 'ORDER_STATUS_UPDATE', label: 'Update Status' },
        { code: 'ORDER_RETURNS',       label: 'Returns' },
        { code: 'ORDER_ANALYTICS',     label: 'Analytics' },
    ]},
    { resource: 'Users', items: [
        { code: 'USER_ADMIN_DETAIL',   label: 'Admin User Detail' },
        { code: 'USER_REGULAR_DETAIL', label: 'Regular User Detail' },
        { code: 'USER_ROLES',          label: 'Roles & Permissions' },
        { code: 'USER_OPERATION_LOG',  label: 'Operation Log' },
        { code: 'USER_BLACKLIST',      label: 'Blacklist' },
    ]},
    { resource: 'Profile', items: [
        { code: 'PROFILE_VIEW', label: 'View' },
        { code: 'PROFILE_EDIT', label: 'Edit' },
    ]},
    { resource: 'Admin Panel', items: [
        { code: 'ADMIN_PANEL_ACCESS', label: 'Full Access' },
    ]},
];

// ── Main page ─────────────────────────────────────────────────────────────────

const TOP_TABS = ['User Detail', 'Roles & Permissions', 'Operation Log', 'Blacklist'];
const TAB_PERMISSIONS = {
    'User Detail':         ['USER_ADMIN_DETAIL', 'USER_REGULAR_DETAIL'],
    'Roles & Permissions': ['USER_ROLES'],
    'Operation Log':       ['USER_OPERATION_LOG'],
    'Blacklist':           ['USER_BLACKLIST'],
};

export default function AdminUsersPage({ userPermissions = [], isSuperAdmin = false }) {
    const token = localStorage.getItem('token');
    const visibleTabs = TOP_TABS.filter(t =>
        isSuperAdmin || TAB_PERMISSIONS[t].some(p => userPermissions.includes(p))
    );
    const [topTab, setTopTab] = useState(() => visibleTabs[0] || TOP_TABS[0]);

    useEffect(() => {
        if (visibleTabs.length > 0 && !visibleTabs.includes(topTab)) {
            setTopTab(visibleTabs[0]);
        }
    }, [userPermissions.join(','), isSuperAdmin]);

    return (
        <div className="aup-root">
            <div className="aup-top-tabs">
                {visibleTabs.map(t => (
                    <button key={t}
                        className={`aup-top-tab ${topTab === t ? 'aup-top-tab--active' : ''}`}
                        onClick={() => setTopTab(t)}>
                        {t}
                    </button>
                ))}
            </div>
            <div className="aup-top-content">
                {topTab === 'User Detail'          && <UserDetailSection token={token} userPermissions={userPermissions} isSuperAdmin={isSuperAdmin} />}
                {topTab === 'Roles & Permissions'  && <RolesPermissionsSection token={token} />}
                {topTab === 'Operation Log'        && <OperationLogSection token={token} />}
                {topTab === 'Blacklist'            && <BlacklistSection token={token} />}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — User Detail
// ══════════════════════════════════════════════════════════════════════════════

function UsersTable({ users, selected, onSelect, emptyMessage = 'No users found.' }) {
    if (users.length === 0) return <div className="aup-placeholder" style={{ padding: '20px 40px' }}>{emptyMessage}</div>;
    return (
        <table className="aup-table">
            <thead><tr>
                <th>ID</th><th>Username</th><th>Email</th>
                <th>Roles</th><th>Status</th><th>Joined</th>
            </tr></thead>
            <tbody>
            {users.map(u => (
                <tr key={u.id}
                    className={`aup-row ${selected?.id === u.id ? 'aup-row--active' : ''}`}
                    onClick={() => onSelect(u)}>
                    <td className="aup-cell--muted">{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td className="aup-cell--muted">{u.email || '—'}</td>
                    <td>{(u.roles || []).map(r => <RoleBadge key={r} role={r} />)}</td>
                    <td><StatusBadge status={u.status} /></td>
                    <td className="aup-cell--muted">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

function UserDetailSection({ token, userPermissions = [], isSuperAdmin = false }) {
    const [users, setUsers]             = useState([]);
    const [loading, setLoading]         = useState(false);
    const [listError, setListError]     = useState('');
    const [keyword, setKeyword]         = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const debounceRef = useRef(null);

    const [selected, setSelected]       = useState(null);
    const [detailTab, setDetailTab]     = useState('info');
    const [addresses, setAddresses]     = useState([]);
    const [addrLoaded, setAddrLoaded]   = useState(false);
    const [loginLogs, setLoginLogs]     = useState([]);
    const [loginLoaded, setLoginLoaded] = useState(false);
    const [subLoading, setSubLoading]   = useState(false);

    const [actionError, setActionError] = useState('');

    const [allRoles, setAllRoles]   = useState([]);
    const [userModal, setUserModal] = useState(false);
    const [editing, setEditing]   = useState(null);
    const [form, setForm]         = useState({ email: '', phone: '', password: '', roleName: 'ROLE_USER', status: 'ACTIVE', banReason: '' });
    const [formError, setFormError] = useState('');
    const [saving, setSaving]     = useState(false);

    useEffect(() => {
        adminListRoles(token).then(data => setAllRoles(data)).catch(() => {});
    }, [token]);

    const fetchUsers = useCallback(async (kw, st) => {
        setLoading(true); setListError('');
        try { setUsers(await adminListUsers(token, { keyword: kw || undefined, status: st || undefined })); }
        catch (e) { setListError(e.message); }
        finally { setLoading(false); }
    }, [token]);

    useEffect(() => { fetchUsers(keyword, statusFilter); }, [statusFilter]);

    function handleKeywordChange(val) {
        setKeyword(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchUsers(val, statusFilter), 400);
    }

    function selectUser(user) {
        setSelected(user); setDetailTab('info');
        setAddresses([]);  setAddrLoaded(false);
        setLoginLogs([]); setLoginLoaded(false);
    }

    async function loadTab(tab) {
        setDetailTab(tab);
        if (!selected) return;
        if (tab === 'addresses' && !addrLoaded) {
            setSubLoading(true);
            try { setAddresses(await adminGetAddresses(token, selected.id)); setAddrLoaded(true); }
            catch { } finally { setSubLoading(false); }
        }
        if (tab === 'loginLog' && !loginLoaded) {
            setSubLoading(true);
            try { setLoginLogs(await adminGetLoginLogs(token, selected.id)); setLoginLoaded(true); }
            catch { } finally { setSubLoading(false); }
        }
    }

    function openEdit(user) {
        setEditing(user);
        setForm({ email: user.email || '', phone: user.phone || '',
            password: '', roleName: (user.roles?.[0] || 'ROLE_USER'), status: user.status, banReason: '' });
        setFormError(''); setUserModal(true);
    }
    async function submitUserForm() {
        setFormError('');
        if (!form.roleName) { setFormError('Select a role'); return; }
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setFormError('Invalid email format'); return; }
        if (form.phone && form.phone.length > 20) { setFormError('Phone number must not exceed 20 characters'); return; }
        if (form.phone && !/^[0-9+\-()\s]*$/.test(form.phone)) { setFormError('Phone number contains invalid characters'); return; }
        if (form.password && form.password.length < 6) { setFormError('New password must be at least 6 characters'); return; }
        const transitioningToBanned   = form.status === 'BANNED' && editing.status !== 'BANNED';
        const transitioningFromBanned = editing.status === 'BANNED' && form.status !== 'BANNED';
        if (transitioningToBanned && !form.banReason.trim()) { setFormError('Please provide a reason for banning'); return; }
        setSaving(true);
        try {
            const body = { email: form.email || null, phone: form.phone || null, roleNames: [form.roleName] };
            if (form.password) body.password = form.password;
            if (!transitioningToBanned && !transitioningFromBanned) body.status = form.status;

            const updated = await adminUpdateUser(token, editing.id, body);
            if (transitioningToBanned) {
                patchUser(await adminBlacklistUser(token, editing.id, form.banReason.trim()));
            } else if (transitioningFromBanned) {
                patchUser(await adminUnblacklistUser(token, editing.id));
            } else {
                patchUser(updated);
            }
            setUserModal(false);
        } catch (e) { setFormError(e.message); }
        finally { setSaving(false); }
    }
    async function deleteUser(user) {
        if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
        try {
            await adminDeleteUser(token, user.id);
            setUsers(prev => prev.filter(u => u.id !== user.id));
            if (selected?.id === user.id) setSelected(null);
        } catch (e) { setActionError('Failed to delete user. Please try again.'); }
    }
    function patchUser(updated) {
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        setSelected(updated);
    }

    const canSeeAdminList   = isSuperAdmin || userPermissions.includes('USER_ADMIN_DETAIL');
    const canSeeRegularList = isSuperAdmin || userPermissions.includes('USER_REGULAR_DETAIL');
    const adminRoleNames = new Set(allRoles.filter(r => r.isAdminRole || r.roleName === 'ROLE_ADMIN').map(r => r.roleName));
    const adminUsers  = users.filter(u => u.roles?.some(r => adminRoleNames.has(r)));
    const regularUsers = users.filter(u => !u.roles?.some(r => adminRoleNames.has(r)));

//  列表里已经搜不到当前这个人时，右侧详情应该关掉
    useEffect(() => {
        if (selected == null) return
        const stillExists = users.some(u => u.id === selected.id)
        if (!stillExists) {
            setSelected(null)
        }
    }, [users, selected])
    return (
        <>
            <ErrorBanner message={actionError} onClose={() => setActionError('')} />
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
                </div>
            </div>

            {/* Body */}
            <div className="aup-body">
                {/* User list */}
                <div className={`aup-table-wrap ${selected ? 'aup-table-wrap--split' : ''}`}>
                    {listError && <div className="aup-error" style={{ padding: 16 }}>{listError}</div>}
                    {loading ? <div className="aup-placeholder">Loading…</div>
                        : users.length === 0 ? <div className="aup-placeholder">No users found.</div>
                        : (
                            <>
                                {canSeeAdminList && (
                                    <div className="aup-user-section">
                                        <div className="aup-section-header">Admin Users</div>
                                        <UsersTable users={adminUsers} selected={selected} onSelect={selectUser} emptyMessage="No admin users." />
                                    </div>
                                )}
                                {canSeeRegularList && (
                                    <div className="aup-user-section">
                                        <div className="aup-section-header">Regular Users</div>
                                        <UsersTable users={regularUsers} selected={selected} onSelect={selectUser} emptyMessage="No regular users." />
                                    </div>
                                )}
                            </>
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
                            <button className="aup-btn aup-btn--primary" onClick={() => openEdit(selected)}>Edit</button>
                            <button className="aup-btn aup-btn--danger-filled" onClick={() => deleteUser(selected)}>Delete</button>
                        </div>

                        <div className="aup-tabs aup-tabs--header">
                            {[['info', 'Info'], ['addresses', 'Addresses'], ['loginLog', 'Login Log']].map(([t, label]) => (
                                <button key={t} className={`aup-tab ${detailTab === t ? 'aup-tab--active' : ''}`}
                                    onClick={() => loadTab(t)}>{label}</button>
                            ))}
                        </div>

                        <div className="aup-tab-content">
                            {subLoading ? <div className="aup-placeholder">Loading…</div>
                                : detailTab === 'info'         ? <InfoTab user={selected} />
                                : detailTab === 'addresses'    ? <AddressesTab addresses={addresses} />
                                :                               <LoginLogsTable logs={loginLogs} showUser={false} />}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit modal */}
            {userModal && editing && (
                <Modal title={`Edit — ${editing.username}`} onClose={() => setUserModal(false)}>
                    <div className="aup-form">
                        <label>Email</label>
                        <input className="aup-input" value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        <label>Phone</label>
                        <input className="aup-input" value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        <label>New Password (leave blank to keep)</label>
                        <input className="aup-input" type="password" value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                        <label>Role</label>
                        <div className="aup-checkboxes">
                            {allRoles.map(r => (
                                <label key={r.roleName} className="aup-checkbox-label">
                                    <input type="radio" name="roleName" value={r.roleName}
                                        checked={form.roleName === r.roleName}
                                        onChange={() => setForm(f => ({ ...f, roleName: r.roleName }))} />
                                    {r.roleName}
                                </label>
                            ))}
                        </div>
                        <label>Status</label>
                        <select className="aup-input" value={form.status}
                            onChange={e => setForm(f => ({ ...f, status: e.target.value, banReason: '' }))}>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="BANNED">Banned</option>
                        </select>
                        {form.status === 'BANNED' && editing.status !== 'BANNED' && (<>
                            <label style={{ color: '#c62828' }}>Ban Reason *</label>
                            <textarea className="aup-textarea" rows={3}
                                placeholder="Provide a reason for banning this user…"
                                value={form.banReason}
                                onChange={e => setForm(f => ({ ...f, banReason: e.target.value }))} />
                        </>)}
                        {editing.status === 'BANNED' && form.status !== 'BANNED' && (
                            <div style={{ fontSize: 12, color: '#e65100', marginTop: 2 }}>
                                ⚠ Changing status will also remove this user from the blacklist.
                            </div>
                        )}
                    </div>
                    {formError && <div className="aup-error">{formError}</div>}
                    <div className="aup-modal-footer">
                        <button className="aup-btn" onClick={() => setUserModal(false)}>Cancel</button>
                        <button className="aup-btn aup-btn--primary" onClick={submitUserForm} disabled={saving}>
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Roles & Permissions
// ══════════════════════════════════════════════════════════════════════════════

function RolesPermissionsSection({ token }) {
    const [roles, setRoles]               = useState([]);
    const [loading, setLoading]           = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [expandedRole, setExpandedRole] = useState(null); // role id with expanded user list
    const [roleModal, setRoleModal]       = useState(false);
    const [editingRole, setEditingRole]   = useState(null);
    const [addUserModal, setAddUserModal]       = useState(false);
    const [addUserQuery, setAddUserQuery]       = useState('');
    const [addUserResults, setAddUserResults]   = useState([]);
    const [addUserSelected, setAddUserSelected] = useState(null);
    const [addUserSearching, setAddUserSearching] = useState(false);
    const addUserDebounceRef = useRef(null);
    const [roleForm, setRoleForm]               = useState({ name: '', desc: '', isAdminRole: false });
    const [modalError, setModalError]           = useState('');
    const [saving, setSaving]             = useState(false);
    const [actionError, setActionError]   = useState('');
    const [togglingPerm, setTogglingPerm] = useState(null);

    async function loadRoles() {
        setLoading(true);
        try {
            const data = await adminListRoles(token);
            setRoles(data);
            if (data.length) setSelectedRole(prev => data.find(r => r.id === prev?.id) || data[0]);
        } catch { } finally { setLoading(false); }
    }

    useEffect(() => { loadRoles(); }, []);

    function openCreate() {
        setEditingRole(null); setRoleForm({ name: '', desc: '', isAdminRole: false }); setModalError(''); setRoleModal(true);
    }
    function openEdit(role) {
        setEditingRole(role); setRoleForm({ name: role.roleName, desc: role.description || '', isAdminRole: role.isAdminRole || false });
        setModalError(''); setRoleModal(true);
    }

    async function submitRoleForm() {
        if (!roleForm.name.trim()) { setModalError('Role name is required'); return; }
        setSaving(true); setModalError('');
        try {
            if (editingRole) {
                const updated = await adminUpdateRole(token, editingRole.id, roleForm.name.trim(), roleForm.desc.trim(), roleForm.isAdminRole);
                setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
                if (selectedRole?.id === updated.id) setSelectedRole(updated);
            } else {
                const name = roleForm.name.trim().toUpperCase().startsWith('ROLE_')
                    ? roleForm.name.trim() : `ROLE_${roleForm.name.trim().toUpperCase()}`;
                const created = await adminCreateRole(token, name, roleForm.desc.trim(), roleForm.isAdminRole);
                setRoles(prev => [...prev, created]);
            }
            setRoleModal(false);
        } catch (e) { setModalError(e.message); }
        finally { setSaving(false); }
    }

    async function handleDeleteRole(role) {
        if (!window.confirm(`Delete role "${role.roleName}"?`)) return;
        try {
            await adminDeleteRole(token, role.id);
            setRoles(prev => prev.filter(r => r.id !== role.id));
            if (selectedRole?.id === role.id) setSelectedRole(null);
            if (expandedRole === role.id) setExpandedRole(null);
        } catch (e) { setActionError(e.message); }
    }

    async function removeUserFromRole(roleId, userId) {
        try {
            const updated = await adminRemoveUserFromRole(token, roleId, userId);
            setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
            if (selectedRole?.id === updated.id) setSelectedRole(updated);
        } catch (e) { setActionError('Failed to remove user from role. Please try again.'); }
    }

    function handleAddUserSearch(val) {
        setAddUserQuery(val);
        setAddUserSelected(null);
        clearTimeout(addUserDebounceRef.current);
        if (!val.trim()) { setAddUserResults([]); return; }
        addUserDebounceRef.current = setTimeout(async () => {
            setAddUserSearching(true);
            try { setAddUserResults(await adminListUsers(token, { keyword: val })); }
            catch { } finally { setAddUserSearching(false); }
        }, 300);
    }

    function openAddUserModal() {
        setModalError('');
        setAddUserQuery(''); setAddUserResults([]); setAddUserSelected(null);
        setAddUserModal(true);
    }

    async function submitAddUser() {
        if (!addUserSelected) { setModalError('Select a user from the list'); return; }
        setSaving(true); setModalError('');
        try {
            const updated = await adminAddUserToRole(token, selectedRole.id, addUserSelected.id);
            setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
            if (selectedRole?.id === updated.id) setSelectedRole(updated);
            setAddUserModal(false);
        } catch (e) { setModalError(e.message); }
        finally { setSaving(false); }
    }

    async function togglePermission(permissionCode, currentlyEnabled) {
        if (togglingPerm) return;
        setTogglingPerm(permissionCode);
        try {
            const updated = currentlyEnabled
                ? await adminRemovePermissionFromRole(token, selectedRole.id, permissionCode)
                : await adminAddPermissionToRole(token, selectedRole.id, permissionCode);
            setSelectedRole(updated);
            setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
        } catch (e) { setActionError('Failed to update permission. Please try again.'); }
        finally { setTogglingPerm(null); }
    }

    const enabledCodes = new Set((selectedRole?.permissions || []).map(p => p.permissionCode));

    return (
        <div className="aup-rp-root">
            <ErrorBanner message={actionError} onClose={() => setActionError('')} />
            {/* Left — Roles table */}
            <div className="aup-rp-left">
                <div className="aup-rp-panel-header">
                    <span className="aup-rp-panel-title">Roles List</span>
                    <button className="aup-btn aup-btn--sm aup-btn--primary" onClick={openCreate}>+ Create New Role</button>
                </div>
                {loading ? <div className="aup-placeholder">Loading…</div> : (
                    <table className="aup-table">
                        <thead><tr>
                            <th>Role Name</th><th>Description</th><th>Users Count</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                        {roles.map(r => {
                            const expanded = expandedRole === r.id;
                            return (
                                <>
                                <tr key={r.id}
                                    className={`aup-row ${selectedRole?.id === r.id ? 'aup-row--active' : ''}`}
                                    onClick={() => setSelectedRole(r)}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <button className="aup-expand-btn"
                                                onClick={e => { e.stopPropagation(); setExpandedRole(expanded ? null : r.id); }}
                                                title={expanded ? 'Collapse' : 'Show users'}>
                                                {expanded ? '▾' : '▸'}
                                            </button>
                                            <RoleBadge role={r.roleName} />
                                        </div>
                                    </td>
                                    <td className="aup-cell--muted" style={{ fontSize: 13 }}>{r.description || '—'}</td>
                                    <td><AvatarGroup users={r.users || []} /></td>
                                    <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                                        <button className="aup-btn aup-btn--sm" title="Edit" onClick={() => openEdit(r)}>✏️</button>
                                        {' '}
                                        <button className="aup-btn aup-btn--sm aup-btn--danger" title="Delete"
                                            onClick={() => handleDeleteRole(r)}>🗑️</button>
                                    </td>
                                </tr>
                                {expanded && (
                                    <tr key={`${r.id}-users`} className="aup-expanded-row">
                                        <td colSpan={4}>
                                            {r.users?.length === 0
                                                ? <span className="aup-cell--muted">No users assigned</span>
                                                : <div className="aup-user-chip-list">
                                                    {r.users.map(u => (
                                                        <span key={u.id} className="aup-user-chip">
                                                            {u.username}
                                                            <button className="aup-user-chip-remove"
                                                                onClick={() => removeUserFromRole(r.id, u.id)}>×</button>
                                                        </span>
                                                    ))}
                                                </div>
                                            }
                                        </td>
                                    </tr>
                                )}
                                </>
                            );
                        })}
                        </tbody>
                    </table>
                )}
                {selectedRole && (
                    <div style={{ padding: '10px 14px', borderTop: '1px solid #eee' }}>
                        <button className="aup-btn aup-btn--sm" style={{ width: '100%' }}
                            onClick={openAddUserModal}>
                            + Add User to {selectedRole.roleName}
                        </button>
                    </div>
                )}
            </div>

            {/* Right — Permissions */}
            <div className="aup-rp-right">
                {!selectedRole ? <div className="aup-placeholder">Select a role to view permissions</div> : (
                    <>
                        <div className="aup-rp-panel-header">
                            <span className="aup-rp-panel-title">Permissions — {selectedRole.roleName}</span>
                        </div>
                        <table className="aup-table">
                            <thead><tr><th>Resource</th><th>Permissions</th></tr></thead>
                            <tbody>
                            {PERMISSION_CONFIG.map(group => (
                                <tr key={group.resource}>
                                    <td style={{ fontWeight: 600, fontSize: 13, verticalAlign: 'middle' }}>{group.resource}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                                            {group.items.map(item => {
                                                const enabled = enabledCodes.has(item.code);
                                                const busy = togglingPerm === item.code;
                                                return (
                                                    <label key={item.code} className="aup-perm-checkbox-label"
                                                        style={{ opacity: busy ? 0.5 : 1 }}>
                                                        <input type="checkbox" checked={enabled} disabled={busy}
                                                            onChange={() => togglePermission(item.code, enabled)} />
                                                        {item.label}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            {/* Create / Edit Role modal */}
            {roleModal && (
                <Modal title={editingRole ? `Edit — ${editingRole.roleName}` : 'Create New Role'}
                    onClose={() => setRoleModal(false)}>
                    <div className="aup-form">
                        <label>Role Name *</label>
                        <input className="aup-input" placeholder="e.g. ROLE_MANAGER"
                            value={roleForm.name} onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))} />
                        <label>Description</label>
                        <input className="aup-input" placeholder="Optional description"
                            value={roleForm.desc} onChange={e => setRoleForm(f => ({ ...f, desc: e.target.value }))} />
                        <label className="aup-checkbox-label">
                            <input type="checkbox" checked={roleForm.isAdminRole}
                                onChange={e => setRoleForm(f => ({ ...f, isAdminRole: e.target.checked }))} />
                            Admin Panel Access
                        </label>
                    </div>
                    {modalError && <div className="aup-error">{modalError}</div>}
                    <div className="aup-modal-footer">
                        <button className="aup-btn" onClick={() => setRoleModal(false)}>Cancel</button>
                        <button className="aup-btn aup-btn--primary" onClick={submitRoleForm} disabled={saving}>
                            {saving ? 'Saving…' : editingRole ? 'Save Changes' : 'Create Role'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Add User to Role modal */}
            {addUserModal && (
                <Modal title={`Add User to ${selectedRole?.roleName}`} onClose={() => setAddUserModal(false)}>
                    <div className="aup-form">
                        <label>Search User</label>
                        <div style={{ position: 'relative' }}>
                            <input className="aup-input" placeholder="Type username…"
                                value={addUserQuery}
                                onChange={e => handleAddUserSearch(e.target.value)}
                                autoComplete="off"
                                autoFocus />
                            {addUserSearching && (
                                <div className="aup-user-search-hint">Searching…</div>
                            )}
                            {!addUserSelected && addUserResults.length > 0 && (
                                <div className="aup-user-search-dropdown">
                                    {addUserResults.map(u => (
                                        <div key={u.id} className="aup-user-search-item"
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={() => { setAddUserSelected(u); setAddUserQuery(u.username); setAddUserResults([]); }}>
                                            <strong>{u.username}</strong>
                                            <span className="aup-cell--muted"> #{u.id}</span>
                                            {u.email && <span className="aup-cell--muted"> · {u.email}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {addUserSelected && (
                            <div className="aup-user-search-selected">
                                <span>Selected: <strong>{addUserSelected.username}</strong> <span className="aup-cell--muted">#{addUserSelected.id}</span></span>
                                <button className="aup-user-chip-remove"
                                    onClick={() => { setAddUserSelected(null); setAddUserQuery(''); }}>×</button>
                            </div>
                        )}
                    </div>
                    {modalError && <div className="aup-error">{modalError}</div>}
                    <div className="aup-modal-footer">
                        <button className="aup-btn" onClick={() => setAddUserModal(false)}>Cancel</button>
                        <button className="aup-btn aup-btn--primary" onClick={submitAddUser}
                            disabled={saving || !addUserSelected}>
                            {saving ? 'Adding…' : 'Add User'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Operation Log (global)
// ══════════════════════════════════════════════════════════════════════════════

const ALL_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'BLACKLIST', 'UNBLACKLIST'];

function OperationLogSection({ token }) {
    const [subTab, setSubTab]       = useState('admin');
    const [adminLogs, setAdminLogs] = useState([]);
    const [loginLogs, setLoginLogs] = useState([]);
    const [loading, setLoading]     = useState(false);
    const [loaded, setLoaded]       = useState({ admin: false, login: false });

    // Admin ops filters
    const [dateFrom, setDateFrom]         = useState('');
    const [dateTo, setDateTo]             = useState('');
    const [activeActions, setActiveActions] = useState(new Set(ALL_ACTIONS));
    const [operatorKw, setOperatorKw]     = useState('');

    // User behavior filters
    const [lDateFrom, setLDateFrom] = useState('');
    const [lDateTo, setLDateTo]     = useState('');
    const [userKw, setUserKw]       = useState('');
    const [ipKw, setIpKw]           = useState('');
    const [resultFilter, setResultFilter] = useState('');

    async function loadAdminLogs() {
        if (loaded.admin) return;
        setLoading(true);
        try { setAdminLogs(await adminGetAllOperationLogs(token)); setLoaded(p => ({ ...p, admin: true })); }
        catch { } finally { setLoading(false); }
    }

    async function loadLoginLogs() {
        if (loaded.login) return;
        setLoading(true);
        try { setLoginLogs(await adminGetAllLoginLogs(token)); setLoaded(p => ({ ...p, login: true })); }
        catch { } finally { setLoading(false); }
    }

    useEffect(() => { loadAdminLogs(); }, []);

    function switchTab(t) {
        setSubTab(t);
        if (t === 'admin') loadAdminLogs();
        if (t === 'login') loadLoginLogs();
    }

    function toggleAction(action) {
        setActiveActions(prev => {
            const next = new Set(prev);
            next.has(action) ? next.delete(action) : next.add(action);
            return next;
        });
    }

    const dateRangeError  = dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo);
    const lDateRangeError = lDateFrom && lDateTo && new Date(lDateFrom) > new Date(lDateTo);

    // Filter admin logs
    const filteredAdmin = adminLogs.filter(l => {
        if (!activeActions.has(l.action)) return false;
        if (operatorKw && !l.operatorUsername?.toLowerCase().includes(operatorKw.toLowerCase())) return false;
        if (!dateRangeError) {
            if (dateFrom && new Date(l.createdAt) < new Date(dateFrom)) return false;
            if (dateTo   && new Date(l.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
        }
        return true;
    });

    // Filter login logs
    const filteredLogin = loginLogs.filter(l => {
        if (userKw && !l.username?.toLowerCase().includes(userKw.toLowerCase())) return false;
        if (ipKw   && !l.loginIp?.toLowerCase().includes(ipKw.toLowerCase())) return false;
        if (resultFilter === 'success' && !l.successFlag) return false;
        if (resultFilter === 'failed'  &&  l.successFlag) return false;
        if (!lDateRangeError) {
            if (lDateFrom && new Date(l.loginTime) < new Date(lDateFrom)) return false;
            if (lDateTo   && new Date(l.loginTime) > new Date(lDateTo + 'T23:59:59')) return false;
        }
        return true;
    });

    return (
        <div className="aup-section">
            <div className="aup-tabs" style={{ marginBottom: 0 }}>
                <button className={`aup-tab ${subTab === 'admin' ? 'aup-tab--active' : ''}`} onClick={() => switchTab('admin')}>Admin Operations</button>
                <button className={`aup-tab ${subTab === 'login' ? 'aup-tab--active' : ''}`} onClick={() => switchTab('login')}>User Behavior</button>
            </div>

            {/* Filter bar */}
            <div className="aup-log-filters">
                {subTab === 'admin' ? (
                    <>
                        <div className="aup-log-filter-row">
                            <div className="aup-log-filter-group">
                                <span className="aup-log-filter-label">Date</span>
                                <div className="aup-log-date-range">
                                    <input type="date" className={`aup-input aup-log-date${dateRangeError ? ' aup-input--error' : ''}`} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                                    <span className="aup-cell--muted">—</span>
                                    <input type="date" className={`aup-input aup-log-date${dateRangeError ? ' aup-input--error' : ''}`} value={dateTo} onChange={e => setDateTo(e.target.value)} />
                                </div>
                                {dateRangeError && <span className="aup-date-error">"From" must be before "To"</span>}
                            </div>
                            <div className="aup-log-filter-group">
                                <span className="aup-log-filter-label">Operator</span>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>🔍</span>
                                    <input className="aup-input" placeholder="Operator name…" value={operatorKw}
                                        onChange={e => setOperatorKw(e.target.value)}
                                        style={{ paddingLeft: 28, width: 180 }} />
                                </div>
                            </div>
                        </div>
                        <div className="aup-log-filter-group">
                            <span className="aup-log-filter-label">Action Type</span>
                            <div className="aup-log-action-toggles">
                                {ALL_ACTIONS.map(a => (
                                    <button key={a}
                                        className={`aup-log-action-btn ${activeActions.has(a) ? 'aup-log-action-btn--on' : ''}`}
                                        style={activeActions.has(a) ? ACTION_STYLES[a] : {}}
                                        onClick={() => toggleAction(a)}>
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="aup-log-filter-row">
                        <div className="aup-log-filter-group">
                            <span className="aup-log-filter-label">Date</span>
                            <div className="aup-log-date-range">
                                <input type="date" className={`aup-input aup-log-date${lDateRangeError ? ' aup-input--error' : ''}`} value={lDateFrom} onChange={e => setLDateFrom(e.target.value)} />
                                <span className="aup-cell--muted">—</span>
                                <input type="date" className={`aup-input aup-log-date${lDateRangeError ? ' aup-input--error' : ''}`} value={lDateTo} onChange={e => setLDateTo(e.target.value)} />
                            </div>
                            {lDateRangeError && <span className="aup-date-error">"From" must be before "To"</span>}
                        </div>
                        <div className="aup-log-filter-group">
                            <span className="aup-log-filter-label">Username</span>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>🔍</span>
                                <input className="aup-input" placeholder="Username…" value={userKw}
                                    onChange={e => setUserKw(e.target.value)}
                                    style={{ paddingLeft: 28, width: 150 }} />
                            </div>
                        </div>
                        <div className="aup-log-filter-group">
                            <span className="aup-log-filter-label">IP Address</span>
                            <input className="aup-input" placeholder="IP address…" value={ipKw}
                                onChange={e => setIpKw(e.target.value)} style={{ width: 150 }} />
                        </div>
                        <div className="aup-log-filter-group">
                            <span className="aup-log-filter-label">Result</span>
                            <select className="aup-filter" value={resultFilter} onChange={e => setResultFilter(e.target.value)}>
                                <option value="">All</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="aup-table-wrap" style={{ borderRadius: '0 8px 8px 8px' }}>
                {loading ? <div className="aup-placeholder">Loading…</div>
                    : subTab === 'admin'
                        ? <AdminOpsTable logs={filteredAdmin} />
                        : <LoginLogsTable logs={filteredLogin} showUser />}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Blacklist (global)
// ══════════════════════════════════════════════════════════════════════════════

function BlacklistSection({ token }) {
    const [entries, setEntries]         = useState([]);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');
    const [saving, setSaving]           = useState(null);
    const [keyword, setKeyword]         = useState('');
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        setLoading(true);
        adminGetAllBlacklist(token)
            .then(setEntries)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    async function unblacklist(entry) {
        if (!window.confirm(`Unblacklist "${entry.username}"?`)) return;
        setSaving(entry.id);
        try {
            await adminUnblacklistUser(token, entry.userId);
            setEntries(prev => prev.filter(e => e.userId !== entry.userId));
        } catch (e) { setActionError('Failed to remove user from blacklist. Please try again.'); }
        finally { setSaving(null); }
    }

    const kw = keyword.toLowerCase();
    const filtered = entries.filter(e =>
        e.username?.toLowerCase().includes(kw) ||
        e.reason?.toLowerCase().includes(kw) ||
        e.bannedBy?.toLowerCase().includes(kw)
    );

    const totalBanned = entries.length;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newlyBanned = entries.filter(e => e.bannedAt && new Date(e.bannedAt) >= sevenDaysAgo).length;

    return (
        <div className="aup-section">
            <ErrorBanner message={actionError} onClose={() => setActionError('')} />
            {/* Stats */}
            <div className="aup-bl-stats">
                <div className="aup-bl-stat">
                    <span className="aup-bl-stat-value">{totalBanned}</span>
                    <span className="aup-bl-stat-label">Total Banned</span>
                </div>
                <div className="aup-bl-stat aup-bl-stat--new">
                    <span className="aup-bl-stat-value">{newlyBanned}</span>
                    <span className="aup-bl-stat-label">New (last 7 days)</span>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ position: 'relative', width: 280 }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
                    <input className="aup-search" placeholder="Search username, reason, banned by…"
                        value={keyword} onChange={e => setKeyword(e.target.value)}
                        style={{ width: '100%', paddingLeft: 30, boxSizing: 'border-box' }} />
                </div>
            </div>
            {error && <div className="aup-error" style={{ padding: '8px 0' }}>{error}</div>}
            <div className="aup-table-wrap">
                {loading ? <div className="aup-placeholder">Loading…</div>
                    : filtered.length === 0 ? <div className="aup-placeholder">{keyword ? 'No results match your search.' : 'No blacklisted users.'}</div>
                    : (
                        <table className="aup-table">
                            <thead><tr>
                                <th>ID</th><th>Username</th><th>Status</th>
                                <th>Reason</th><th>Banned By</th><th>Banned At</th><th></th>
                            </tr></thead>
                            <tbody>
                            {filtered.map(e => (
                                <tr key={e.id} className="aup-row aup-row--static">
                                    <td className="aup-cell--muted">{e.userId}</td>
                                    <td><strong>{e.username}</strong></td>
                                    <td><StatusBadge status={e.status} /></td>
                                    <td>{e.reason || '—'}</td>
                                    <td className="aup-cell--muted">{e.bannedBy || '—'}</td>
                                    <td className="aup-cell--muted">{e.bannedAt ? new Date(e.bannedAt).toLocaleString() : '—'}</td>
                                    <td>
                                        <button className="aup-btn aup-btn--sm aup-btn--success"
                                            disabled={saving === e.id}
                                            onClick={() => unblacklist(e)}>
                                            {saving === e.id ? '…' : 'Unblacklist'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}

// ── Shared tab content components ─────────────────────────────────────────────

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

function AdminOpsTable({ logs }) {
    if (!logs.length) return <div className="aup-placeholder">No records.</div>;
    return (
        <table className="aup-table aup-table--compact">
            <thead><tr>
                <th>Time</th><th>Operator</th><th>Target</th><th>Action</th><th>Detail</th>
            </tr></thead>
            <tbody>
            {logs.map(l => (
                <tr key={l.id} className="aup-row aup-row--static">
                    <td className="aup-cell--muted">{l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}</td>
                    <td>{l.operatorUsername}</td>
                    <td className="aup-cell--muted">{l.targetUsername || '—'}</td>
                    <td><ActionBadge action={l.action} /></td>
                    <td className="aup-cell--muted">{l.detail || '—'}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

function LoginLogsTable({ logs, showUser }) {
    if (!logs.length) return <div className="aup-placeholder">No login records.</div>;
    return (
        <table className="aup-table aup-table--compact">
            <thead><tr>
                <th>Time</th>{showUser && <th>User</th>}<th>IP</th><th>Device</th><th>Result</th>
            </tr></thead>
            <tbody>
            {logs.map(l => (
                <tr key={l.id} className="aup-row aup-row--static">
                    <td className="aup-cell--muted">{l.loginTime ? new Date(l.loginTime).toLocaleString() : '—'}</td>
                    {showUser && <td>{l.username || '—'}</td>}
                    <td className="aup-cell--muted">{l.loginIp || '—'}</td>
                    <td className="aup-cell--muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.deviceInfo || '—'}</td>
                    <td>{l.successFlag
                        ? <span style={{ color: '#2e7d32', fontWeight: 600 }}>✓ Success</span>
                        : <span style={{ color: '#c62828', fontWeight: 600 }}>✗ Failed</span>}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}
