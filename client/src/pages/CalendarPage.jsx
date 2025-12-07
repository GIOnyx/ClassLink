import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '../services/backend';
import '../App.css';
import './CalendarPage.css';

// Helper to convert date string (YYYY-MM-DD) to Date object for comparison
const dateStringToDate = (dateStr) => {
    if (!dateStr) return null;
    // Using UTC to prevent timezone shifts
    return new Date(dateStr + 'T00:00:00Z');
};

// NEW HELPER: Determine the current school year (e.g., 2025-2026)
const getSchoolYear = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed: 0=Jan, 11=Dec

    // Assuming the school year starts around August/September. 
    // If the month is June (5) or later, the year is Y to Y+1. 
    // If it's Jan-May, the year is Y-1 to Y.
    if (month >= 5) { // June (5) through December (11)
        return `${year}-${year + 1}`;
    } else { // January (0) through May (4)
        return `${year - 1}-${year}`;
    }
};

const EVENT_TYPE_DETAILS = {
    EVENT: { label: 'Campus Events', accent: '#1976d2', helper: 'Community & school-wide happenings.' },
    EXAM: { label: 'Examinations', accent: '#d32f2f', helper: 'Major testing windows and boards.' },
    HOLIDAY: { label: 'Holidays', accent: '#2e7d32', helper: 'Official breaks and closures.' },
    SEMESTER_END: { label: 'Semestral Milestones', accent: '#f57c00', helper: 'Term endings and transitions.' }
};

const resolveTypeKey = (type) => (type && EVENT_TYPE_DETAILS[type]) ? type : 'EVENT';

const formatFullDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
};

const formatTimelineRange = (start, end) => {
    if (!start) return '';
    if (start === end || !end) {
        return new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    const startFormat = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFormat = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startFormat} – ${endFormat}`;
};

const CalendarPage = () => {
    // Access role passed from MainLayout
    const { role } = useOutletContext(); 
    const isAdmin = role === 'ADMIN';

    const [events, setEvents] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    
    // Toggle between calendar grid and summary list
    const [isSummaryView, setIsSummaryView] = useState(false); 

    // Calculate the school year once on load
    const currentSchoolYear = getSchoolYear(new Date()); 

    // Admin Form State
    const [newEvent, setNewEvent] = useState({
        title: '',
        startDate: '',
        endDate: '',
        type: 'EVENT', // Default
        description: ''
    });

    const typeCounts = useMemo(() => {
        const counts = Object.keys(EVENT_TYPE_DETAILS).reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
        events.forEach(evt => {
            const key = resolveTypeKey(evt.type);
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }, [events]);

    const upcomingEvents = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return [...events]
            .filter(evt => {
                const eventEnd = dateStringToDate(evt.endDate || evt.startDate);
                return eventEnd && eventEnd >= now;
            })
            .sort((a, b) => dateStringToDate(a.startDate) - dateStringToDate(b.startDate));
    }, [events]);

    const nextEvent = upcomingEvents[0];
    const heroTitle = isAdmin
        ? 'Command the school-year timeline'
        : 'Stay ahead of every campus milestone';
    const heroSubtitle = isAdmin
        ? 'Publish key milestones, exams, and breaks with a single source of truth for your campus.'
        : 'Stay in sync with every approved milestone, from enrolment to breaks and examinations.';

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const res = await getCalendarEvents();
            setEvents(res.data || []);
        } catch (err) {
            console.error("Failed to load events", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.startDate) return;

        const eventToCreate = {
            ...newEvent,
            endDate: newEvent.endDate || newEvent.startDate
        };
        
        if (dateStringToDate(eventToCreate.endDate) < dateStringToDate(eventToCreate.startDate)) {
            alert("End Date cannot be before Start Date.");
            return;
        }

        try {
            await createCalendarEvent(eventToCreate);
            setNewEvent({ title: '', startDate: '', endDate: '', type: 'EVENT', description: '' }); 
            loadEvents();
        } catch (err) {
            alert("Failed to add event: " + (err.response?.data || "Server error"));
        }
    };

    const handleDeleteEvent = async (id) => {
        if (confirm("Are you sure you want to delete this event?")) {
            try {
                await deleteCalendarEvent(id);
                loadEvents();
            } catch (err) {
                alert("Failed to delete event");
            }
        }
    };

    // --- Calendar Grid Logic ---
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay(); 

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const changeMonth = (offset) => {
        setCurrentDate(new Date(year, month + offset, 1));
    };

    // Helper to find events for a specific day
    const getEventsForDay = (day) => {
        const currentDayDate = new Date(year, month, day); 
        
        return events.filter(e => {
            const eventStartDate = dateStringToDate(e.startDate);
            const eventEndDate = dateStringToDate(e.endDate || e.startDate);

            return eventStartDate <= currentDayDate && currentDayDate <= eventEndDate;
        });
    };

    const renderCalendarCells = () => {
        const cells = [];
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEvents = getEventsForDay(day);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            cells.push(
                <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
                    <span className="day-number">{day}</span>
                    <div className="day-events">
                        {dayEvents.map(ev => (
                            <div 
                                key={ev.id} 
                                className={`event-pill event-type-${ev.type}`} 
                                title={ev.startDate !== ev.endDate 
                                    ? `${ev.title} (${ev.startDate} to ${ev.endDate}): ${ev.description || ''}`
                                    : `${ev.title}: ${ev.description || ''}`
                                }
                            >
                                {ev.title}
                                {isAdmin && (
                                    <span className="delete-event" onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEvent(ev.id);
                                    }}> ×</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return cells;
    };
    
    // --- Summary View Logic ---
    const eventTypeTitles = {
        'EXAM': '1. Examination 📝',
        'EVENT': '2. School Events 🥳',
        'HOLIDAY': '3. Holidays 🌴',
        'SEMESTER_END': '4. Semester End/Breaks 📚'
    };
    
    // Function to group and sort events by type
    const groupedEvents = useMemo(() => {
        return events.reduce((acc, event) => {
            const type = resolveTypeKey(event.type); // Default to EVENT if type is missing
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(event);
            return acc;
        }, {});
    }, [events]);

    const renderSummaryView = () => (
        <div className="summary-list-container">
            <div className="summary-header">
                <div>
                    <p className="summary-eyebrow">Academic Calendar {currentSchoolYear}</p>
                    <h2>High-level Overview</h2>
                </div>
                <span className="summary-chip">{events.length} scheduled items</span>
            </div>

            {loading && <p className="summary-empty">Loading summary...</p>}

            {!loading && Object.keys(eventTypeTitles).map(typeKey => (
                <div key={typeKey} className="summary-section">
                    <div className="summary-section__title">
                        <span className="summary-index">{eventTypeTitles[typeKey]}</span>
                    </div>

                    {groupedEvents[typeKey] && groupedEvents[typeKey].length > 0 ? (
                        <ul className="summary-events">
                            {groupedEvents[typeKey].map(event => (
                                <li key={event.id} className="summary-event" style={{ borderColor: getEventColor(typeKey) }}>
                                    <div className="summary-event__date">{formatDateRange(event.startDate, event.endDate)}</div>
                                    <div className="summary-event__details">
                                        {event.description ? event.description : event.title}
                                    </div>
                                    {isAdmin && (
                                        <button 
                                            type="button"
                                            className="summary-delete"
                                            onClick={() => handleDeleteEvent(event.id)}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="summary-empty">No {typeKey.toLowerCase()} entries yet.</p>
                    )}
                </div>
            ))}

            {!loading && events.length === 0 && (
                <p className="summary-empty">The academic calendar is currently empty.</p>
            )}
        </div>
    );
    
    // Helper function to format date range for summary view
    const formatDateRange = (start, end) => {
        if (!start) return '';
        if (start === end || !end) {
            // Single day event
            return new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } else {
            // Date range
            const startFormat = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const endFormat = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return `${startFormat} - ${endFormat}`;
        }
    };
    
    // Helper function to get color for summary list (based on .event-type-X CSS)
    const getEventColor = (type) => {
        switch(type) {
            case 'EXAM': return '#d32f2f';
            case 'HOLIDAY': return '#2e7d32';
            case 'EVENT': return '#1976d2';
            case 'SEMESTER_END': return '#f57c00';
            default: return '#ccc';
        }
    };

    return (
        <div className="standard-page-layout calendar-page-container">
            <section className="calendar-hero-card">
                <div className="calendar-hero__top">
                    <div className="calendar-hero__copy">
                        <p className="calendar-pill">Academic Calendar • {currentSchoolYear}</p>
                        <h1>{heroTitle}</h1>
                        <p className="calendar-hero__subtitle">{heroSubtitle}</p>
                    </div>
                    <div className="calendar-view-controls">
                        <div className="calendar-view-toggle">
                            <button
                                type="button"
                                className={!isSummaryView ? 'active' : ''}
                                onClick={() => setIsSummaryView(false)}
                            >
                                Calendar Grid
                            </button>
                            <button
                                type="button"
                                className={isSummaryView ? 'active' : ''}
                                onClick={() => setIsSummaryView(true)}
                            >
                                Summary List
                            </button>
                        </div>
                        {isAdmin && <span className="calendar-admin-chip">Admin Mode</span>}
                    </div>
                </div>

                <div className="calendar-hero__meta">
                    <div className="calendar-hero__stat">
                        <span>Scheduled items</span>
                        <strong>{events.length}</strong>
                        <small>Active academic entries</small>
                    </div>
                    <div className="calendar-hero__stat highlight">
                        <span>Next milestone</span>
                        <strong>{nextEvent ? nextEvent.title : 'No upcoming events'}</strong>
                        <small>{nextEvent ? formatFullDate(nextEvent.startDate) : 'Add events to populate the queue.'}</small>
                    </div>
                </div>
            </section>

            <section className="calendar-overview-grid">
                {Object.keys(EVENT_TYPE_DETAILS).map((typeKey) => (
                    <div key={typeKey} className="calendar-metric-card">
                        <span className="metric-label">{EVENT_TYPE_DETAILS[typeKey].label}</span>
                        <strong style={{ color: EVENT_TYPE_DETAILS[typeKey].accent }}>{typeCounts[typeKey] || 0}</strong>
                        <p>{EVENT_TYPE_DETAILS[typeKey].helper}</p>
                    </div>
                ))}
                <div className="calendar-metric-card highlight">
                    <span className="metric-label">Next milestone</span>
                    <h3>{nextEvent ? nextEvent.title : 'Awaiting new schedule'}</h3>
                    <p>{nextEvent ? formatFullDate(nextEvent.startDate) : 'Once events are added, the next milestone appears here.'}</p>
                </div>
            </section>

            {isAdmin && (
                <section className="admin-calendar-form">
                    <div className="form-header-row">
                        <div>
                            <p className="form-eyebrow">Admin tools</p>
                            <h3 className="form-header">Manage Academic Calendar</h3>
                        </div>
                        <span className="form-helper">Create, adjust, and publish timeline updates.</span>
                    </div>
                    <form onSubmit={handleAddEvent} className="calendar-form-grid">
                        <div>
                            <label>Event Title</label>
                            <input 
                                type="text" 
                                className="cal-input" 
                                placeholder="e.g., Midterm Exams" 
                                value={newEvent.title}
                                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                                required 
                            />
                        </div>
                        
                        <div>
                            <label>Start Date</label>
                            <input 
                                type="date" 
                                className="cal-input" 
                                value={newEvent.startDate}
                                onChange={e => setNewEvent({...newEvent, startDate: e.target.value})}
                                required 
                            />
                        </div>
                        
                        <div>
                            <label>End Date (Optional)</label>
                            <input 
                                type="date" 
                                className="cal-input" 
                                value={newEvent.endDate}
                                onChange={e => setNewEvent({...newEvent, endDate: e.target.value})}
                            />
                        </div>
                        
                        <div>
                            <label>Type</label>
                            <select 
                                className="cal-input"
                                value={newEvent.type}
                                onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                            >
                                <option value="EVENT">School Event</option>
                                <option value="EXAM">Examination</option>
                                <option value="HOLIDAY">Holiday</option>
                                <option value="SEMESTER_END">Semester End</option>
                            </select>
                        </div>
                        
                        <div>
                            <label>Description (Optional)</label>
                            <input 
                                type="text" 
                                className="cal-input" 
                                placeholder="Additional details..." 
                                value={newEvent.description}
                                onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                            />
                        </div>
                        
                        <button type="submit" className="btn-add-event">Add Event</button>
                    </form>
                </section>
            )}

            {isSummaryView ? (
                <section className="calendar-summary-panel">
                    {renderSummaryView()}
                </section>
            ) : (
                <section className="calendar-main-grid">
                    <div className="calendar-container">
                        <div className="calendar-header">
                            <button className="calendar-nav-btn" onClick={() => changeMonth(-1)}>← Prev</button>
                            <div className="calendar-title-group">
                                <span className="calendar-month">{monthNames[month]}</span>
                                <span className="calendar-year">{year}</span>
                            </div>
                            <button className="calendar-nav-btn" onClick={() => changeMonth(1)}>Next →</button>
                        </div>

                        <div className="calendar-weekdays">
                            <div>Sun</div>
                            <div>Mon</div>
                            <div>Tue</div>
                            <div>Wed</div>
                            <div>Thu</div>
                            <div>Fri</div>
                            <div>Sat</div>
                        </div>

                        <div className="calendar-days">
                            {loading ? (
                                <div className="calendar-loading">Loading events...</div>
                            ) : (
                                renderCalendarCells()
                            )}
                        </div>
                    </div>

                    <aside className="calendar-side-panel">
                        <div className="calendar-upcoming-card">
                            <div className="card-heading">
                                <p className="card-eyebrow">Timeline</p>
                                <h3>Upcoming milestones</h3>
                            </div>
                            <div className="calendar-upcoming-list">
                                {upcomingEvents.length ? (
                                    upcomingEvents.slice(0, 4).map(event => {
                                        const eventTypeKey = resolveTypeKey(event.type);
                                        const eventType = EVENT_TYPE_DETAILS[eventTypeKey];
                                        return (
                                            <div key={event.id} className="upcoming-item">
                                                <span className="upcoming-type" style={{ color: eventType.accent }}>
                                                    {eventType.label}
                                                </span>
                                                <strong>{event.description || event.title}</strong>
                                                <small>{formatTimelineRange(event.startDate, event.endDate)}</small>
                                                {isAdmin && (
                                                    <button type="button" className="upcoming-delete" onClick={() => handleDeleteEvent(event.id)}>
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="calendar-empty-state">No upcoming milestones. Add events to populate this list.</p>
                                )}
                            </div>
                        </div>

                        <div className="calendar-legend-card">
                            <h4>Legend</h4>
                            <ul>
                                {Object.keys(EVENT_TYPE_DETAILS).map((typeKey) => (
                                    <li key={typeKey}>
                                        <span style={{ backgroundColor: EVENT_TYPE_DETAILS[typeKey].accent }}></span>
                                        {EVENT_TYPE_DETAILS[typeKey].label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                </section>
            )}
        </div>
    );
};

export default CalendarPage;