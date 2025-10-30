import React, { useState } from 'react';
import '../App.css';
import { register as apiRegister } from '../services/backend';

const Register = ({ onRegisterSuccess, onClose }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.firstName) e.firstName = 'First name is required';
    if (!form.lastName) e.lastName = 'Last name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    try {
      await apiRegister({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
      onRegisterSuccess?.();
      onClose?.();
    } catch (err) {
      // Surface better diagnostics
      const status = err?.response?.status;
      const data = err?.response?.data;
      const serverMsg = typeof data === 'string' ? data : data?.error;
      const code = err?.code; // e.g., ERR_NETWORK
      console.error('Register error:', { status, data, code, err });

      if (status === 409) setErrors({ form: serverMsg || 'Email already in use' });
      else if (status === 400) setErrors({ form: serverMsg || 'Invalid input' });
      else if (status === 401 || status === 403) setErrors({ form: serverMsg || 'Not allowed (CORS/credentials). Refresh and try again.' });
      else if (!status && code === 'ERR_NETWORK') setErrors({ form: 'Cannot reach server (CORS or server down). Check backend and refresh.' });
      else setErrors({ form: serverMsg || `Registration failed${status ? ` (HTTP ${status})` : ''}` });
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <form className="login-form" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <h2 className="login-title">Create your account</h2>
        {errors.form && <p className="error-text">{errors.form}</p>}
        <div className="form-group">
          <input name="firstName" placeholder="First name" value={form.firstName} onChange={onChange} className={errors.firstName ? 'error-input' : ''} />
          {errors.firstName && <p className="error-text">{errors.firstName}</p>}
        </div>
        <div className="form-group">
          <input name="lastName" placeholder="Last name" value={form.lastName} onChange={onChange} className={errors.lastName ? 'error-input' : ''} />
          {errors.lastName && <p className="error-text">{errors.lastName}</p>}
        </div>
        <div className="form-group">
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={onChange} className={errors.email ? 'error-input' : ''} />
          {errors.email && <p className="error-text">{errors.email}</p>}
        </div>
        <div className="form-group">
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={onChange} className={errors.password ? 'error-input' : ''} />
          {errors.password && <p className="error-text">{errors.password}</p>}
        </div>
        <div className="form-group">
          <input type="password" name="confirmPassword" placeholder="Confirm password" value={form.confirmPassword} onChange={onChange} className={errors.confirmPassword ? 'error-input' : ''} />
          {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
        </div>
        <button type="submit" className="signin-button">Create Account</button>
      </form>
    </div>
  );
};

export default Register;
