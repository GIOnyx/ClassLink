import React, { useEffect, useState } from 'react';
import '../App.css';
import { createStudent, getStudents } from '../services/backend';

const programs = [
    'College of Computer Studies',
    'College of Arts, Sciences & Education',
    'College of Management, Business & Accountancy',
    'College of Nursing & Allied Sciences',
    'College of Criminal Justice',
    'College of Engineering & Architecture',
];

const StudentPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        program: programs[0],
        yearLevel: 1,
        department: ''
    });

    const loadStudents = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await getStudents();
            setStudents(data);
        } catch (e) {
            setError('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: name === 'yearLevel' ? Number(value) : value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.firstName || !form.lastName || !form.email) {
            setError('First name, last name, and email are required');
            return;
        }
        try {
            await createStudent(form);
            setForm({ firstName: '', lastName: '', email: '', program: programs[0], yearLevel: 1, department: '' });
            await loadStudents();
        } catch (err) {
            const msg = err?.response?.data || 'Failed to create student';
            setError(typeof msg === 'string' ? msg : 'Failed to create student');
        }
    };

    return (
        <div className="student-page-container" style={{ padding: 16 }}>
            <h2 style={{ marginBottom: 12 }}>Students</h2>

            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>Create New Student</h3>
                <p style={{ marginTop: 4, color: '#666' }}>New students get the default password: <strong>123456</strong></p>
                {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}
                <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <input name="firstName" placeholder="First Name" value={form.firstName} onChange={onChange} />
                    <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={onChange} />
                    <input type="email" name="email" placeholder="Email" value={form.email} onChange={onChange} />
                    <select name="program" value={form.program} onChange={onChange}>
                        {programs.map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    <select name="yearLevel" value={form.yearLevel} onChange={onChange}>
                        {[1,2,3,4].map((y) => <option key={y} value={y}>{`Year ${y}`}</option>)}
                    </select>
                    <input name="department" placeholder="Department (optional)" value={form.department} onChange={onChange} />
                    <div style={{ gridColumn: '1 / span 3', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit">Create Student</button>
                    </div>
                </form>
            </div>

            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>All Students</h3>
                {loading ? (
                    <div>Loading students…</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Name</th>
                                    <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Email</th>
                                    <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Program</th>
                                    <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Year</th>
                                    <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Department</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id}>
                                        <td style={{ padding: 8 }}>{s.firstName} {s.lastName}</td>
                                        <td style={{ padding: 8 }}>{s.email}</td>
                                        <td style={{ padding: 8 }}>{s.program || '—'}</td>
                                        <td style={{ padding: 8 }}>{s.yearLevel || '—'}</td>
                                        <td style={{ padding: 8 }}>{s.department || '—'}</td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: 8, color: '#666' }}>No students yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPage;