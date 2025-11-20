import React, { useState, useRef, useEffect } from 'react';
import '../App.css';
import { login } from '../services/backend';

const Login = ({ onLoginSuccess, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const roleRef = useRef(null);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!email) newErrors.email = 'Email/Username is required';
        // Only validate email format for student role
        if (email && role === 'student' && !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email address is invalid';
        if (!password) newErrors.password = 'Password is required';
        // For admin 'admin' short password allowed per requirement
        if (password && role === 'student' && password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        return newErrors;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }
        try {
            const res = await login(email, password, role);
            console.log('Logged in:', res.data);
            setErrors({});
            onLoginSuccess?.(res.data);
            onClose?.();
        } catch (err) {
            console.error('Login failed:', err);
            const msg = err?.response?.data?.error || 'Login failed';
            setErrors({ form: msg });
        }
    };

    return (
        <div className="login-modal-overlay" onClick={onClose}>
            <form onSubmit={handleSubmit} className="login-form" onClick={(e) => e.stopPropagation()}>
                
                {/* ✅ The className here is now corrected to just "login-title" */}
                <h2 className="login-title">
                    Welcome to <span className="class-text">Class</span><span className="link-text">Link</span>
                </h2>
                
                <h2>It is our great pleasure to have you on board!</h2>
                <div className="form-group role-group" ref={roleRef}>
                    <div className="role-select-wrapper">
                        <button
                            type="button"
                            className="role-button"
                            aria-haspopup="listbox"
                            aria-expanded={dropdownOpen}
                            onClick={() => setDropdownOpen((s) => !s)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setDropdownOpen(false); }}
                        >
                            <span className="role-button-label">{role === 'student' ? 'Student' : 'Admin'}</span>
                            <span className="role-button-arrow">▾</span>
                        </button>

                        {dropdownOpen && (
                            <ul className="role-dropdown" role="listbox" tabIndex={-1}>
                                <li role="option" onClick={() => { setRole('student'); setDropdownOpen(false); }}>Student</li>
                                <li role="option" onClick={() => { setRole('admin'); setDropdownOpen(false); }}>Admin</li>
                            </ul>
                        )}
                    </div>
                </div>
                
                <div className="form-group">
                    <input type={role === 'student' ? 'email' : 'text'} placeholder={role === 'admin' ? 'Enter admin username' : 'Enter email'} value={email} onChange={(e) => setEmail(e.target.value)} className={errors.email ? 'error-input' : ''} />
                    {errors.email && <p className="error-text">{errors.email}</p>}
                </div>
                <div className="form-group">
                    <input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} className={errors.password ? 'error-input' : ''} />
                    {errors.password && <p className="error-text">{errors.password}</p>}
                </div>
                {errors.form && <p className="error-text">{errors.form}</p>}
                <button type="submit" className="signin-button">Sign In</button>
            </form>
        </div>
    );
};

export default Login;