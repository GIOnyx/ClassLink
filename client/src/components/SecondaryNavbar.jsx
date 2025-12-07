import React from 'react';
import { NavLink } from 'react-router-dom'; // ✨ Import NavLink
import '../App.css';
import './SecondaryNavbar.css';

const ICON_MAP = {
    enrollment: {
        on: '/icons/enrollment/enrollment-on.png',
        off: '/icons/enrollment/enrollment-off.png'
    },
    calendar: {
        on: '/icons/calendar/calendar-on.png',
        off: '/icons/calendar/calendar-off.png'
    },
    admins: {
        on: '/icons/admins/admin-on.png',
        off: '/icons/admins/admin-off.png'
    },
    students: {
        on: '/icons/students/student-on.png',
        off: '/icons/students/student-off.png'
    },
    curriculum: {
        on: '/icons/curriculum/curriculum-on.png',
        off: '/icons/curriculum/curriculum-off.png'
    },
    profile: {
        on: '/icons/profile/profile-on.png',
        off: '/icons/profile/profile-off.png'
    }
};

const SecondaryNavbar = ({ role }) => {
    const adminNav = [
        { label: 'Enrollment', to: '/', icon: 'enrollment', end: true },
        { label: 'Calendar', to: '/calendar', icon: 'calendar', end: true },
        { label: 'Admins', to: '/admins', icon: 'admins' },
        { label: 'Students', to: '/students', icon: 'students' },
        { label: 'Curriculum', to: '/curriculum', icon: 'curriculum' },
        { label: 'Profile', to: '/profile', icon: 'profile' }
    ];

    const studentNav = [
        { label: 'Enrollment', to: '/', icon: 'enrollment', end: true },
        { label: 'Calendar', to: '/calendar', icon: 'calendar' },
        { label: 'Curriculum', to: '/curriculum', icon: 'curriculum' },
        { label: 'Profile', to: '/profile', icon: 'profile' }
    ];

    const links = role === 'ADMIN' ? adminNav : studentNav;

    return (
        <nav className="secondary-navbar">
            <ul>
                {links.map((item) => (
                    <li key={item.to}>
                        <NavLink
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `secondary-link ${isActive ? 'active' : ''}`}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className="secondary-link-icon" aria-hidden="true">
                                        <img
                                            src={isActive ? ICON_MAP[item.icon].on : ICON_MAP[item.icon].off}
                                            alt=""
                                        />
                                    </span>
                                    <span className="secondary-link-label">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default SecondaryNavbar;