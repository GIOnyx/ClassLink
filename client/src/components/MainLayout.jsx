import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import SecondaryNavbar from './SecondaryNavbar';
import Footer from './Footer';
import LogoutModal from './LogoutModal';
import { getMyNotifications, getUnreadNotificationCount, markNotificationAsRead, getMyStudent, getMyAdmin } from '../services/backend';

const deriveOfficialStudentId = (student) => {
    if (!student) return '';
    const candidate = student.accountId || student.studentId || student.accountNumber;
    if (candidate && /\d{2}-\d{4}-\d{2,3}/.test(candidate)) {
        return candidate;
    }
    const timestamp = student.updatedAt || student.createdAt;
    const date = timestamp ? new Date(timestamp) : new Date();
    const yearSegment = Number.isNaN(date.getTime())
        ? new Date().getFullYear().toString().slice(-2)
        : date.getFullYear().toString().slice(-2);
    const slotNumber = Number(student.accountSequence || student.id || 1);
    const middleSegment = String(Math.max(slotNumber, 1)).padStart(4, '0');
    const trailingSegment = String(Math.max(slotNumber % 100, 1)).padStart(2, '0');
    return `${yearSegment}-${middleSegment}-${trailingSegment}`;
};

const resolveTemporaryPassword = (student) => {
    if (!student) {
        return 'Issued by admissions';
    }
    const candidate = student.tempPassword || student.password;
    if (!candidate) {
        return 'Issued by admissions';
    }
    const trimmed = String(candidate).trim();
    return trimmed.length > 0 ? trimmed : 'Issued by admissions';
};

const MainLayout = ({ onLogout, role, shouldOpenProfile, onProfileRedirectComplete }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [logoutInFlight, setLogoutInFlight] = useState(false);
    const [profileSummary, setProfileSummary] = useState({ name: '', avatarUrl: '', roleLabel: '' });
    const [profileLoading, setProfileLoading] = useState(false);
    const [studentRecord, setStudentRecord] = useState(null);
    const [credentialAcknowledged, setCredentialAcknowledged] = useState(false);
    const [credentialModal, setCredentialModal] = useState({ visible: false, studentId: '', password: '' });
    const navigate = useNavigate();
    const location = useLocation();
        useEffect(() => {
            if (!shouldOpenProfile || role !== 'STUDENT') {
                return;
            }
            if (location.pathname !== '/profile') {
                navigate('/profile', { replace: true });
            }
            onProfileRedirectComplete?.();
        }, [shouldOpenProfile, role, navigate, location.pathname, onProfileRedirectComplete]);

    const resolveImageSrc = (url) => {
        if (!url) return '';
        if (/^(https?:|data:|blob:)/i.test(url)) {
            return url;
        }
        const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api$/, '');
        return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const refreshUnreadCount = useCallback(async () => {
        if (role !== 'STUDENT') {
            setUnreadCount(0);
                                if (role === 'ADMIN') {
                                    setStudentRecord(null);
                                } else {
                                    setStudentRecord(data);
                                }
        }
        try {
            const res = await getUnreadNotificationCount();
            setUnreadCount(res.data?.count ?? 0);
        } catch (err) {
            console.error('Failed to load unread notifications', err);
        }
    }, [role]);

    const loadNotifications = useCallback(async () => {
        if (role !== 'STUDENT') {
            setNotifications([]);
            return;
        }
        setNotificationsLoading(true);
        try {
            const res = await getMyNotifications();
            setNotifications(res.data || []);
        } catch (err) {
            console.error('Failed to load notifications', err);
        } finally {
            setNotificationsLoading(false);
        }
    }, [role]);

    const handleMarkNotificationRead = useCallback(async (notificationId) => {
        if (role !== 'STUDENT') {
            return;
        }
        try {
            await markNotificationAsRead(notificationId);
            setNotifications((prev) => {
                let decremented = false;
                const updated = prev.map((notification) => {
                    if (notification.id === notificationId) {
                        if (!notification.read) {
                            decremented = true;
                        }
                        return { ...notification, read: true };
                    }
                    return notification;
                });
                if (decremented) {
                    setUnreadCount((count) => Math.max(0, count - 1));
                }
                return updated;
            });
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    }, [role]);

    const handleRefreshNotifications = useCallback(async () => {
        if (role !== 'STUDENT') {
            return;
        }
        await loadNotifications();
        await refreshUnreadCount();
    }, [role, loadNotifications, refreshUnreadCount]);

    useEffect(() => {
        if (role !== 'STUDENT') {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        loadNotifications();
        refreshUnreadCount();
        const interval = setInterval(() => {
            refreshUnreadCount();
        }, 60000);
        return () => clearInterval(interval);
    }, [role, loadNotifications, refreshUnreadCount]);

    useEffect(() => {
        let cancelled = false;
        if (!role) {
            setProfileSummary({ name: '', avatarUrl: '', roleLabel: '' });
            return () => { cancelled = true; };
        }

        const fetchProfile = async () => {
            setProfileLoading(true);
            try {
                const res = role === 'ADMIN' ? await getMyAdmin() : await getMyStudent();
                if (cancelled) return;
                const data = res?.data || {};
                const resolvedName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || (role === 'ADMIN' ? 'Admin Account' : 'Student Account');
                const avatarUrl = resolveImageSrc(data.profileImageUrl || data.photoUrl || '');
                setProfileSummary({
                    name: resolvedName,
                    avatarUrl,
                    roleLabel: role === 'ADMIN' ? 'Administrator' : 'Student'
                });
                if (role === 'ADMIN') {
                    setStudentRecord(null);
                } else {
                    setStudentRecord(data);
                }
            } catch (err) {
                console.warn('Failed to load profile summary', err);
                if (!cancelled) {
                    setProfileSummary({
                        name: role === 'ADMIN' ? 'Admin Account' : 'Student Account',
                        avatarUrl: '',
                        roleLabel: role === 'ADMIN' ? 'Administrator' : 'Student'
                    });
                }
            } finally {
                if (!cancelled) {
                    setProfileLoading(false);
                }
            }
        };

        fetchProfile();
        return () => { cancelled = true; };
    }, [role]);

    useEffect(() => {
        if (role !== 'STUDENT') {
            setCredentialAcknowledged(false);
            setCredentialModal({ visible: false, studentId: '', password: '' });
            return;
        }
        if (!studentRecord) {
            setCredentialModal((prev) => ({ ...prev, visible: false }));
            return;
        }
        const status = (studentRecord.status || studentRecord.enrollmentStatus || '').toUpperCase();
        if (status !== 'APPROVED') {
            setCredentialAcknowledged(false);
            setCredentialModal({ visible: false, studentId: '', password: '' });
            return;
        }
        if (!studentRecord.tempPasswordActive) {
            setCredentialAcknowledged(true);
            setCredentialModal({ visible: false, studentId: '', password: '' });
            return;
        }
        const studentId = deriveOfficialStudentId(studentRecord) || 'Pending assignment';
        const password = resolveTemporaryPassword(studentRecord);
        setCredentialModal({
            visible: !credentialAcknowledged,
            studentId,
            password
        });
    }, [role, studentRecord, credentialAcknowledged]);

    const handleCredentialChangePassword = useCallback(() => {
        setCredentialAcknowledged(true);
        navigate('/profile#security');
    }, [navigate]);

    const handleCredentialOpen = useCallback(() => {
        if (!studentRecord || !studentRecord.tempPasswordActive) return;
        setCredentialAcknowledged(false);
    }, [studentRecord]);

    const handleCredentialGoToLogin = useCallback(async () => {
        setCredentialAcknowledged(true);
        try {
            await onLogout?.();
        } catch (err) {
            console.error('Failed to log out before redirecting to login screen', err);
        } finally {
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        }
    }, [onLogout]);

    const handleRequestLogout = useCallback(() => {
        if (logoutInFlight) return;
        setShowLogoutModal(true);
    }, [logoutInFlight]);

    const handleCancelLogout = useCallback(() => {
        if (logoutInFlight) return;
        setShowLogoutModal(false);
    }, [logoutInFlight]);

    const handleConfirmLogout = useCallback(async () => {
        if (logoutInFlight) return;
        setLogoutInFlight(true);
        try {
            await onLogout?.();
        } catch (err) {
            console.error('Logout failed', err);
            setLogoutInFlight(false);
            return;
        }
        // If logout succeeds, MainLayout will unmount.
    }, [logoutInFlight, onLogout]);

    return (
        <div className="app-container">
            <Navbar
                onLogout={handleRequestLogout}
                role={role}
                notifications={notifications}
                unreadCount={unreadCount}
                onRefreshNotifications={handleRefreshNotifications}
                onMarkNotificationRead={handleMarkNotificationRead}
                notificationsLoading={notificationsLoading}
                userProfile={profileSummary}
                profileLoading={profileLoading}
            />
            
            {/* Sidebar Navigation */}
            <SecondaryNavbar role={role} />
            
            {/* Main Content Area */}
            <main className="main-content">
                <Outlet
                    context={{
                        handleLogout: handleRequestLogout,
                        role,
                        notifications,
                        notificationsLoading,
                        refreshNotifications: handleRefreshNotifications,
                        markNotificationRead: handleMarkNotificationRead,
                        unreadCount,
                        openCredentialModal: handleCredentialOpen,
                        credentialModalVisible: credentialModal.visible,
                        credentialsAcknowledged: credentialAcknowledged
                    }}
                />
            </main>
            {showLogoutModal && (
                <LogoutModal
                    onConfirm={handleConfirmLogout}
                    onCancel={handleCancelLogout}
                    pending={logoutInFlight}
                />
            )}
            {credentialModal.visible && (
                <div className="approval-modal-overlay" role="dialog" aria-modal="true">
                    <div className="approval-modal">
                        <p className="approval-modal__eyebrow">Official student access</p>
                        <h2>Application Approved</h2>
                        <p className="approval-modal__copy">
                            Use the issued student account below to sign in to the official portal. This enrollment login will be disabled soon.
                        </p>
                        <div className="approval-modal__credentials">
                            <article>
                                <span>Student ID</span>
                                <strong>{credentialModal.studentId || 'Pending assignment'}</strong>
                            </article>
                            <article>
                                <span>Temporary Password</span>
                                <strong>{credentialModal.password}</strong>
                            </article>
                        </div>
                        <p className="approval-modal__note">
                            These are temporary credentials. Please change your password immediately after logging into your official student account.
                        </p>
                        <div className="approval-modal__actions">
                            <button type="button" className="enrollment-submit-btn" onClick={handleCredentialGoToLogin}>
                                Go to official login
                            </button>
                            <button type="button" className="enrollment-submit-btn enrollment-back-btn" onClick={handleCredentialChangePassword}>
                                Change password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainLayout;