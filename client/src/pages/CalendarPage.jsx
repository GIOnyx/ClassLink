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
            const type = event.type || 'EVENT'; // Default to EVENT if type is missing
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(event);
            return acc;
        }, {});
    }, [events]);

    const renderSummaryView = () => (
        <div className="summary-list-container" style={{padding: '24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eee'}}>
            <h2 style={{color: '#800000', marginBottom: '30px'}}>Academic Calendar {currentSchoolYear} Summary</h2>
            
            {loading && <p>Loading summary...</p>}
            
            {!loading && Object.keys(eventTypeTitles).map(typeKey => (
                <div key={typeKey} style={{marginBottom: '40px'}}>
                    <h3 style={{borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', marginBottom: '15px', color: '#333'}}>
                        {eventTypeTitles[typeKey]}
                    </h3>
                    
                    {groupedEvents[typeKey] && groupedEvents[typeKey].length > 0 ? (
                        <ul style={{listStyle: 'none', paddingLeft: '0'}}>
                            {groupedEvents[typeKey].map(event => (
                                <li key={event.id} style={{marginBottom: '10px', padding: '10px', borderLeft: `5px solid ${getEventColor(typeKey)}`, backgroundColor: '#fafafa', borderRadius: '4px'}}>
                                    
                                    {/* 1. Display Date Range (in red/maroon) */}
                                    <strong style={{marginRight: '10px', color: '#800000'}}>
                                        {formatDateRange(event.startDate, event.endDate)}
                                    </strong>
                                    
                                    {/* 2. COMPLETELY REMOVE TITLE if description exists; otherwise, use title */}
                                    <span style={{color: '#333'}}>
                                        {event.description
                                            ? `— ${event.description}`
                                            : `— ${event.title}`
                                        }
                                    </span>
                                    
                                    {isAdmin && (
                                        <span 
                                            className="delete-event" 
                                            onClick={() => handleDeleteEvent(event.id)} 
                                            style={{marginLeft: '15px', fontWeight: 'normal', color: '#999', cursor: 'pointer'}}>
                                            [Delete]
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{color: '#999'}}>No {typeKey} events scheduled yet.</p>
                    )}
                </div>
            ))}
            
            {!loading && events.length === 0 && (
                <p>The academic calendar is currently empty.</p>
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
            {/* Admin Form Section */}
            {isAdmin && (
                <div className="admin-calendar-form">
                    <h3 className="form-header">Manage Academic Calendar</h3>
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
                </div>
            )}

            {/* Calendar View Container */}
            <div className="calendar-container">
                <div className="calendar-header">
                    {/* Month Navigation */}
                    {!isSummaryView && (
                        <>
                            <button className="calendar-nav-btn" onClick={() => changeMonth(-1)}>← Prev</button>
                            <h2 className="calendar-title">{monthNames[month]} {year}</h2>
                            <button className="calendar-nav-btn" onClick={() => changeMonth(1)}>Next →</button>
                        </>
                    )}
                    
                    {/* Summary View Title */}
                    {isSummaryView && (
                        <h2 className="calendar-title">Academic Calendar Overview</h2>
                    )}
                    
                    {/* Summary Button (Visible to all users) */}
                    <button 
                        className="calendar-nav-btn" 
                        onClick={() => setIsSummaryView(!isSummaryView)}
                        style={{marginLeft: 'auto', backgroundColor: isSummaryView ? '#800000' : '#fff', color: isSummaryView ? 'white' : '#333'}}
                    >
                        {isSummaryView ? 'Back to Calendar Grid' : 'View Summary List'}
                    </button>
                </div>
                
                {/* Conditional Rendering of Grid vs. Summary */}
                {isSummaryView ? (
                    // 1. Summary List View
                    renderSummaryView()
                ) : (
                    // 2. Calendar Grid View
                    <>
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
                                <div style={{gridColumn: '1 / span 7', padding: '20px', textAlign: 'center'}}>Loading events...</div>
                            ) : (
                                renderCalendarCells()
                            )}
                        </div>
                    </>
                )}
            </div>
            
            {/* Legend - Only show in Calendar Grid View */}
            {!isSummaryView && (
                <div style={{display: 'flex', gap: '15px', fontSize: '0.9rem', color: '#333', paddingLeft: '5px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                        <div style={{width:'12px', height:'12px', backgroundColor:'#d32f2f', borderRadius:'2px'}}></div> Exams
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                        <div style={{width:'12px', height:'12px', backgroundColor:'#2e7d32', borderRadius:'2px'}}></div> Holidays
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                        <div style={{width:'12px', height:'12px', backgroundColor:'#1976d2', borderRadius:'2px'}}></div> Events
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                        <div style={{width:'12px', height:'12px', backgroundColor:'#f57c00', borderRadius:'2px'}}></div> Semester End
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;