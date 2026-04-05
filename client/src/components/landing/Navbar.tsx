import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
    const [showSolutions, setShowSolutions] = useState(false);

    return (
        <nav className="lp-nav">
            <div className="lp-nav-inner">
                <Link to="/" className="lp-logo">Academix</Link>
                <ul className="lp-nav-links">
                    <li><a href="#features">Features</a></li>
                    <li
                        style={{ position: 'relative' }}
                        onMouseEnter={() => setShowSolutions(true)}
                        onMouseLeave={() => setShowSolutions(false)}
                    >
                        <a href="#roles" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            Solutions <span style={{ fontSize: 10 }}>▼</span>
                        </a>
                        {showSolutions && (
                            <div style={dropdownStyle}>
                                <a href="#roles" style={dropItemStyle}>🎓 Student Portal</a>
                                <a href="#roles" style={dropItemStyle}>🏫 Faculty Portal</a>
                                <a href="#roles" style={dropItemStyle}>⚙️ Admin Console</a>
                            </div>
                        )}
                    </li>
                    <li><Link to="/pricing" style={{ color: 'inherit', textDecoration: 'none', fontSize: 'inherit', fontWeight: 'inherit' }}>Pricing</Link></li>
                    <li><a href="#process">About</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
                <div className="lp-nav-right">
                    <Link to="/login" style={loginLinkStyle}>Login</Link>
                    <Link to="/login" className="lp-nav-cta">Get Started →</Link>
                </div>
            </div>
        </nav>
    );
};

const loginLinkStyle: React.CSSProperties = {
    fontSize: '0.875rem', fontWeight: 600, color: '#374151',
    textDecoration: 'none', transition: 'color 0.2s',
};

const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
    background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
    boxShadow: '0 16px 40px rgba(0,0,0,0.1)', padding: 8, minWidth: 200, zIndex: 100,
    display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8,
};

const dropItemStyle: React.CSSProperties = {
    display: 'block', padding: '10px 14px', borderRadius: 8, fontSize: 13.5,
    fontWeight: 600, color: '#374151', textDecoration: 'none', transition: 'background 0.15s',
};

export default Navbar;
