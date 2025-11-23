import React, { useEffect, useState } from 'react';
import '../App.css';
import './AdminPage.css';
import { getStudentsByStatus, approveStudent, rejectStudent } from '../services/backend';

const AdminPage = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [p] = await Promise.all([getStudentsByStatus('PENDING')]);
      setPending(p.data || []);
    } catch (e) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onApprove = async (id) => { 
      if(window.confirm('Approve this student?')) {
          try {
            await approveStudent(id); 
            setSelectedStudent(null);
            await load();
          } catch (err) {
            alert("Failed to approve student.");
          }
      }
  };
  
  // Open the rejection reason modal
  const initiateReject = (id) => {
      setRejectingId(id);
      setRejectReason(''); // Reset reason
  };

  // Confirm rejection with reason
  const confirmReject = async () => {
      if (!rejectReason.trim()) {
          alert("Please provide a reason for rejection.");
          return;
      }
      try {
          await rejectStudent(rejectingId, rejectReason);
          setRejectingId(null);
          setSelectedStudent(null);
          setRejectReason('');
          await load();
      } catch (e) {
          console.error(e);
          alert("Failed to reject student.");
      }
  };

  return (
    <div className="standard-page-layout">
      <h2 className="admin-header">Student Approvals</h2>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-panel">
        <h3 className="admin-sub-header">Pending Registrations</h3>
        {loading ? (
          <div className="admin-loading">Loading…</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Program</th>
                  <th>Year</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((s) => (
                  <tr key={s.id}>
                    <td>{s.firstName} {s.lastName}</td>
                    <td>{s.email}</td>
                    <td>{s.program ? s.program.name : '—'}</td>
                    <td>{s.yearLevel || '—'}</td>
                    <td>
                      <button className="btn-view" onClick={() => setSelectedStudent(s)}>View</button>
                      <button className="btn-approve" onClick={() => onApprove(s.id)}>Approve</button>
                      <button className="btn-reject" onClick={() => initiateReject(s.id)}>Reject</button>
                    </td>
                  </tr>
                ))}
                {pending.length === 0 && (
                  <tr>
                    <td colSpan={5} className="admin-empty-row">No pending registrations</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Rejection Reason Input Modal */}
      {rejectingId && (
        <div className="modal-overlay" onClick={() => setRejectingId(null)}>
          <div
            className="modal-content application-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            {/* HEADER */}
            <div className="modal-header-row" style={{ borderBottom: "none" }}>
              <div>
                <h2 className="rejection-modal-title">Reject Application</h2>
                <p className="rejection-modal-subtitle">
                  This message will be visible to the student.
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setRejectingId(null)}
              >
                ×
              </button>
            </div>

            {/* BODY */}
            <div className="modal-scroll-body">
              <textarea
                className="rejection-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Invalid ID document submitted, Incorrect Year Level selected..."
              />
            </div>

            {/* FOOTER */}
            <div className="modal-footer rejection-footer">
              <button
                className="modal-btn"
                style={{ background: "#eee", color: "#333" }}
                onClick={() => setRejectingId(null)}
              >
                Cancel
              </button>

              <button className="modal-btn btn-reject" onClick={confirmReject}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content application-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
                <div>
                    <h2 className="modal-title">Application Review</h2>
                    <p className="modal-subtitle">ID: {selectedStudent.id}</p>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedStudent(null)}>×</button>
            </div>

            <div className="modal-scroll-body">
                <section className="modal-section">
                    <h4 className="section-heading">Personal Information</h4>
                    <div className="modal-form-grid">
                        <div className="modal-field-group">
                            <label className="modal-label">First Name</label>
                            <div className="modal-value">{selectedStudent.firstName || 'N/A'}</div>
                        </div>
                        <div className="modal-field-group">
                            <label className="modal-label">Last Name</label>
                            <div className="modal-value">{selectedStudent.lastName || 'N/A'}</div>
                        </div>
                        <div className="modal-field-group">
                            <label className="modal-label">Email</label>
                            <div className="modal-value">{selectedStudent.email || 'N/A'}</div>
                        </div>
                        <div className="modal-field-group">
                            <label className="modal-label">Contact Number</label>
                            <div className="modal-value">{selectedStudent.contactNumber || 'N/A'}</div>
                        </div>
                        <div className="modal-field-group">
                            <label className="modal-label">Birth Date</label>
                            <div className="modal-value">{selectedStudent.birthDate || 'N/A'}</div>
                        </div>
                        <div className="modal-field-group">
                            <label className="modal-label">Gender</label>
                            <div className="modal-value">{selectedStudent.gender || 'N/A'}</div>
                        </div>
                        <div className="modal-field-group modal-grid-full">
                            <label className="modal-label">Address</label>
                            <div className="modal-value">{selectedStudent.studentAddress || 'N/A'}</div>
                        </div>
                    </div>
                </section>

                <section className="modal-section">
                    <h4 className="section-heading">Family Information</h4>
                    <div className="modal-form-grid">
                        <div className="modal-field-group">
                            <label className="modal-label">Guardian Name</label>
                            <div className="modal-value">{selectedStudent.parentGuardianName || 'N/A'}</div>
                        </div>
                        <div className="modal-field-group">
                            <label className="modal-label">Relationship</label>
                            <div className="modal-value">{selectedStudent.relationshipToStudent || 'N/A'}</div>
                        </div>
                        <div className="modal-field-group">
                            <label className="modal-label">Guardian Contact</label>
                            <div className="modal-value">{selectedStudent.parentContactNumber || 'N/A'}</div>
                        </div>
                        <div className="modal-field-group">
                            <label className="modal-label">Guardian Email</label>
                            <div className="modal-value">{selectedStudent.parentEmailAddress || 'N/A'}</div>
                        </div>
                    </div>
                </section>

                <section className="modal-section">
                    <h4 className="section-heading">Academic Information</h4>
                    <div className="modal-form-grid">
                        <div className="modal-field-group modal-grid-full">
                            <label className="modal-label">Program</label>
                            <div className="modal-value highlight">{selectedStudent.program ? selectedStudent.program.name : 'Not Assigned'}</div>
                        </div>
                        <div className="modal-field-group">
                            <label className="modal-label">Year Level</label>
                            <div className="modal-value">{selectedStudent.yearLevel || 'N/A'}</div>
                        </div>
                        <div className="modal-field-group">
                            <label className="modal-label">Semester</label>
                            <div className="modal-value">{selectedStudent.semester || 'N/A'}</div>
                        </div>
                        <div className="modal-field-group modal-grid-full">
                            <label className="modal-label">Previous School</label>
                            <div className="modal-value">{selectedStudent.previousSchool || 'N/A'}</div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="modal-footer">
                {/* Trigger the rejection modal instead of immediate API call */}
                <button className="modal-btn btn-reject" onClick={() => { setSelectedStudent(null); initiateReject(selectedStudent.id); }}>Reject Application</button>
                <button className="modal-btn btn-approve" onClick={() => onApprove(selectedStudent.id)}>Approve Application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;