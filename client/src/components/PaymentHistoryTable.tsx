import React from 'react';
import type { Payment } from '@/services/financeService';

interface PaymentHistoryTableProps {
    payments: Payment[];
    isAdminView?: boolean;
}

const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({ payments, isAdminView }) => {
    if (!payments || payments.length === 0) {
        return <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>No payments found.</div>;
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Date</th>
                        {isAdminView && <th style={styles.th}>Student</th>}
                        <th style={styles.th}>Transaction ID</th>
                        <th style={styles.th}>Method</th>
                        <th style={styles.th}>Amount</th>
                        <th style={styles.th}>Receipt</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.map(p => (
                        <tr key={p._id} style={styles.tr}>
                            <td style={styles.td}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                            {isAdminView && (
                                <td style={styles.td}>{p.student?.user?.name || 'N/A'}</td>
                            )}
                            <td style={styles.td}><span style={styles.txnId}>{p.transactionId}</span></td>
                            <td style={styles.td}>{p.method.replace('_', ' ').toUpperCase()}</td>
                            <td style={{ ...styles.td, fontWeight: 600, color: '#16a34a' }}>${p.amount.toFixed(2)}</td>
                            <td style={styles.td}>
                                <button style={styles.downloadBtn} onClick={() => alert('Downloading receipt PDF...')}>
                                    Download
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' },
    th: { backgroundColor: '#f9fafb', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: 12 },
    tr: { borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s' },
    td: { padding: '16px', color: '#374151', verticalAlign: 'middle' },
    txnId: { background: '#f3f4f6', padding: '4px 8px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: '#4b5563' },
    downloadBtn: { background: 'none', border: 'none', color: '#4f46e5', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }
};

export default PaymentHistoryTable;
