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
  const [selectedStudent, setSelectedStudent] = useState(null);

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
    <div
      className="student-page-container"
      style={{
        padding: 40,
        marginTop: 140,
        backgroundColor: '#ffffff', // <-- Added white background
        color: '#333' // <-- Added dark font color
      }}
    >
      <h2 style={{ marginBottom: 12 }}>User Approvals</h2>
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
                    <td style={{ padding: 8 }}>{s.program ? s.program.name : '—'}</td>
                    <td style={{ padding: 8 }}>{s.yearLevel || '—'}</td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => setSelectedStudent(s)} style={{ marginRight: 8 }}>View Application</button>
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

      {/* All Students panel removed per request; pending registrations remain and include approve/reject actions */}
      {selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setSelectedStudent(null)}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: '95%', maxWidth: 900, maxHeight: '85vh', overflowY: 'auto', color: '#111', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Application • {selectedStudent.firstName} {selectedStudent.lastName}</h3>

            <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>First Name</label>
                <input value={selectedStudent.firstName || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Last Name</label>
                <input value={selectedStudent.lastName || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Email</label>
                <input value={selectedStudent.email || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Program</label>
                <input value={selectedStudent.program ? selectedStudent.program.name : ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Year Level</label>
                <input value={selectedStudent.yearLevel || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Status</label>
                <input value={selectedStudent.status || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Birth Date</label>
                <input value={selectedStudent.birthDate || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Gender</label>
                <input value={selectedStudent.gender || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Contact</label>
                <input value={selectedStudent.contactNumber || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Address</label>
                <input value={selectedStudent.studentAddress || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Parent/Guardian</label>
                <input value={selectedStudent.parentGuardianName || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Parent Contact</label>
                <input value={selectedStudent.parentContactNumber || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Parent Email</label>
                <input value={selectedStudent.parentEmailAddress || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600 }}>Previous School</label>
                <input value={selectedStudent.previousSchool || ''} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>

            </form>
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button onClick={() => setSelectedStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;