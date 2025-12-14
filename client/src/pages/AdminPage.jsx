import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import './AdminPage.css';
import { getStudentsByStatus, approveStudent, rejectStudent, getDepartments, getPrograms } from '../services/backend';
import useRequireAdmin from '../hooks/useRequireAdmin';

const SEMESTER_OPTIONS = ['1st', '2nd', 'Summer'];
const MAX_YEARS = 5; // Assuming max 5 years based on Program data loader
const APPLICANT_TYPE_LABELS = {
  NEW: 'New Student',
  TRANSFEREE: 'Transferee',
  CROSS_ENROLLEE: 'Cross-enrollee'
};

const AdminPage = () => {
  const { authorized, loading: authLoading } = useRequireAdmin();

  const [allPending, setAllPending] = useState([]); // Holds all pending students
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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
      setLastUpdated(new Date());
    } catch (e) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !authorized) {
      return;
    }
    loadPendingStudents();
    loadFilterData();
  }, [authLoading, authorized]);

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
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredStudents = useMemo(() => {
    return allPending.filter((s) => {
      if (filters.departmentId) {
        const studentDepId = s.department?.id || '';
        if (studentDepId.toString() !== filters.departmentId) {
          return false;
        }
      }

      if (filters.programId) {
        const studentProgramId = s.program?.id || '';
        if (studentProgramId.toString() !== filters.programId) {
          return false;
        }
      }

      if (filters.yearLevel) {
        const studentYear = s.yearLevel?.toString() || '';
        if (studentYear !== filters.yearLevel) {
          return false;
        }
      }

      if (filters.semester) {
        const studentSemester = s.semester || '';
        if (studentSemester !== filters.semester) {
          return false;
        }
      }

      if (normalizedQuery) {
        const haystack = `${s.firstName || ''} ${s.lastName || ''} ${s.email || ''}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [allPending, filters.departmentId, filters.programId, filters.semester, filters.yearLevel, normalizedQuery]);

  // Calculate year options
  const availableYears = Array.from({ length: MAX_YEARS }, (_, i) => (i + 1).toString());

  // Filtered Programs based on selected Department
  const filteredPrograms = programs.filter(p => 
      !filters.departmentId || p?.department?.id?.toString() === filters.departmentId
  );

  const applicantBreakdown = allPending.reduce(
    (acc, curr) => {
      const key = curr.applicantType || 'OTHER';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { NEW: 0, TRANSFEREE: 0, CROSS_ENROLLEE: 0, OTHER: 0 }
  );

  const insightCards = [
    {
      label: 'Total pending',
      value: allPending.length,
      detail: `${applicantBreakdown.NEW} new · ${applicantBreakdown.TRANSFEREE} transferees`
    },
    {
      label: 'Filtered view',
      value: filteredStudents.length,
      detail: 'Matching current filters'
    },
    {
      label: 'Departments synced',
      value: departments.length || '—',
      detail: 'Active intake hubs'
    },
    {
      label: 'Programs monitored',
      value: programs.length || '—',
      detail: 'Connected curricula'
    }
  ];

  const topApplicants = filteredStudents.slice(0, 4);
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  const clearFilters = () => {
    setFilters({ departmentId: '', programId: '', yearLevel: '', semester: '' });
    setSearchQuery('');
  };


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

  if (authLoading) {
    return <div className="standard-page-layout admin-page">Checking admin access…</div>;
  }

  if (!authorized) {
    return (
      <div className="standard-page-layout admin-page">
        <h1>Not authorized</h1>
        <p>You must be signed in as an administrator to view this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-page standard-page-layout">
      {error && <div className="admin-error">{error}</div>}

      <section className="admin-hero">
        <div className="admin-hero-content">
          <p className="admin-hero-kicker">Admissions control center</p>
          <h1 className="admin-hero-title">Pending Applications Queue</h1>
          <p className="admin-hero-subtitle">
            Monitor every incoming registration in one place. Apply focused filters, review supporting files,
            and keep applicants moving forward without guesswork.
          </p>
          <div className="admin-hero-meta">
            <span>Last synced · {lastUpdatedLabel}</span>
            <span className={loading ? 'status-chip syncing' : 'status-chip live'}>
              {loading ? 'Syncing data…' : 'Live queue'}
            </span>
          </div>
        </div>
        <div className="admin-hero-actions">
          <button className="admin-ghost-btn" type="button" onClick={clearFilters}>Reset filters</button>
          <button className="admin-primary-btn" type="button" onClick={loadPendingStudents} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh queue'}
          </button>
        </div>
      </section>

      <section className="admin-insights-grid">
        {insightCards.map((card) => (
          <article key={card.label} className="admin-insight-card">
            <p className="insight-label">{card.label}</p>
            <p className="insight-value">{card.value}</p>
            <p className="insight-detail">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="admin-main-grid">
        <aside className="filters-panel">
          <div className="filters-panel-header">
            <div>
              <p className="panel-kicker">Filters</p>
              <h3>Focus the review</h3>
            </div>
            <span className="panel-count">Showing {filteredStudents.length} of {allPending.length}</span>
          </div>

          <div className="admin-search-bar">
            <input
              type="search"
              className="admin-search-input"
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-controls-grid modern">
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
          </div>

          <div className="filters-panel-footer">
            <button className="btn-clear-filters" onClick={clearFilters} type="button">
              Clear filters
            </button>
            <p className="filters-help-text">Use filters to surface specific cohorts or keep it blank to see everyone.</p>
          </div>
        </aside>

        <section className="queue-panel">
          <div className="queue-toolbar">
            <div>
              <h3>Applications queue</h3>
              <p>{filteredStudents.length === 0 ? 'No applicants match the current filters.' : `${filteredStudents.length} applicants ready for review.`}</p>
            </div>
            <div className="queue-toolbar-meta">
              <span className="queue-pill">{filters.semester || 'All terms'}</span>
            </div>
          </div>

          {loading ? (
            <div className="admin-loading">Loading…</div>
          ) : (
            <div className="admin-table-wrapper modern">
              <table className="admin-table queue-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Program</th>
                    <th>Year</th>
                    <th>Applicant type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="applicant-cell">
                          <p className="applicant-name">{s.firstName} {s.lastName}</p>
                          <span className="applicant-email">{s.email}</span>
                        </div>
                      </td>
                      <td>
                        <p className="applicant-program">{s.program ? s.program.name : '—'}</p>
                        <span className="applicant-department">{s.department ? s.department.name : 'Unassigned'}</span>
                      </td>
                      <td>{s.yearLevel || '—'}</td>
                      <td>
                        <span className={`applicant-badge type-${(s.applicantType || 'other').toLowerCase()}`}>
                          {getApplicantTypeLabel(s.applicantType)}
                        </span>
                      </td>
                      <td className="queue-actions">
                        <button className="btn-view" onClick={() => setSelectedStudent(s)}>Open</button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="admin-empty-row">No matching pending registrations</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      <section className="admin-secondary-grid">
        <div className="applications-stack">
          <div className="panel-header">
            <p className="panel-kicker">Spotlight</p>
            <h3>Next in queue</h3>
          </div>
          {topApplicants.length === 0 ? (
            <p className="admin-empty-row">No applicants available under the current filters.</p>
          ) : (
            <ul className="admin-stack-list">
              {topApplicants.map((applicant) => (
                <li key={applicant.id} className="stack-card">
                  <div>
                    <p className="stack-name">{applicant.firstName} {applicant.lastName}</p>
                    <p className="stack-meta">{applicant.program ? applicant.program.name : 'Unassigned'} · {applicant.semester || '—'} semester</p>
                  </div>
                  <button type="button" className="stack-view" onClick={() => setSelectedStudent(applicant)}>
                    Review
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="guides-panel">
          <div className="panel-header">
            <p className="panel-kicker">Review checklist</p>
            <h3>Before approving</h3>
          </div>
          <ul className="guide-list">
            <li>Verify submitted PDF requirements are readable and complete.</li>
            <li>Double-check department and program assignments for transfer students.</li>
            <li>Capture rejection reasons with helpful, action-oriented language.</li>
          </ul>
        </div>
      </section>
      
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