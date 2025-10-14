import React, { useState } from 'react';
import '../App.css';
import BrandHeader from './BrandHeader.jsx'; // Import the reusable brand header

// The component accepts a function `onLoginSuccess` to notify the parent when to switch pages.
    const Login = ({ onLoginSuccess }) => {
    // State for managing form inputs and validation errors
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});

    // Function to validate the form inputs
    const validateForm = () => {
        const newErrors = {};
        // Email validation
        if (!email) {
        newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Email address is invalid';
        }
        // Password validation
        if (!password) {
        newErrors.password = 'Password is required';
        } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
        }
        return newErrors;
    };

    // Function to handle the form submission event
    const handleSubmit = (event) => {
        event.preventDefault(); // Prevents the browser from reloading the page
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
        // If there are errors, update the state to display them
        setErrors(formErrors);
        } else {
        // If validation passes, proceed with login logic
        console.log('Login successful:', { email, password });
        alert('Sign in successful!');
        setErrors({}); // Clear any previous errors
        onLoginSuccess(); // Call the function from App.jsx to switch to the home page
        }
    };

    return (
        // This container manages the overall page layout
        <div className="page-container">
        {/* The BrandHeader is now at the top and will be positioned left by default */}
        <BrandHeader />

        {/* This container centers the remaining content */}
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
        </div>
    );
};

export default Login;

