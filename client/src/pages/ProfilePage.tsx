import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyProfile, updateMyProfile } from '@/services/userService';
import type { ProfileData } from '@/services/userService';

/**
 * Shared profile page for Student and Faculty users.
 * Renders the user's base info + role-specific profile fields.
 * Supports inline editing.
 */
const ProfilePage: React.FC = () => {
    const { accessToken, user } = useAuth();
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (!accessToken) return;
        const load = async () => {
            try {
                const data = await fetchMyProfile(accessToken);
                setProfileData(data);
                // Flatten user + profile fields for the edit form
                setForm({
                    name: data.user.name,
                    department: (data.profile as any)?.department || '',
                    designation: (data.profile as any)?.designation || '',
                    semester: String((data.profile as any)?.semester || ''),
                    bio: (data.profile as any)?.bio || '',
                });
            } catch (e: any) {
                showToast(e.message || 'Failed to load profile.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [accessToken]);

    const handleSave = async () => {
        if (!accessToken) return;
        setIsSaving(true);
        try {
            const updated = await updateMyProfile(accessToken, form as Record<string, unknown>);
            setProfileData(updated);
            setIsEditing(false);
            showToast('Profile updated successfully.');
        } catch (e: any) {
            showToast(e.message || 'Update failed.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div style={styles.loading}>Loading profile...</div>;
    if (!profileData) return <div style={styles.loading}>Profile not found.</div>;

    const { user: u, profile } = profileData;
    const p = profile as any;
    const isStudent = user?.role === 'student';
    const isFaculty = user?.role === 'faculty';

    return (
        <div style={styles.page}>
            {/* Toast */}
            {toast && (
                <div style={{ ...styles.toast, background: toast.type === 'error' ? '#fee2e2' : '#d1fae5', color: toast.type === 'error' ? '#991b1b' : '#065f46' }}>
                    {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
                </div>
            )}

            {/* Profile Hero Card */}
            <div style={styles.heroCard}>
                <div style={styles.avatarLarge}>{u.name.charAt(0).toUpperCase()}</div>
                <div>
                    <h1 style={styles.heroName}>{u.name}</h1>
                    <p style={styles.heroEmail}>{u.email}</p>
                    <span style={{ ...styles.roleBadge }}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                </div>
                <button
                    style={{ ...styles.editBtn, marginLeft: 'auto' }}
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : isEditing ? '✅ Save Profile' : '✏️ Edit Profile'}
                </button>
                {isEditing && (
                    <button style={styles.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                )}
            </div>

            {/* Details Cards */}
            <div style={styles.grid}>
                {/* Personal Info */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Personal Information</h3>
                    <InfoRow label="Full Name" value={isEditing ? (
                        <input style={styles.editInput} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    ) : u.name} />
                    <InfoRow label="Email Address" value={u.email} />
                    <InfoRow label="Role" value={u.role} />
                    <InfoRow label="Account Status" value={u.isActive ? '🟢 Active' : '🔴 Inactive'} />
                    <InfoRow label="Last Login" value={u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'N/A'} />
                </div>

                {/* Role-specific Profile */}
                {(isStudent || isFaculty) && profile && (
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>
                            {isStudent ? 'Academic Details' : 'Faculty Details'}
                        </h3>
                        {isStudent && (
                            <>
                                <InfoRow label="Roll Number" value={p.rollNumber} />
                                <InfoRow label="Department" value={isEditing ? (
                                    <input style={styles.editInput} value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                                ) : p.department} />
                                <InfoRow label="Semester" value={isEditing ? (
                                    <input style={styles.editInput} type="number" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} />
                                ) : String(p.semester)} />
                                <InfoRow label="Batch Year" value={String(p.batchYear)} />
                            </>
                        )}
                        {isFaculty && (
                            <>
                                <InfoRow label="Employee ID" value={p.employeeId} />
                                <InfoRow label="Department" value={isEditing ? (
                                    <input style={styles.editInput} value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                                ) : p.department} />
                                <InfoRow label="Designation" value={isEditing ? (
                                    <input style={styles.editInput} value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} />
                                ) : p.designation} />
                            </>
                        )}
                    </div>
                )}

                {/* Bio */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Bio</h3>
                    {isEditing ? (
                        <textarea
                            style={{ ...styles.editInput, height: 80, resize: 'vertical' }}
                            value={form.bio}
                            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                            placeholder="Write something about yourself..."
                        />
                    ) : (
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                            {p?.bio || 'No bio added yet.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const InfoRow: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 14, color: 'var(--text-main)', fontWeight: 400 }}>{value}</span>
    </div>
);

const styles: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', maxWidth: 900, margin: '0 auto', fontFamily: "'Inter', sans-serif", position: 'relative' },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', fontSize: 16 },
    heroCard: { display: 'flex', alignItems: 'center', gap: 20, background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem', color:'var(--card-bg)', flexWrap: 'wrap' },
    avatarLarge: { width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, flexShrink: 0 },
    heroName: { fontSize: 22, fontWeight: 700, margin: 0 },
    heroEmail: { color: '#a5b4fc', fontSize: 14, margin: '4px 0' },
    roleBadge: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 600 },
    editBtn: { padding: '10px 18px', borderRadius: 8, border: 'none', background:'var(--card-bg)', color: 'var(--primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    cancelBtn: { padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color:'var(--card-bg)', cursor: 'pointer', fontSize: 13 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' },
    card: { background:'var(--card-bg)', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    cardTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 1rem' },
    editInput: { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
    toast: { position: 'fixed', top: 20, right: 20, padding: '12px 20px', borderRadius: 10, border: '1px solid', fontSize: 14, fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
};

export default ProfilePage;
