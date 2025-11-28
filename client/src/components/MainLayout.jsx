import React, { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SecondaryNavbar from './SecondaryNavbar';
import Footer from './Footer';
import { getMyNotifications, getUnreadNotificationCount, markNotificationAsRead } from '../services/backend';

const MainLayout = ({ onLogout, role }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    const refreshUnreadCount = useCallback(async () => {
        if (role !== 'STUDENT') {
            setUnreadCount(0);
            return;
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

    return (
        <div className="app-container">
            <Navbar
                onLogout={onLogout}
                role={role}
                notifications={notifications}
                unreadCount={unreadCount}
                onRefreshNotifications={handleRefreshNotifications}
                onMarkNotificationRead={handleMarkNotificationRead}
                notificationsLoading={notificationsLoading}
            />
            
            {/* Sidebar Navigation */}
            <SecondaryNavbar role={role} />
            
            {/* Main Content Area */}
            <main className="main-content">
                <Outlet
                    context={{
                        handleLogout: onLogout,
                        role,
                        notifications,
                        notificationsLoading,
                        refreshNotifications: handleRefreshNotifications,
                        markNotificationRead: handleMarkNotificationRead,
                        unreadCount
                    }}
                />
            </main>
        </div>
    );
};

export default MainLayout;