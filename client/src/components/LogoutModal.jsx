import React from 'react';
import '../App.css';
import './AuthModal.css';
import './LogoutModal.css';

const LogoutModal = ({ onConfirm, onCancel, pending = false }) => (
    <div className="login-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="logout-modal-title">
        <div className="auth-card auth-card--logout">
            <button
                type="button"
                className="auth-close"
                onClick={pending ? undefined : onCancel}
                disabled={pending}
                aria-label="Close logout confirmation"
            >
                ×
            </button>

            <div className="auth-body">
                <div className="auth-brand" aria-hidden="true">
                    <div className="auth-brand__mark" />
                    <div className="auth-brand__text">
                        <span className="auth-brand__name">ClassLink</span>
                        <span className="auth-brand__tag">Security</span>
                    </div>
                </div>
                <p className="auth-eyebrow">Session control</p>
                <h1 id="logout-modal-title" className="auth-headline">Sign out of ClassLink?</h1>
                <p className="auth-subhead">
                    Logging out will close your current session on this device. You can always sign back in to pick up where you left off.
                </p>

                <div className="logout-modal-actions">
                    <button
                        type="button"
                        className="logout-modal-button logout-modal-button--secondary"
                        onClick={onCancel}
                        disabled={pending}
                    >
                        Stay signed in
                    </button>
                    <button
                        type="button"
                        className="logout-modal-button logout-modal-button--primary"
                        onClick={onConfirm}
                        disabled={pending}
                    >
                        {pending ? 'Logging out…' : 'Log out'}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default LogoutModal;
