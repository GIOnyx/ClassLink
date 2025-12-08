import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import SecondaryNavbar from './SecondaryNavbar';
import Footer from './Footer';
import LogoutModal from './LogoutModal';
import { getMyNotifications, getUnreadNotificationCount, markNotificationAsRead, getMyStudent, getMyAdmin } from '../services/backend';

const MainLayout = ({ onLogout, role, shouldOpenProfile, onProfileRedirectComplete }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [logoutInFlight, setLogoutInFlight] = useState(false);
    const [profileSummary, setProfileSummary] = useState({ name: '', avatarUrl: '', roleLabel: '' });
    const [profileLoading, setProfileLoading] = useState(false);
    const [studentRecord, setStudentRecord] = useState(null);
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
                        unreadCount
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
        </div>
    );
};

export default MainLayout;