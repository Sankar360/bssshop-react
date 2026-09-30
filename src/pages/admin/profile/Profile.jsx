// src/pages/admin/profile/Profile.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
    PersonCircle, Camera, Pencil, Lock, Sliders, Gear, Globe, Clock,
    Palette, Bell, ExclamationTriangle, Trash, Save, Key,
} from 'react-bootstrap-icons';
import { showToast } from '../../../components/admin/layouts/Footer';
import API_URL from '../../../api/config';                             // ← add
import { productImage as imageUrl } from '../../../utils/productImage'; // ← use shared hel

const API_BASE = API_URL + '/admin';                                    // ← absolute, no env var
const getToken = () => localStorage.getItem('auth_token') || '';
const authHeaders = (json = true) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const formatDate = (s) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

const Profile = () => {
    const fileInputRef = useRef(null);

    const [user, setUser] = useState({
        name: 'Admin',
        email: '',
        phone: '',
        avatar: '',
        status: 'active',
        role: 'admin',
        created_at: null,
    });
    const [stats, setStats] = useState({
        total_orders: 0,
        total_spent: 0,
        last_login: 'N/A',
    });

    const [languages, setLanguages] = useState([]);
    const [timezones, setTimezones] = useState([]);
    const [themes, setThemes] = useState([]);
    const [preferences, setPreferences] = useState({
        language: 'en',
        timezone: 'UTC',
        theme: 'light',
        notifications: 'on',
        newsletter: false,
    });

    const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({
        profile: false,
        password: false,
        preferences: false,
    });

    /* -------------------------------------------------------------- */
    /*  Initial load                                                   */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            try {
                const [profRes, langRes, tzRes, themesRes, prefRes] = await Promise.all([
                    fetch(`${API_BASE}/profile`, { headers: authHeaders(false) }),
                    fetch(`${API_BASE}/profile/languages`, { headers: authHeaders(false) }),
                    fetch(`${API_BASE}/profile/timezones`, { headers: authHeaders(false) }),
                    fetch(`${API_BASE}/profile/themes`, { headers: authHeaders(false) }),
                    fetch(`${API_BASE}/profile/preferences`, { headers: authHeaders(false) }),
                ]);

                const [prof, lang, tz, themes, pref] = await Promise.all([
                    profRes.json(), langRes.json(), tzRes.json(), themesRes.json(), prefRes.json(),
                ]);

                if (prof.success) {
                    const u = prof.data.user || prof.data;
                    setUser({
                        name: u.name || 'Admin',
                        email: u.email || '',
                        phone: u.phone || '',
                        avatar: u.avatar || u.avatar_url || '',
                        status: u.status || 'active',
                        role: u.role || 'admin',
                        created_at: u.created_at || null,
                    });
                    setProfileForm({
                        name: u.name || '',
                        email: u.email || '',
                        phone: u.phone || '',
                    });
                    setStats({
                        total_orders: prof.data.stats?.total_orders ?? 0,
                        total_spent: prof.data.stats?.total_spent ?? 0,
                        last_login: prof.data.stats?.last_login ?? 'N/A',
                    });
                }

                if (lang.success) setLanguages(lang.data.languages || lang.data || []);
                if (tz.success) setTimezones(tz.data.timezones || tz.data || []);
                if (themes.success) setThemes(themes.data.themes || themes.data || []);
                if (pref.success) {
                    const p = pref.data.preferences || pref.data;
                    setPreferences({
                        language: p.language || 'en',
                        timezone: p.timezone || 'UTC',
                        theme: p.theme || 'light',
                        notifications: p.notifications || 'on',
                        newsletter: !!p.newsletter,
                    });
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load profile', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* -------------------------------------------------------------- */
    /*  Handlers                                                       */
    /* -------------------------------------------------------------- */
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm((f) => ({ ...f, [name]: value }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        if (errors.avatar) setErrors((er) => ({ ...er, avatar: null }));
    };

    const submitProfile = async (e) => {
        e.preventDefault();
        setSaving((s) => ({ ...s, profile: true }));
        setErrors({});

        const fd = new FormData();
        fd.append('name', profileForm.name);
        fd.append('email', profileForm.email);
        fd.append('phone', profileForm.phone || '');
        if (avatarFile) fd.append('avatar', avatarFile);

        try {
            const res = await fetch(`${API_BASE}/profile/update`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: fd,
            });
            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                showToast('Please fix the errors', 'error');
                return;
            }
            const data = await res.json();
            if (data.success) {
                showToast('Profile updated successfully', 'success');
                const u = data.data.user || data.data;
                setUser((prev) => ({
                    ...prev,
                    name: u.name || prev.name,
                    email: u.email || prev.email,
                    phone: u.phone || prev.phone,
                    avatar: u.avatar || prev.avatar,
                }));
                // Persist to localStorage for header
                const stored = JSON.parse(localStorage.getItem('admin_user') || '{}');
                localStorage.setItem('admin_user', JSON.stringify({
                    ...stored,
                    name: u.name || stored.name,
                    email: u.email || stored.email,
                }));
                setAvatarFile(null);
            } else {
                showToast(data.message || 'Failed to update profile', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred', 'error');
        } finally {
            setSaving((s) => ({ ...s, profile: false }));
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((f) => ({ ...f, [name]: value }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
    };

    const submitPassword = async (e) => {
        e.preventDefault();
        setSaving((s) => ({ ...s, password: true }));
        setErrors({});

        try {
            const res = await fetch(`${API_BASE}/profile/change-password`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(passwordForm),
            });
            if (res.status === 422) {
                const data = await res.json();
                setErrors(data.errors || {});
                showToast('Please fix the errors', 'error');
                return;
            }
            const data = await res.json();
            if (data.success) {
                showToast('Password changed successfully', 'success');
                setPasswordForm({
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                });
            } else {
                showToast(data.message || 'Failed to change password', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred', 'error');
        } finally {
            setSaving((s) => ({ ...s, password: false }));
        }
    };

    const handlePrefChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPreferences((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    };

    const submitPreferences = async (e) => {
        e.preventDefault();
        setSaving((s) => ({ ...s, preferences: true }));

        const payload = {
            language: preferences.language,
            timezone: preferences.timezone,
            theme: preferences.theme,
            notifications: preferences.notifications,
            newsletter: preferences.newsletter ? 1 : 0,
        };

        try {
            const res = await fetch(`${API_BASE}/profile/update-preferences`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Preferences saved', 'success');
                // Apply theme immediately
                document.body.className = preferences.theme === 'dark' ? 'dark-theme' : '';
                localStorage.setItem('user_theme', preferences.theme);
                localStorage.setItem('user_language', preferences.language);
            } else {
                showToast(data.message || 'Failed to save', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred', 'error');
        } finally {
            setSaving((s) => ({ ...s, preferences: false }));
        }
    };

    const deleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
        if (!window.confirm('This is your LAST warning. Delete account permanently?')) return;

        try {
            const res = await fetch(`${API_BASE}/profile/delete-account`, {
                method: 'POST',
                headers: authHeaders(),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Account deleted', 'success');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('admin_user');
                setTimeout(() => (window.location.href = '/admin/login'), 600);
            } else {
                showToast(data.message || 'Failed to delete account', 'error');
            }
        } catch {
            showToast('An error occurred', 'error');
        }
    };

    const avatarSrc = avatarPreview || (user.avatar ? imageUrl(user.avatar) : '');
    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <PersonCircle className="text-primary me-2" /> My Profile
                </h2>
            </div>

            <div className="row">
                {/* Left Column */}
                <div className="col-md-4">
                    {/* Profile Card */}
                    <div className="card">
                        <div className="card-body text-center">
                            <div className="position-relative d-inline-block">
                                {avatarSrc ? (
                                    <img
                                        src={avatarSrc}
                                        alt="Avatar"
                                        className="rounded-circle"
                                        style={{
                                            width: 150,
                                            height: 150,
                                            objectFit: 'cover',
                                            border: '3px solid #4e73df',
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto"
                                        style={{
                                            width: 150,
                                            height: 150,
                                            fontSize: '3rem',
                                            border: '3px solid #4e73df',
                                        }}
                                    >
                                        {(user.name || 'AD').substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle"
                                    style={{ width: 35, height: 35 }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    id="avatarInput"
                                    name="avatar"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleAvatarChange}
                                />
                            </div>

                            <h4 className="mt-3">{user.name}</h4>
                            <p className="text-muted">{user.email}</p>
                            <p>
                                <span className={`badge bg-${user.status === 'active' ? 'success' : 'danger'}`}>
                                    {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                                </span>{' '}
                                <span className="badge bg-info">
                                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                                </span>
                            </p>

                            <hr />

                            <div className="row text-start">
                                <div className="col-6">
                                    <small className="text-muted">Member Since</small>
                                    <p className="mb-0">{formatDate(user.created_at)}</p>
                                </div>
                                <div className="col-6">
                                    <small className="text-muted">Last Login</small>
                                    <p className="mb-0">{stats.last_login}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="card mt-3">
                        <div className="card-body">
                            <h6 className="card-title">Account Statistics</h6>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Total Orders</span>
                                <span className="fw-bold">{stats.total_orders}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Total Spent</span>
                                <span className="fw-bold text-primary">
                                    ${Number(stats.total_spent).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-md-8">
                    {/* Edit Profile */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0"><Pencil /> Edit Profile</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={submitProfile} noValidate>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            value={profileForm.name}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            value={profileForm.email}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                    </div>
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                            value={profileForm.phone}
                                            onChange={handleProfileChange}
                                        />
                                        {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                                    </div>
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Profile Picture</label>
                                        <input
                                            type="file"
                                            className={`form-control ${errors.avatar ? 'is-invalid' : ''}`}
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />
                                        {errors.avatar && <div className="invalid-feedback">{errors.avatar}</div>}
                                        <div className="form-text">
                                            Upload a new profile picture (JPEG, PNG, GIF). Max size: 2MB.
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={saving.profile}>
                                    {saving.profile ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="me-1" /> Update Profile
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="card mt-4">
                        <div className="card-header">
                            <h5 className="mb-0"><Lock /> Change Password</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={submitPassword} noValidate>
                                <div className="mb-3">
                                    <label className="form-label">Current Password</label>
                                    <input
                                        type="password"
                                        name="current_password"
                                        className={`form-control ${errors.current_password ? 'is-invalid' : ''}`}
                                        value={passwordForm.current_password}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                    {errors.current_password && (
                                        <div className="invalid-feedback">{errors.current_password}</div>
                                    )}
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">New Password</label>
                                        <input
                                            type="password"
                                            name="new_password"
                                            minLength="8"
                                            className={`form-control ${errors.new_password ? 'is-invalid' : ''}`}
                                            value={passwordForm.new_password}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                        <div className="form-text">Password must be at least 8 characters long.</div>
                                        {errors.new_password && (
                                            <div className="invalid-feedback d-block">{errors.new_password}</div>
                                        )}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Confirm New Password</label>
                                        <input
                                            type="password"
                                            name="confirm_password"
                                            className={`form-control ${errors.confirm_password ? 'is-invalid' : ''}`}
                                            value={passwordForm.confirm_password}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                        {errors.confirm_password && (
                                            <div className="invalid-feedback">{errors.confirm_password}</div>
                                        )}
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-warning" disabled={saving.password}>
                                    {saving.password ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Key className="me-1" /> Change Password
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="card mt-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0"><Sliders /> Preferences</h5>
                            {user.role === 'admin' && (
                                <a href="/admin/settings/preferences" className="btn btn-sm btn-outline-primary">
                                    <Gear className="me-1" /> Manage Options
                                </a>
                            )}
                        </div>
                        <div className="card-body">
                            <form onSubmit={submitPreferences}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label"><Globe className="me-1" /> Language</label>
                                        <select
                                            className="form-select"
                                            name="language"
                                            value={preferences.language}
                                            onChange={handlePrefChange}
                                        >
                                            {languages.length ? (
                                                languages.map((lang) => (
                                                    <option key={lang.code} value={lang.code}>
                                                        {lang.flag || '🌍'} {lang.native_name || lang.name} ({lang.name})
                                                    </option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="en">🇬🇧 English</option>
                                                    <option value="es">🇪🇸 Español</option>
                                                    <option value="fr">🇫🇷 Français</option>
                                                    <option value="de">🇩🇪 Deutsch</option>
                                                </>
                                            )}
                                        </select>
                                        <small className="text-muted">Select your preferred language</small>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label"><Clock className="me-1" /> Timezone</label>
                                        <select
                                            className="form-select"
                                            name="timezone"
                                            value={preferences.timezone}
                                            onChange={handlePrefChange}
                                        >
                                            {timezones.length ? (
                                                timezones.map((tz) => (
                                                    <option key={tz.name} value={tz.name}>
                                                        {tz.abbreviation || tz.name} ({tz.offset || '00:00'}) — {tz.name}
                                                    </option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="UTC">UTC</option>
                                                    <option value="America/New_York">EST (New York)</option>
                                                    <option value="America/Chicago">CST (Chicago)</option>
                                                    <option value="America/Denver">MST (Denver)</option>
                                                    <option value="America/Los_Angeles">PST (Los Angeles)</option>
                                                </>
                                            )}
                                        </select>
                                        <small className="text-muted">Select your timezone</small>
                                    </div>
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label"><Palette className="me-1" /> Theme</label>
                                        <select
                                            className="form-select"
                                            name="theme"
                                            value={preferences.theme}
                                            onChange={handlePrefChange}
                                        >
                                            {themes.length ? (
                                                themes.map((t) => (
                                                    <option key={t.name} value={t.name}>
                                                        {t.display_name}
                                                        {t.description ? ` — ${t.description}` : ''}
                                                    </option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="light">Light</option>
                                                    <option value="dark">Dark</option>
                                                    <option value="auto">Auto</option>
                                                    <option value="blue">Blue</option>
                                                    <option value="green">Green</option>
                                                </>
                                            )}
                                        </select>
                                        <small className="text-muted">Choose your preferred theme</small>
                                    </div>
                                </div>
                                <hr />

                                <div className="mb-3">
                                    <label className="form-label fw-bold"><Bell className="me-1" /> Notifications</label>
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="notifications"
                                            name="notifications"
                                            checked={preferences.notifications === 'on'}
                                            onChange={(e) =>
                                                setPreferences((p) => ({
                                                    ...p,
                                                    notifications: e.target.checked ? 'on' : 'off',
                                                }))
                                            }
                                        />
                                        <label className="form-check-label" htmlFor="notifications">
                                            Email Notifications
                                            <small className="text-muted d-block">
                                                Receive email notifications about your account activity
                                            </small>
                                        </label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="newsletter"
                                            name="newsletter"
                                            checked={preferences.newsletter}
                                            onChange={(e) =>
                                                setPreferences((p) => ({
                                                    ...p,
                                                    newsletter: e.target.checked,
                                                }))
                                            }
                                        />
                                        <label className="form-check-label" htmlFor="newsletter">
                                            Subscribe to Newsletter
                                            <small className="text-muted d-block">
                                                Receive product updates, promotions, and news
                                            </small>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving.preferences}
                                >
                                    {saving.preferences ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="me-1" /> Save Preferences
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="card mt-4 border-danger">
                        <div className="card-header bg-danger text-white">
                            <h5 className="mb-0">
                                <ExclamationTriangle className="me-1" /> Danger Zone
                            </h5>
                        </div>
                        <div className="card-body">
                            <p className="text-muted">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                            <button className="btn btn-danger" onClick={deleteAccount}>
                                <Trash className="me-1" /> Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;