import React, { useState } from 'react';
import '../App.css';
import './AuthModal.css';
import './Login.css';
import { login, requestForgotId } from '../services/backend';

const Login = ({ onLoginSuccess, onClose }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [showForgotForm, setShowForgotForm] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotFeedback, setForgotFeedback] = useState(null);

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

    const toggleForgotForm = (event) => {
        event?.preventDefault();
        setShowForgotForm((prev) => !prev);
        setForgotFeedback(null);
        setForgotEmail('');
    };

    const handleForgotSubmit = async (event) => {
        event.preventDefault();
        if (!forgotEmail.trim()) {
            setForgotFeedback({ type: 'error', message: 'Please enter your registered email address.' });
            return;
        }
        try {
            const res = await requestForgotId(forgotEmail.trim());
            setForgotFeedback({
                type: 'success',
                message:
                    res?.data?.message ||
                    'Email login enabled for this session. Sign in with email once, then continue using your Student ID.'
            });
        } catch (err) {
            console.error('Forgot ID request failed:', err);
            const msg = err?.response?.data?.error || 'Unable to enable email login right now.';
            setForgotFeedback({ type: 'error', message: msg });
        }
    };

    return (
        <div className="login-modal-overlay">
            <div className="auth-card auth-card--login">
                <button
                    type="button"
                    className="auth-close"
                    onClick={onClose}
                    aria-label="Close login modal"
                >
                    ×
                </button>

                <div className="auth-body" aria-label="Login form">
                    <div className="auth-brand">
                        <div className="auth-brand__mark" aria-hidden="true" />
                        <div className="auth-brand__text">
                            <span className="auth-brand__name">ClassLink</span>
                            <span className="auth-brand__tag">Access</span>
                        </div>
                    </div>
                    <p className="auth-eyebrow">ClassLink Portal</p>
                    <h1 className="auth-headline">Welcome back to CIT University</h1>
                    <p className="auth-subhead">
                        Sign in to continue your coursework, track enrollment tasks, and receive campus alerts from a single,
                        secured dashboard.
                    </p>

                    <form onSubmit={handleSubmit} className="auth-fields">
                        <div className="form-group">
                            <input
                                type="text"
                                name="identifier"
                                id="identifier"
                                autoComplete="username email"
                                placeholder="CIT email or Student ID"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className={errors.identifier ? 'error-input' : ''}
                            />
                            {errors.identifier && <p className="error-text">{errors.identifier}</p>}
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                name="password"
                                id="password"
                                autoComplete="current-password"
                                placeholder="Portal password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={errors.password ? 'error-input' : ''}
                            />
                            {errors.password && <p className="error-text">{errors.password}</p>}
                        </div>
                        {errors.form && <p className="error-text">{errors.form}</p>}
                        <button type="submit" className="signin-button">Sign In Securely</button>
                    </form>

                    <div className="forgot-id-section">
                        <button type="button" className="forgot-id-link" onClick={toggleForgotForm}>
                            Forgot Student ID?
                        </button>
                        {showForgotForm && (
                            <form className="forgot-id-form" onSubmit={handleForgotSubmit}>
                                <div className="form-group">
                                    <input
                                        type="email"
                                        name="forgotEmail"
                                        id="forgotEmail"
                                        placeholder="Enter your registered CIT email"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="forgot-submit-button">
                                    Enable temporary email login
                                </button>
                                {forgotFeedback && (
                                    <p className={forgotFeedback.type === 'error' ? 'error-text' : 'success-text'}>
                                        {forgotFeedback.message}
                                    </p>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;