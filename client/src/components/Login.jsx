import React, { useState } from 'react';
import '../App.css';

const Login = ({ onLoginSuccess, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email address is invalid';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        return newErrors;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
        } else {
            console.log('Login successful:', { email, password });
            setErrors({});
            onLoginSuccess();
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
                
                <div className="form-group">
                    <input type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} className={errors.email ? 'error-input' : ''} />
                    {errors.email && <p className="error-text">{errors.email}</p>}
                </div>
                <div className="form-group">
                    <input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} className={errors.password ? 'error-input' : ''} />
                    {errors.password && <p className="error-text">{errors.password}</p>}
                </div>
                <button type="submit" className="signin-button">Sign In</button>
            </form>
        </div>
    );
};

export default Login;