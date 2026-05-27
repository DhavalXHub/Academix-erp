import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { submitQRScan, getActiveSessions } from '@/services/qrAttendanceService';
import { fetchMyAttendance } from '@/services/attendanceService';
import type { ScanResult, QRSession } from '@/services/qrAttendanceService';
import type { StudentAttendanceData } from '@/services/attendanceService';

type ScanState = 'idle' | 'processing' | 'success' | 'error';

/* ── jsQR loaded once from CDN (no npm install needed) ── */
declare const jsQR: any;
let jsQRLoaded = false;
const loadJsQR = (): Promise<void> =>
    new Promise((res, rej) => {
        if (jsQRLoaded || typeof jsQR !== 'undefined') { jsQRLoaded = true; return res(); }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
        s.onload = () => { jsQRLoaded = true; res(); };
        s.onerror = rej;
        document.head.appendChild(s);
    });

const StudentQRScannerPage: React.FC = () => {
    const { accessToken } = useAuth();
    const { socket } = useSocket();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [tab, setTab] = useState<'scanner' | 'history'>('scanner');
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [result, setResult] = useState<ScanResult | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [activeSessions, setActiveSessions] = useState<QRSession[]>([]);
    const [attendanceData, setAttendanceData] = useState<StudentAttendanceData | null>(null);
    const [scanMode, setScanMode] = useState<'camera' | 'upload'>('upload');

    /* ── data loading ── */
    useEffect(() => {
        if (!accessToken) return;
        getActiveSessions(accessToken).then(r => setActiveSessions(r.sessions)).catch(() => {});
        fetchMyAttendance(accessToken).then(setAttendanceData).catch(() => {});
    }, [accessToken]);

    /* ── socket: session events ── */
    useEffect(() => {
        if (!socket) return;
        const refresh = () => {
            if (accessToken) {
                getActiveSessions(accessToken).then(r => setActiveSessions(r.sessions)).catch(() => {});
                fetchMyAttendance(accessToken).then(setAttendanceData).catch(() => {});
            }
        };
        socket.on('qr_session_started', refresh);
        socket.on('qr_session_ended', refresh);
        return () => { socket.off('qr_session_started', refresh); socket.off('qr_session_ended', refresh); };
    }, [socket, accessToken]);

    /* ── cleanup camera on unmount ── */
    useEffect(() => () => stopCamera(), []);

    /* ── submit token to backend ── */
    const processToken = async (token: string) => {
        stopCamera();
        setScanState('processing');
        try {
            const r = await submitQRScan(accessToken!, token);
            setResult(r.result);
            setScanState('success');
            if (accessToken) {
                fetchMyAttendance(accessToken).then(setAttendanceData).catch(() => {});
                getActiveSessions(accessToken).then(r2 => setActiveSessions(r2.sessions)).catch(() => {});
            }
        } catch (e: any) {
            setErrorMsg(e.message || 'Failed to mark attendance.');
            setScanState('error');
        }
    };

    /* ── CAMERA scanning with jsQR ── */
    const startCamera = async () => {
        // Check browser support first
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setErrorMsg('Your browser does not support camera access. Please use image upload instead.');
            setScanState('error');
            return;
        }
        try {
            await loadJsQR();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            const video = videoRef.current;
            if (video) {
                video.srcObject = stream;
                // autoPlay may not fire in all browsers — call play() explicitly
                video.onloadedmetadata = () => {
                    video.play().then(() => {
                        setCameraActive(true);
                        doScanFrame();
                    }).catch(err => {
                        setErrorMsg('Could not start video: ' + err.message);
                        setScanState('error');
                    });
                };
            } else {
                setErrorMsg('Video element not ready. Please try again.');
                setScanState('error');
            }
        } catch (err: any) {
            const msg = err?.name === 'NotAllowedError'
                ? 'Camera permission denied. Please allow camera access in your browser settings.'
                : err?.name === 'NotFoundError'
                ? 'No camera found on this device. Please use image upload.'
                : 'Camera error: ' + (err?.message || 'Unknown error');
            setErrorMsg(msg);
            setScanState('error');
        }
    };

    const stopCamera = () => {
        cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setCameraActive(false);
    };

    const doScanFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !streamRef.current) return;
        if (video.paused || video.ended) { rafRef.current = requestAnimationFrame(doScanFrame); return; }
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            try {
                const code = (window as any).jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
                if (code?.data) { processToken(code.data); return; }
            } catch { /* jsQR not ready yet */ }
        }
        rafRef.current = requestAnimationFrame(doScanFrame);
    };

    /* ── IMAGE UPLOAD scanning ── */
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setScanState('processing');
        try {
            await loadJsQR();
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(url);
                const code = jsQR(imageData.data, canvas.width, canvas.height);
                if (code?.data) {
                    processToken(code.data);
                } else {
                    setErrorMsg('No valid QR code found in the image. Try a clearer photo.');
                    setScanState('error');
                }
            };
            img.onerror = () => { setErrorMsg('Could not load image.'); setScanState('error'); };
            img.src = url;
        } catch (err: any) {
            setErrorMsg('QR library failed to load. Check your internet connection.');
            setScanState('error');
        }
        // Reset file input so same file can be re-selected
        e.target.value = '';
    };

    const reset = () => {
        setScanState('idle');
        setResult(null);
        setErrorMsg('');
        stopCamera();
    };

    return (
        <div style={st.page}>
            {/* Header */}
            <div style={st.header}>
                <div>
                    <h1 style={st.title}>📱 QR Attendance</h1>
                    <p style={st.sub}>Scan your class QR code to mark attendance instantly</p>
                </div>
                {activeSessions.length > 0 && (
                    <div style={st.liveTag}>
                        <span style={st.dot} /> {activeSessions.length} Live Session{activeSessions.length > 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={st.tabs}>
                <button style={{ ...st.tab, ...(tab === 'scanner' ? st.tabOn : {}) }} onClick={() => setTab('scanner')}>📷 Scan QR</button>
                <button style={{ ...st.tab, ...(tab === 'history' ? st.tabOn : {}) }} onClick={() => setTab('history')}>📊 My Attendance</button>
            </div>

            {/* ── SCANNER TAB ── */}
            {tab === 'scanner' && (
                <div>
                    {/* Active sessions banner */}
                    {activeSessions.length > 0 && (
                        <div style={st.banner}>
                            <div style={{ fontWeight: 700, color: '#6ee7b7', marginBottom: 6 }}>🔔 Active Sessions — Scan Now!</div>
                            {activeSessions.map(s => (
                                <div key={s._id} style={st.sessionRow}>
                                    <strong style={{ color: '#a5f3fc' }}>{s.course.code}</strong>
                                    <span style={{ color: '#94a3b8' }}> — {s.course.title}</span>
                                    <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>
                                        by {s.faculty.name} · expires {new Date(s.expiresAt).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={st.card}>
                        {/* IDLE STATE */}
                        {scanState === 'idle' && (
                            <div>
                                {/* Mode toggle */}
                                <div style={st.modeRow}>
                                    <button style={{ ...st.modeBtn, ...(scanMode === 'upload' ? st.modeBtnOn : {}) }}
                                        onClick={() => { setScanMode('upload'); stopCamera(); }}>
                                        🖼️ Upload QR Image
                                    </button>
                                    <button style={{ ...st.modeBtn, ...(scanMode === 'camera' ? st.modeBtnOn : {}) }}
                                        onClick={() => { setScanMode('camera'); }}>
                                        📷 Use Camera
                                    </button>
                                </div>

                                {/* UPLOAD MODE */}
                                {scanMode === 'upload' && (
                                    <div style={st.uploadArea} onClick={() => fileInputRef.current?.click()}>
                                        <div style={{ fontSize: 52 }}>📸</div>
                                        <h3 style={{ color: '#94a3b8', margin: '12px 0 4px' }}>Upload QR Code Image</h3>
                                        <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>
                                            Take a screenshot of the faculty QR code and upload it here
                                        </p>
                                        <button style={st.uploadBtn}>Choose Image / Photo</button>
                                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                    </div>
                                )}

                                {/* CAMERA MODE */}
                                {scanMode === 'camera' && (
                                    <div style={{ textAlign: 'center' }}>
                                        {!cameraActive ? (
                                            <div style={st.cameraIdle}>
                                                <div style={{ fontSize: 52 }}>📷</div>
                                                <button style={st.uploadBtn} onClick={startCamera}>Start Camera Scanner</button>
                                            </div>
                                        ) : (
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                {/* autoPlay is crucial — without it stream won't render */}
                                                <video ref={videoRef} style={st.video} autoPlay muted playsInline />
                                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                                                <div style={st.scanFrame} />
                                                <p style={{ color: '#6ee7b7', fontSize: 13, marginTop: 8 }}>Point at the QR code</p>
                                                <button style={{ ...st.uploadBtn, background: '#7f1d1d', color: '#fca5a5', marginTop: 4 }} onClick={stopCamera}>
                                                    Stop Camera
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PROCESSING */}
                        {scanState === 'processing' && (
                            <div style={st.center}>
                                <div style={st.spinner}>⌛</div>
                                <p style={{ color: '#94a3b8', marginTop: 12 }}>Validating attendance with server...</p>
                            </div>
                        )}

                        {/* SUCCESS */}
                        {scanState === 'success' && result && (
                            <div style={st.center}>
                                <div style={st.successCircle}>✓</div>
                                <h2 style={{ color: '#6ee7b7', margin: '16px 0 4px' }}>Attendance Marked!</h2>
                                <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px' }}>Your attendance has been recorded successfully</p>
                                <div style={st.resultGrid}>
                                    <Row label="📚 Course" value={`${result.session.course.code} — ${result.session.course.title}`} />
                                    <Row label="🎓 Faculty" value={result.session.faculty.name} />
                                    <Row label="📋 Session" value={result.session.sessionLabel} />
                                    {result.session.topic && <Row label="📖 Topic" value={result.session.topic} />}
                                    {result.session.room && <Row label="📍 Room" value={result.session.room} />}
                                    <Row label="⚡ Status" value={result.attendanceStatus === 'present' ? '✅ Present (On Time)' : '⏰ Present (Late)'}
                                        valueColor={result.attendanceStatus === 'present' ? '#6ee7b7' : '#fcd34d'} />
                                    <Row label="🕐 Time" value={new Date(result.scannedAt).toLocaleTimeString()} />
                                </div>
                                <button style={st.uploadBtn} onClick={reset}>Scan Another QR</button>
                            </div>
                        )}

                        {/* ERROR */}
                        {scanState === 'error' && (
                            <div style={st.center}>
                                <div style={{ fontSize: 52 }}>❌</div>
                                <h3 style={{ color: '#fca5a5', margin: '12px 0 8px' }}>Scan Failed</h3>
                                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 16px', maxWidth: 360, textAlign: 'center' }}>{errorMsg}</p>
                                <button style={st.uploadBtn} onClick={reset}>Try Again</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── HISTORY TAB ── */}
            {tab === 'history' && (
                <div>
                    {!attendanceData ? (
                        <div style={st.empty}>Loading attendance records...</div>
                    ) : (
                        <>
                            <div style={st.summaryGrid}>
                                {attendanceData.summary.map((item, i) => {
                                    const pct = item.percentage;
                                    const color = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                                    return (
                                        <div key={i} style={st.summaryCard}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', background: '#1e1b4b', padding: '2px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 6 }}>
                                                {(item.course as any)?.code}
                                            </div>
                                            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10 }}>{(item.course as any)?.title}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .5s' }} />
                                                </div>
                                                <span style={{ fontSize: 16, fontWeight: 800, color }}>{pct}%</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10, fontSize: 12, fontWeight: 600 }}>
                                                <span style={{ color: '#6ee7b7' }}>✓ {item.present}</span>
                                                <span style={{ color: '#fcd34d' }}>⏰ {item.late}</span>
                                                <span style={{ color: '#fca5a5' }}>✗ {item.absent}</span>
                                                <span style={{ color: '#64748b' }}>/ {item.total}</span>
                                            </div>
                                            {pct < 75 && <div style={{ marginTop: 8, fontSize: 11, color: '#fcd34d', background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 6, padding: '4px 8px' }}>⚠️ Below 75% — At Risk</div>}
                                        </div>
                                    );
                                })}
                            </div>

                            {attendanceData.summary.length === 0 && <div style={st.empty}>No attendance records yet. Scan a QR to mark your first attendance!</div>}

                            {attendanceData.history.length > 0 && (
                                <div style={st.card}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 1rem' }}>Recent History</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {attendanceData.history.slice(0, 20).map((h, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 14 }}>{(h.course as any)?.code} — {(h.course as any)?.title}</div>
                                                    <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                </div>
                                                <span style={{
                                                    fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 12,
                                                    background: h.status === 'present' ? '#064e3b' : h.status === 'late' ? '#78350f' : '#450a0a',
                                                    color: h.status === 'present' ? '#6ee7b7' : h.status === 'late' ? '#fcd34d' : '#fca5a5',
                                                }}>
                                                    {h.status === 'present' ? '✓ Present' : h.status === 'late' ? '⏰ Late' : '✗ Absent'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
            <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

const Row: React.FC<{ label: string; value: string; valueColor?: string }> = ({ label, value, valueColor }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>
        <span style={{ color: '#64748b' }}>{label}</span>
        <strong style={{ color: valueColor || 'var(--text-main)' }}>{value}</strong>
    </div>
);

const st: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', maxWidth: 860, margin: '0 auto', fontFamily: "'Inter',sans-serif", minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: 26, fontWeight: 800, color: 'var(--text-main)', margin: 0 },
    sub: { fontSize: 14, color: 'var(--text-muted)', marginTop: 4 },
    liveTag: { display: 'flex', alignItems: 'center', padding: '6px 14px', borderRadius: 20, background: '#064e3b', border: '1px solid #10b981', color: '#6ee7b7', fontSize: 13, fontWeight: 600 },
    dot: { width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginRight: 6, animation: 'pulse 1.5s infinite' },
    tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 12, width: 'fit-content' },
    tab: { padding: '8px 20px', borderRadius: 9, border: 'none', background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    tabOn: { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' },
    banner: { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' },
    sessionRow: { padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 },
    card: { background: 'var(--card-bg)', borderRadius: 16, padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' },
    modeRow: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'center' },
    modeBtn: { padding: '10px 20px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    modeBtnOn: { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none' },
    uploadArea: { border: '2px dashed #334155', borderRadius: 14, padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color .2s', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    uploadBtn: { marginTop: 14, padding: '12px 28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' },
    cameraIdle: { padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    video: { width: '100%', maxWidth: 440, borderRadius: 12, display: 'block' },
    scanFrame: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 180, height: 180, border: '3px solid #6366f1', borderRadius: 12, pointerEvents: 'none' },
    center: { textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    spinner: { fontSize: 48, animation: 'spin 1s linear infinite', display: 'inline-block' },
    successCircle: { width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#065f46,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#fff', boxShadow: '0 0 40px rgba(16,185,129,0.4)' },
    resultGrid: { width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '1rem', margin: '0 0 16px', textAlign: 'left' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '1rem', marginBottom: '1.5rem' },
    summaryCard: { background: 'var(--card-bg)', borderRadius: 14, padding: '1.2rem', border: '1px solid rgba(255,255,255,0.06)' },
    empty: { textAlign: 'center', padding: '4rem', color: '#64748b', fontSize: 15 },
};

export default StudentQRScannerPage;
