import React, { useEffect, useState } from 'react';
import '../App.css';
import { getStudentsByStatus, approveStudent, rejectStudent, getStudents } from '../services/backend';

const StatusPill = ({ value }) => (
  <span style={{
    padding: '2px 8px',
    borderRadius: 999,
    background: value === 'APPROVED' ? '#e6ffed' : value === 'REJECTED' ? '#ffe6e6' : '#fff8e1',
    color: value === 'APPROVED' ? '#087f23' : value === 'REJECTED' ? '#b00020' : '#8a6d3b',
    border: '1px solid #eee',
    fontSize: 12
  }}>{value}</span>
);

const AdminPage = () => {
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [p, a] = await Promise.all([
        getStudentsByStatus('PENDING'),
        getStudents(),
      ]);
      setPending(p.data || []);
      setAll(a.data || []);
    } catch (e) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onApprove = async (id) => {
    await approveStudent(id);
    await load();
  };

  const onReject = async (id) => {
    await rejectStudent(id);
    await load();
  };

  return (
    <div className="student-page-container" style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Admin • User Approvals</h2>
      {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Pending Registrations</h3>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Name</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Email</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Program</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Year</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((s) => (
                  <tr key={s.id}>
                    <td style={{ padding: 8 }}>{s.firstName} {s.lastName}</td>
                    <td style={{ padding: 8 }}>{s.email}</td>
                    <td style={{ padding: 8 }}>{s.program || '—'}</td>
                    <td style={{ padding: 8 }}>{s.yearLevel || '—'}</td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => onApprove(s.id)} style={{ marginRight: 8 }}>Approve</button>
                      <button onClick={() => onReject(s.id)} className="danger">Reject</button>
                    </td>
                  </tr>
                ))}
                {pending.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 8, color: '#666' }}>No pending registrations</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>All Students</h3>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Name</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Email</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Program</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Year</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {all.map((s) => (
                  <tr key={s.id}>
                    <td style={{ padding: 8 }}>{s.firstName} {s.lastName}</td>
                    <td style={{ padding: 8 }}>{s.email}</td>
                    <td style={{ padding: 8 }}>{s.program || '—'}</td>
                    <td style={{ padding: 8 }}>{s.yearLevel || '—'}</td>
                    <td style={{ padding: 8 }}><StatusPill value={s.status || '—'} /></td>
                  </tr>
                ))}
                {all.length === 0 && (
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

export default AdminPage;
