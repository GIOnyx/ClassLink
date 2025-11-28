import React, { useEffect, useState } from 'react';
import '../App.css';
import './AdminPage.css';
import { getStudentsByStatus, approveStudent, rejectStudent, getDepartments, getPrograms } from '../services/backend';

const SEMESTER_OPTIONS = ['1st', '2nd', 'Summer'];
const MAX_YEARS = 5; // Assuming max 5 years based on Program data loader
const APPLICANT_TYPE_LABELS = {
  NEW: 'New Student',
  TRANSFEREE: 'Transferee',
  CROSS_ENROLLEE: 'Cross-enrollee'
};

const AdminPage = () => {
  const [allPending, setAllPending] = useState([]); // Holds all pending students
  const [departments, setDepartments] = useState([]); //
  const [programs, setPrograms] = useState([]); //
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New state for filters
  const [filters, setFilters] = useState({
    departmentId: '',
    programId: '',
    yearLevel: '',
    semester: '',
  });

  // Modal states (kept original)
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadFilterData = async () => { //
    try {
      const [depsRes, progsRes] = await Promise.all([
        getDepartments(),
        getPrograms(), // Fetch all programs initially
      ]);
      setDepartments(depsRes.data || []);
      // Programs need to be all programs to handle filtering down or can fetch based on selected department
      setPrograms(progsRes.data || []); 
    } catch (e) {
      console.error("Failed to load filter options:", e);
    }
  }

  const loadPendingStudents = async () => {
    setLoading(true);
    setError('');
    try {
      // Load all pending students
      const res = await getStudentsByStatus('PENDING');
      setAllPending(res.data || []);
    } catch (e) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadPendingStudents(); 
    loadFilterData();
  }, []); //

  // Filter change handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ 
      ...prev, 
      [name]: value,
      // If department changes, clear program filter
      ...(name === 'departmentId' && { programId: '' })
    }));
  };

  // Memoized filtered list
  const filteredStudents = allPending.filter(s => {
    // Filter by Department
    if (filters.departmentId) {
        // Need to check if the student has a department and if it matches
        const studentDepId = s.department?.id || '';
        if (studentDepId.toString() !== filters.departmentId) {
            return false;
        }
    }

    // Filter by Program
    if (filters.programId) {
        // Need to check if the student has a program and if it matches
        const studentProgramId = s.program?.id || '';
        if (studentProgramId.toString() !== filters.programId) {
            return false;
        }
    }
    
    // Filter by Year Level
    if (filters.yearLevel) {
        const studentYear = s.yearLevel?.toString() || '';
        if (studentYear !== filters.yearLevel) {
            return false;
        }
    }

    // Filter by Semester
    if (filters.semester) {
        const studentSemester = s.semester || '';
        if (studentSemester !== filters.semester) {
            return false;
        }
    }

    return true;
  });

  // Calculate year options
  const availableYears = Array.from({ length: MAX_YEARS }, (_, i) => (i + 1).toString());

  // Filtered Programs based on selected Department
  const filteredPrograms = programs.filter(p => 
      !filters.departmentId || p.department.id.toString() === filters.departmentId
  );


  // Event handlers (kept original logic, only calling loadPendingStudents to reload)
  const onApprove = async (id) => { 
      if(window.confirm('Approve this student?')) {
          try {
            await approveStudent(id); 
            setSelectedStudent(null);
            await loadPendingStudents(); // Reload all pending students to update the list
          } catch (err) {
            alert("Failed to approve student.");
          }
      }
  };
  
  const initiateReject = (id) => {
      setRejectingId(id);
      setRejectReason(''); 
  };

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
          await loadPendingStudents(); // Reload all pending students to update the list
      } catch (e) {
          console.error(e);
          alert("Failed to reject student.");
      }
  };

  
  const getApplicantTypeLabel = (type) => APPLICANT_TYPE_LABELS[type] || '—';

  return (
    <div className="standard-page-layout">
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-panel">
        <h3 className="admin-sub-header">Filter Applications</h3>
        {/* New Filter UI */}
        <div className="filter-controls-grid">
            {/* Department Filter */}
            <div className="filter-group">
                <label className="filter-label" htmlFor="departmentId">Department</label>
                <select
                    id="departmentId"
                    name="departmentId"
                    value={filters.departmentId}
                    onChange={handleFilterChange}
                    className="filter-select"
                >
                    <option value="">All Departments</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>

            {/* Program Filter */}
            <div className="filter-group">
                <label className="filter-label" htmlFor="programId">Program</label>
                <select
                    id="programId"
                    name="programId"
                    value={filters.programId}
                    onChange={handleFilterChange}
                    className="filter-select"
                    disabled={!filters.departmentId && filteredPrograms.length === 0}
                >
                    <option value="">All Programs</option>
                    {filteredPrograms.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Year Level Filter */}
            <div className="filter-group">
                <label className="filter-label" htmlFor="yearLevel">Year Level</label>
                <select
                    id="yearLevel"
                    name="yearLevel"
                    value={filters.yearLevel}
                    onChange={handleFilterChange}
                    className="filter-select"
                >
                    <option value="">All Years</option>
                    {availableYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {/* Semester Filter */}
            <div className="filter-group">
                <label className="filter-label" htmlFor="semester">Semester</label>
                <select
                    id="semester"
                    name="semester"
                    value={filters.semester}
                    onChange={handleFilterChange}
                    className="filter-select"
                >
                    <option value="">All Semesters</option>
                    {SEMESTER_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
            <button className="btn-clear-filters" onClick={() => setFilters({ departmentId: '', programId: '', yearLevel: '', semester: '' })}>
                Clear Filters
            </button>
        </div>
      </div>


      <div className="admin-panel">
        <h3 className="admin-sub-header">Pending Registrations ({filteredStudents.length} / {allPending.length})</h3>
        {loading ? (
          <div className="admin-loading">Loading…</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Applicant Type</th>
                  <th>Program</th>
                  <th>Year</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>{s.firstName} {s.lastName}</td>
                    <td>{s.email}</td>
                    <td>{getApplicantTypeLabel(s.applicantType)}</td>
                    <td>{s.program ? s.program.name : '—'}</td>
                    <td>{s.yearLevel || '—'}</td>
                    <td>
                      <button className="btn-view" onClick={() => setSelectedStudent(s)}>View</button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="admin-empty-row">No matching pending registrations</td>
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
                <h4 className="section-heading">Application Details</h4>
                <div className="modal-form-grid">
                  <div className="modal-field-group">
                    <label className="modal-label">Applicant Type</label>
                    <div className="modal-value">{getApplicantTypeLabel(selectedStudent.applicantType)}</div>
                  </div>
                  <div className="modal-field-group modal-grid-full">
                    <label className="modal-label">Requirements PDF</label>
                    {selectedStudent.requirementsDocumentUrl ? (
                      <div className="requirements-preview-wrapper">
                        <div className="requirements-preview-actions">
                          <a
                            href={selectedStudent.requirementsDocumentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="doc-link"
                          >
                            Open in new tab
                          </a>
                        </div>
                        <iframe
                          src={selectedStudent.requirementsDocumentUrl}
                          title="Uploaded requirements"
                          className="requirements-preview-frame"
                        />
                      </div>
                    ) : (
                      <div className="modal-value">Not provided</div>
                    )}
                  </div>
                </div>
              </section>

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
                        <div className="modal-field-group">
                            <label className="modal-label">Department</label>
                            <div className="modal-value highlight">{selectedStudent.department ? selectedStudent.department.name : 'Not Assigned'}</div>
                        </div>
                        <div className="modal-field-group">
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
                <button className="modal-btn btn-reject" onClick={() => { setSelectedStudent(null); initiateReject(selectedStudent.id); }}>Reject</button>
                <button className="modal-btn btn-approve" onClick={() => onApprove(selectedStudent.id)}>Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;