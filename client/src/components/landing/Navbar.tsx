import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
    return (
        <nav className="lp-nav">
            <div className="lp-nav-inner">
                <Link to="/" className="lp-logo">Academix</Link>
                <ul className="lp-nav-links">
                    <li><a href="#features">Features</a></li>
                    <li><a href="#roles">Portals</a></li>
                    <li><a href="#process">How it works</a></li>
                </ul>
                <Link to="/login" className="lp-nav-cta">Sign In →</Link>
            </div>
        </nav>
    );
};

export default Navbar;
