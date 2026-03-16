import React from 'react';
import type { CourseMaterial } from '@/services/lmsService';

interface MaterialCardProps {
    material: CourseMaterial;
    isFaculty?: boolean;
    onDelete?: (id: string) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, isFaculty, onDelete }) => {
    
    const getIconSvg = (type: string) => {
        if (type === 'ppt') return '📊';
        if (type === 'video') return '🎥';
        if (type === 'notes') return '📝';
        return '📄';
    };

    return (
        <div style={styles.card}>
            <div style={styles.iconBox}>{getIconSvg(material.type)}</div>
            <div style={styles.content}>
                <h4 style={styles.title}>{material.title}</h4>
                {material.description && <p style={styles.desc}>{material.description}</p>}
                <div style={styles.meta}>
                    <span style={styles.date}>{new Date(material.uploadedAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div style={styles.actions}>
                <a href={material.fileUrl} target="_blank" rel="noreferrer" style={styles.downloadBtn}>
                    Download
                </a>
                {isFaculty && onDelete && (
                    <button style={styles.deleteBtn} onClick={() => onDelete(material._id)}>
                        🗑️
                    </button>
                )}
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    card: { display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1rem', gap: 16, transition: 'box-shadow 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    iconBox: { width: 48, height: 48, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 },
    content: { flex: 1 },
    title: { margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#111827' },
    desc: { margin: '0 0 8px', fontSize: 14, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
    meta: { display: 'flex', gap: 12, fontSize: 12, color: '#9ca3af' },
    date: { fontWeight: 500 },
    actions: { display: 'flex', gap: 8, alignItems: 'center' },
    downloadBtn: { textDecoration: 'none', padding: '6px 12px', background: '#eff6ff', color: '#1d4ed8', fontSize: 13, fontWeight: 600, borderRadius: 6 },
    deleteBtn: { padding: '6px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 13 }
};

export default MaterialCard;
