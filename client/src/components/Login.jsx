import React, { useState } from 'react';
import '../App.css';
import './Login.css';
import { login } from '../services/backend';

const Login = ({ onLoginSuccess, onClose }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!identifier) newErrors.identifier = 'Email or account ID is required';
        if (!password) newErrors.password = 'Password is required';
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
            const res = await login(identifier, password);
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
                
                <h2 className="login-title">
                    Welcome to <span className="class-text">Class</span><span className="link-text">Link</span>
                </h2>
                
                <h2>It is our great pleasure to have you on board!</h2>
                
                <div className="form-group">
                    {/* ✅ Added name, id, and autoComplete attributes here */}
                    <input 
                        type="text" 
                        name="identifier"
                        id="identifier"
                        autoComplete="username email"
                        placeholder="Enter email or account ID" 
                        value={identifier} 
                        onChange={(e) => setIdentifier(e.target.value)} 
                        className={errors.identifier ? 'error-input' : ''} 
                    />
                    {errors.identifier && <p className="error-text">{errors.identifier}</p>}
                </div>
                <div className="form-group">
                    {/* ✅ Added name, id, and autoComplete attributes here */}
                    <input 
                        type="password" 
                        name="password"
                        id="password"
                        autoComplete="current-password"
                        placeholder="Enter Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className={errors.password ? 'error-input' : ''} 
                    />
                    {errors.password && <p className="error-text">{errors.password}</p>}
                </div>
                {errors.form && <p className="error-text">{errors.form}</p>}
                <button type="submit" className="signin-button">Sign In</button>
            </form>
        </div>
    );
};

export default Login;