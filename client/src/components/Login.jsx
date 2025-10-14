import React, { useState } from 'react';
import '../App.css'; // We'll use the same CSS file for simplicity

const Login = () => {
  // State for email, password, and error messages
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});

  // Function to handle form validation
    const validateForm = () => {
        const newErrors = {};
        // Email validation: checks for presence and basic format
        if (!email) {
        newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Email address is invalid';
        }
        // Password validation: checks for presence and minimum length
        if (!password) {
        newErrors.password = 'Password is required';
        } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
        }
        return newErrors;
    };

    // Function to handle form submission
    const handleSubmit = (event) => {
        event.preventDefault(); // Prevent default form submission
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        } else {
        // If no errors, proceed with login logic
        console.log('Login successful:', { email, password });
        alert('Sign in successful!');
        setErrors({}); // Clear errors on successful submission
        }
    };

    return (
        <div className="login-container">
            <h2 className="login-title">
                Welcome to <span className="class-text">Class</span><span className="link-text">Link</span>
            </h2>
        <form onSubmit={handleSubmit} className="login-form">
            <h2>It is our great pleasure to have you on board!</h2>
            <div className="form-group">
                <input
                    type="email"
                    id="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? 'error-input' : ''}
                />
                {errors.email && <p className="error-text">{errors.email}</p>}
                </div>
                <div className="form-group">
                <input
                    type="password"
                    id="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? 'error-input' : ''}
                />
                {errors.password && <p className="error-text">{errors.password}</p>}
            </div>
            <button type="submit" className="signin-button">Sign In</button>
        </form>
        </div>
    );
};

export default Login;