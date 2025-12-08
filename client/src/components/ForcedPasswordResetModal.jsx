import React, { useEffect, useState } from 'react';
import '../App.css';
import './AuthModal.css';
import './Login.css';
import { changeMyPassword } from '../services/backend';

const ForcedPasswordResetModal = ({
    visible,
    studentName,
    defaultOldPassword,
    onSuccess,
    onCancel
}) => {
    const [form, setForm] = useState({ oldPassword: defaultOldPassword || '', newPassword: '', confirmPassword: '' });
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState({ error: '', success: '' });

    useEffect(() => {
        if (!visible) {
            return;
        }
        setForm((prev) => ({
            ...prev,
            oldPassword: defaultOldPassword || ''
        }));
        setFeedback({ error: '', success: '' });
    }, [defaultOldPassword, visible]);

    if (!visible) {
        return null;
    }

    const updateField = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
            setFeedback({ error: 'All fields are required.', success: '' });
            return;
        }
        if (form.newPassword !== form.confirmPassword) {
            setFeedback({ error: 'New passwords do not match.', success: '' });
            return;
        }
        if (form.newPassword === form.oldPassword) {
            setFeedback({ error: 'New password must be different from your current password.', success: '' });
            return;
        }
        setSubmitting(true);
        setFeedback({ error: '', success: '' });
        try {
            await changeMyPassword({
                oldPassword: form.oldPassword,
                newPassword: form.newPassword
            });
            setFeedback({ error: '', success: 'Password updated. Redirecting…' });
            await onSuccess?.();
        } catch (err) {
            const message = err?.response?.data?.error || 'Unable to update your password right now.';
            setFeedback({ error: message, success: '' });
        } finally {
            setSubmitting(false);
        }
    };

    const friendlyName = studentName?.trim() ? studentName.trim() : 'Tiger';

    return (
        <div className="login-modal-overlay">
            <div className="auth-card auth-card--login" role="dialog" aria-modal="true">
                <div className="auth-body">
                    <div className="auth-brand">
                        <div className="auth-brand__mark" aria-hidden="true" />
                        <div className="auth-brand__text">
                            <span className="auth-brand__name">ClassLink</span>
                            <span className="auth-brand__tag">Security</span>
                        </div>
                    </div>
                    <p className="auth-eyebrow">One-time onboarding step</p>
                    <h1 className="auth-headline">Secure your account, {friendlyName}</h1>
                    <p className="auth-subhead">
                        You’re logging in with the password you created during registration. Update it now to access your
                        official student portal.
                    </p>

                    <form className="auth-fields" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="reset-old-password" className="sr-only">Current password</label>
                            <input
                                id="reset-old-password"
                                type="password"
                                name="oldPassword"
                                value={form.oldPassword}
                                onChange={updateField}
                                placeholder="Current password"
                                autoComplete="current-password"
                                disabled={submitting}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reset-new-password" className="sr-only">New password</label>
                            <input
                                id="reset-new-password"
                                type="password"
                                name="newPassword"
                                value={form.newPassword}
                                onChange={updateField}
                                placeholder="New password"
                                autoComplete="new-password"
                                disabled={submitting}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reset-confirm-password" className="sr-only">Confirm new password</label>
                            <input
                                id="reset-confirm-password"
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={updateField}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                disabled={submitting}
                            />
                        </div>
                        {feedback.error && <p className="error-text">{feedback.error}</p>}
                        {feedback.success && <p className="success-text">{feedback.success}</p>}
                        <button type="submit" className="signin-button" disabled={submitting}>
                            {submitting ? 'Updating…' : 'Update password'}
                        </button>
                    </form>

                    <button
                        type="button"
                        className="forgot-id-link"
                        onClick={() => onCancel?.()}
                        disabled={submitting}
                    >
                        Log out instead
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForcedPasswordResetModal;
