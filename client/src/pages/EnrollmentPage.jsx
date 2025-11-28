import React, { useState, useEffect } from 'react';
import { submitStudentApplication, getMyStudent, uploadMyRequirementsDocument } from '../services/backend';
import useDepartments from '../hooks/useDepartments';
import usePrograms from '../hooks/usePrograms';
import '../App.css';
import './EnrollmentPage.css';

const APPLICANT_TYPE_DETAILS = [
  {
    value: 'NEW',
    label: 'College / New Student',
    heroTitle: 'College / New Students',
    requirements: [
      { text: 'Report Card / Form 138' },
      { text: 'Applicants with a general average of 90%+ are exempt from the entrance exam.', note: true },
      { text: 'Certificate of Good Moral Character' },
      { text: 'PSA Certificate of Live Birth' },
    ],
  },
  {
    value: 'TRANSFEREE',
    label: 'College Transferee',
    heroTitle: 'College Transferees',
    requirements: [
      { text: 'Certificate of Transfer Credentials or Honorable Dismissal' },
      { text: 'Transcript of Record for Evaluation' },
      { text: 'Certificate of Good Moral Character' },
      { text: 'PSA Certificate of Live Birth' },
    ],
  },
  {
    value: 'CROSS_ENROLLEE',
    label: 'College Cross-enrollee',
    heroTitle: 'College Cross-enrollees',
    requirements: [
      { text: 'Permit to cross-enroll' },
      { text: 'Certificate of Good Moral Character' },
    ],
  },
];

const RELATIONSHIP_OPTIONS = [
  'Mother',
  'Father',
  'Guardian',
  'Grandmother',
  'Grandfather',
  'Aunt',
  'Uncle',
  'Sibling',
  'Cousin',
  'Family Friend',
  'Other',
];

const APPLICANT_TYPE_OPTIONS = APPLICANT_TYPE_DETAILS.map(({ value, label }) => ({ value, label }));

const EnrollmentPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingApp, setExistingApp] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    applicantType: '', requirementsDocumentUrl: '',
    firstName: '', lastName: '', birthDate: '', gender: 'Male', studentAddress: '', contactNumber: '', emailAddress: '',
    parentGuardianName: '', relationshipToStudent: '', parentContactNumber: '', parentEmailAddress: '',
    departmentId: null, programId: null, yearLevel: null, semester: '', previousSchool: '',
  });
  const { departments, loading: depsLoading } = useDepartments();
  const { programs, loading: programsLoading, refresh: refreshPrograms } = usePrograms(formData.departmentId);
  const [yearOptions, setYearOptions] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [requirementsUploading, setRequirementsUploading] = useState(false);
  const [requirementsUploadError, setRequirementsUploadError] = useState('');
  
  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'emailAddress') {
      return; // email is bound to login email only
    }

    if (name === 'contactNumber' || name === 'parentContactNumber') {
      // keep only digits and clamp to 11 characters
      value = value.replace(/[^0-9]/g, '').slice(0, 11);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- REUSABLE HANDLERS (Used in both Wizard and Edit Mode) ---
  const handleDepartmentChange = async (e) => {
    const deptId = e.target.value ? Number(e.target.value) : null;
    setFormData(prev => ({ ...prev, departmentId: deptId, programId: null, yearLevel: null }));
    setYearOptions([]);
    // programs will be fetched automatically by the usePrograms hook based on formData.departmentId
  };

  const handleProgramChange = (e) => {
    const pid = e.target.value ? Number(e.target.value) : null;
    setFormData(prev => ({ ...prev, programId: pid, yearLevel: null }));
    const sel = programs && programs.find(p => p.id === pid);
    if (sel && sel.durationInYears) {
      setYearOptions(Array.from({ length: sel.durationInYears }, (_, i) => i + 1));
    } else { setYearOptions([]); }
  };

  const totalSteps = 4;

  const nextStep = () => {
    setError('');
    if (currentStep === 1) {
      if (requirementsUploading) {
        setError('Please wait for the requirements upload to finish.');
        return;
      }
      if (!formData.applicantType) {
        setError('Please select the type of applicant.');
        return;
      }
      if (!formData.requirementsDocumentUrl) {
        setError('Please upload your requirements PDF before continuing.');
        return;
      }
    }
    if (currentStep === 2) {
      const { firstName, lastName, birthDate, emailAddress } = formData;
      if (!firstName || !lastName || !birthDate || !emailAddress) {
        setError('Please fill out all required fields: Name, Birth Date, and Email.');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.parentGuardianName || !formData.parentContactNumber) {
        setError('Please fill out Parent/Guardian Name and Contact Number.');
        return; 
      }
    }
    if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { applicantType, requirementsDocumentUrl, firstName, lastName, emailAddress, birthDate, departmentId, programId, yearLevel, semester } = formData;
    if (!applicantType || !requirementsDocumentUrl) {
      setError('Please complete the applicant type and requirements upload step.');
      setCurrentStep(1);
      return;
    }
    if (!firstName || !lastName || !emailAddress || !birthDate) {
      setError('Please go back and fill out all required student fields.');
      setCurrentStep(2);
      return;
    }
    if (!departmentId || !programId || !yearLevel || !semester) {
      setError('Please complete all academic information fields.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...formData };
      console.debug('Submitting student application payload:', payload);
      const res = await submitStudentApplication(payload);
      setExistingApp(res.data || null);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Enrollment submission error:', err);
      // Try to show a helpful server message when available
      const serverMsg = err?.response?.data;
      if (serverMsg && typeof serverMsg === 'string') {
        setError(serverMsg);
      } else if (serverMsg && typeof serverMsg === 'object' && serverMsg.message) {
        setError(serverMsg.message);
      } else {
        setError('Submission failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyStudent();
        const student = res.data;
        const loginEmail = student?.email || student?.emailAddress || '';
        if (loginEmail) {
          setCurrentUserEmail(loginEmail);
        }
        setFormData(prev => ({
          ...prev,
          emailAddress: loginEmail || prev.emailAddress,
          firstName: prev.firstName || student?.firstName || '',
          lastName: prev.lastName || student?.lastName || ''
        }));
          // consider there an existing application if student has program/previous info OR a non-null status
            const hasApplication = student && (student.program || student.parentGuardianName || student.previousSchool || (student.status && student.status !== 'REGISTERED'));
          if (hasApplication) {
              setExistingApp(student);
              if (student.status && student.status === 'REJECTED') {
                  setEditMode(true);
                  setError('Your application was rejected. Please review your details and resubmit.');
              }
                // Only show 'under review' when the server reports PENDING
                if (student.status && student.status === 'PENDING') {
                  setError('Your application is under review. Please wait for the admin decision before making changes.');
                }
          }
      } catch (err) {}
    };
    load();
    // departments are provided by useDepartments hook
  }, []);

  useEffect(() => {
    if (!existingApp) return;
    setFormData(prev => ({
      applicantType: existingApp.applicantType || prev.applicantType,
      requirementsDocumentUrl: existingApp.requirementsDocumentUrl || prev.requirementsDocumentUrl,
      firstName: existingApp.firstName || prev.firstName,
      lastName: existingApp.lastName || prev.lastName,
      birthDate: existingApp.birthDate || prev.birthDate,
      gender: existingApp.gender || prev.gender,
      studentAddress: existingApp.studentAddress || prev.studentAddress,
      contactNumber: existingApp.contactNumber || prev.contactNumber,
      emailAddress: currentUserEmail || existingApp.email || existingApp.emailAddress || prev.emailAddress,
      parentGuardianName: existingApp.parentGuardianName || prev.parentGuardianName,
      relationshipToStudent: existingApp.relationshipToStudent || prev.relationshipToStudent,
      parentContactNumber: existingApp.parentContactNumber || prev.parentContactNumber,
      parentEmailAddress: existingApp.parentEmailAddress || prev.parentEmailAddress,
      departmentId: existingApp.departmentId || existingApp.department?.id || prev.departmentId,
      programId: existingApp.programId || existingApp.program?.id || prev.programId,
      yearLevel: existingApp.yearLevel || prev.yearLevel,
      semester: existingApp.semester || prev.semester,
      previousSchool: existingApp.previousSchool || prev.previousSchool,
    }));
    // programs will be fetched by the usePrograms hook when formData.departmentId is set above
  }, [existingApp, currentUserEmail]);


  // When programs load (or change) and there's a selected program in the form, set year options
  useEffect(() => {
    if (formData.programId && programs && programs.length > 0) {
      const sel = programs.find(p => p.id === formData.programId);
      if (sel && sel.durationInYears) {
        setYearOptions(Array.from({ length: sel.durationInYears }, (_, i) => i + 1));
      }
    }
  }, [programs, formData.programId]);

  const startEdit = () => setEditMode(true);
  const cancelEdit = () => {
    setEditMode(false);
    setError('');
  };

  const handleSave = async (e) => {
    e && e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...formData, id: existingApp?.id };
      const res = await submitStudentApplication(payload);
      setExistingApp(res.data || existingApp);
      setEditMode(false);
      setError('');
    } catch (err) {
      setError('Save failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const beginApplication = () => {
    // Prevent starting new application if there's an existing one under review
    if (existingApp && existingApp.status && existingApp.status !== 'REJECTED') {
      setError('Your application is under review. Please wait for the admin decision before making changes.');
      return;
    }
    setError('');
    setRequirementsUploadError('');
    setCurrentStep(1);
    setShowWizard(true);
  };

  const handleRequirementsUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setRequirementsUploadError('Please upload a PDF file.');
      e.target.value = '';
      return;
    }

    setRequirementsUploadError('');
    setRequirementsUploading(true);
    try {
      const res = await uploadMyRequirementsDocument(file);
      const url = res.data?.requirementsDocumentUrl;
      if (url) {
        setFormData(prev => ({ ...prev, requirementsDocumentUrl: url }));
      }
    } catch (err) {
      setRequirementsUploadError('Upload failed. Please try again.');
    } finally {
      setRequirementsUploading(false);
      e.target.value = '';
    }
  };

  const selectedTypeDetails = APPLICANT_TYPE_DETAILS.find(type => type.value === formData.applicantType);

  // --- RENDER ---
  if (existingApp) {
    const status = (existingApp.status || 'Pending').toUpperCase();
    const statusClass = status === 'APPROVED' ? 'status-approved' : status === 'PENDING' ? 'status-pending' : 'status-rejected';

    return (
      <div className="standard-page-layout">
        <div className="enrollment-form-container with-margin">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 className="status-header">
                Application Status: <span className={`status-label ${statusClass}`}>{status}</span>
              </h3>
          </div>
            {status === 'PENDING' && (
              <p className="status-note">Your application has been submitted and is awaiting admin review. Edits will be available only if the application is rejected.</p>
            )}
            {status === 'APPROVED' && existingApp.accountId && (
              <div className="account-id-banner">
                <div>
                  <p className="account-id-label">Official Account ID</p>
                  <p className="account-id-value">{existingApp.accountId}</p>
                </div>
                <p className="account-id-hint">Use this ID with your password as an alternative login option.</p>
              </div>
            )}
            {status === 'REJECTED' && (
              <div className="rejection-alert">
                  <div className="rejection-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  </div>
                  <div className="rejection-content">
                      <h4 className="rejection-title">Action Required</h4>
                      <p className="rejection-message">
                          {existingApp.rejectionReason || "Your application needs some corrections. Please review your details below."}
                      </p>
                      <p className="rejection-subtext">Please correct the information below and resubmit.</p>
                  </div>
              </div>
          )}
        </div>
        
        <form className="enrollment-form-container" onSubmit={handleSave}>
            <section>
              <h3 className="enrollment-section-title">Application Details</h3>
              <div className="enrollment-grid">
                <div className="enrollment-form-group enrollment-grid-full">
                  <label className="enrollment-label">Applicant Type</label>
                  <div className="enrollment-radio-group applicant-type-group">
                    {APPLICANT_TYPE_OPTIONS.map(option => (
                      <label key={option.value} className={`enrollment-radio-label ${formData.applicantType === option.value ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="applicantType"
                          value={option.value}
                          checked={formData.applicantType === option.value}
                          onChange={handleChange}
                          disabled={!editMode}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="enrollment-form-group enrollment-grid-full">
                  <label className="enrollment-label">Requirements PDF</label>
                  <div className="requirements-upload-row">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleRequirementsUpload}
                      disabled={!editMode || requirementsUploading}
                    />
                    {requirementsUploading && <span className="upload-hint">Uploading…</span>}
                    {formData.requirementsDocumentUrl ? (
                      <a href={formData.requirementsDocumentUrl} target="_blank" rel="noreferrer" className="upload-hint">View uploaded PDF</a>
                    ) : (
                      <span className="upload-hint">No file uploaded yet</span>
                    )}
                    {requirementsUploadError && <span className="enrollment-error small">{requirementsUploadError}</span>}
                    <small>Accepted format: PDF up to 10MB.</small>
                  </div>
                </div>
                {selectedTypeDetails && (
                  <div className="enrollment-form-group enrollment-grid-full">
                    <div className="selected-requirements-card">
                      <p className="selected-requirements-title">Requirements for {selectedTypeDetails.heroTitle || selectedTypeDetails.label}</p>
                      <ul>
                        {selectedTypeDetails.requirements.map((req, idx) => (
                          <li key={idx} className={req.note ? 'note' : ''}>{req.text}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>
            <section>
              <h3 className="enrollment-section-title">Student Information</h3>
              <div className="enrollment-grid">
                <div className="enrollment-form-group"><label className="enrollment-label">First Name</label><input className="enrollment-input" name="firstName" value={formData.firstName} onChange={handleChange} disabled={!editMode}/></div>
                <div className="enrollment-form-group"><label className="enrollment-label">Last Name</label><input className="enrollment-input" name="lastName" value={formData.lastName} onChange={handleChange} disabled={!editMode}/></div>
                <div className="enrollment-form-group"><label className="enrollment-label">Birth Date</label><input type="date" className="enrollment-input" name="birthDate" value={formData.birthDate} onChange={handleChange} disabled={!editMode}/></div>
                <div className="enrollment-form-group">
                  <label className="enrollment-label">Gender</label>
                  <div className="enrollment-radio-group">
                    <label className="enrollment-radio-label"><input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} disabled={!editMode}/> Male</label>
                    <label className="enrollment-radio-label"><input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} disabled={!editMode}/> Female</label>
                  </div>
                </div>
                <div className="enrollment-form-group enrollment-grid-full"><label className="enrollment-label">Address</label><input className="enrollment-input" name="studentAddress" value={formData.studentAddress} onChange={handleChange} disabled={!editMode}/></div>
                <div className="enrollment-form-group"><label className="enrollment-label">Contact</label><input className="enrollment-input" name="contactNumber" value={formData.contactNumber} onChange={handleChange} disabled={!editMode}/></div>
                <div className="enrollment-form-group"><label className="enrollment-label">Email</label><input className="enrollment-input" name="emailAddress" value={formData.emailAddress} readOnly title="Email is tied to your login account" /></div>
              </div>
            </section>

            <section>
              <h3 className="enrollment-section-title">Parent / Guardian</h3>
              <div className="enrollment-grid">
                <div className="enrollment-form-group enrollment-grid-full"><label className="enrollment-label">Guardian Name</label><input className="enrollment-input" name="parentGuardianName" value={formData.parentGuardianName} onChange={handleChange} disabled={!editMode}/></div>
                <div className="enrollment-form-group">
                  <label className="enrollment-label">Relationship</label>
                  <select
                    className="enrollment-input"
                    name="relationshipToStudent"
                    value={formData.relationshipToStudent || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                  >
                    <option value="">Select relationship…</option>
                    {RELATIONSHIP_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="enrollment-form-group"><label className="enrollment-label">Guardian Contact</label><input className="enrollment-input" name="parentContactNumber" value={formData.parentContactNumber} onChange={handleChange} disabled={!editMode}/></div>
              </div>
            </section>

            <section>
              <h3 className="enrollment-section-title">Academic</h3>
              {/* ✨ FIXED: Replaced static text inputs with Dropdowns & Logic same as Wizard */}
              <div className="enrollment-grid">
                 <div className="enrollment-form-group">
                    <label className="enrollment-label">Department</label>
                    <select name="departmentId" value={formData.departmentId || ''} onChange={handleDepartmentChange} className="enrollment-input" disabled={!editMode}>
                      <option value="">Select department…</option>
                      {departments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                    </select>
                 </div>
                 
                 <div className="enrollment-form-group">
                    <label className="enrollment-label">Program</label>
                    <select name="programId" value={formData.programId || ''} onChange={handleProgramChange} className="enrollment-input" disabled={!editMode || programs.length === 0}>
                      <option value="">Select program…</option>
                      {programs.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                 </div>
                 
                 <div className="enrollment-form-group">
                    <label className="enrollment-label">Year Level</label>
                    <select name="yearLevel" value={formData.yearLevel || ''} onChange={(e) => setFormData(prev => ({ ...prev, yearLevel: e.target.value ? Number(e.target.value) : null }))} className="enrollment-input" disabled={!editMode || yearOptions.length === 0}>
                      <option value="">Select year…</option>
                      {yearOptions.map(y => (<option key={y} value={y}>{y}</option>))}
                    </select>
                 </div>

                 <div className="enrollment-form-group">
                    <label className="enrollment-label">Semester</label>
                    <select name="semester" value={formData.semester || ''} onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))} className="enrollment-input" disabled={!editMode}>
                      <option value="">Select semester…</option>
                      <option value="1st">1st</option>
                      <option value="2nd">2nd</option>
                      <option value="summer">Summer</option>
                    </select>
                 </div>
                 
                 <div className="enrollment-form-group enrollment-grid-full">
                    <label className="enrollment-label">Previous School</label>
                    <input className="enrollment-input" name="previousSchool" value={formData.previousSchool} onChange={handleChange} disabled={!editMode} />
                 </div>
              </div>
            </section>

            <div className="enrollment-edit-actions">
              {!editMode ? (
                status === 'REJECTED' && <button type="button" onClick={startEdit} className="enrollment-submit-btn">Edit Information</button>
              ) : (
                <>
                  <button type="button" onClick={handleSave} className="enrollment-submit-btn" disabled={loading}>
                      {status === 'REJECTED' ? 'Resubmit Application' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={cancelEdit} className="enrollment-submit-btn enrollment-back-btn">Cancel</button>
                </>
              )}
            </div>
        </form>
      </div>
    );
  }

  if (!showWizard) {
    return (
      <div className="standard-page-layout enrollment-intro">
        <section className="enrollment-hero">
          <div>
            <p className="enrollment-pill">Welcome to CIT-University Online</p>
            <h1>Start your journey</h1>
            <p className="enrollment-hero-copy">
              New applicants are greeted here. Review the enrollment requirements, prepare your documents,
              and begin the three-step application whenever you are ready.
            </p>
            <button type="button" className="enrollment-submit-btn" onClick={beginApplication} disabled={existingApp && existingApp.status && existingApp.status !== 'REJECTED'}>
              Start Application
            </button>
            {existingApp && existingApp.status && existingApp.status !== 'REJECTED' ? (
              <div className="enrollment-error" style={{ marginTop: 12 }}>
                Your application is under review. Please wait for the admin decision before making changes.
              </div>
            ) : null}
          </div>
          <div className="enrollment-hero-note">
            <p>Need help?</p>
            <span>Email admissions@cit.edu.ph for assistance.</span>
          </div>
        </section>

        <section className="requirements-section">
          <h2>Enrollment Requirements</h2>
          <div className="requirements-grid">
            {APPLICANT_TYPE_DETAILS.map(detail => (
              <article key={detail.value}>
                <h3>{detail.heroTitle}</h3>
                <ul>
                  {detail.requirements.map((req, idx) => (
                    <li key={idx} className={req.note ? 'note' : ''}>{req.text}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // --- NEW APPLICATION WIZARD RENDER ---
  return (
    <div className="standard-page-layout">
      <form className="enrollment-form-container" onSubmit={handleSubmit}>
        <h2 className="enrollment-header">Student Enrollment Form (Step {currentStep} of {totalSteps})</h2>
        
        {currentStep === 1 && (
          <section>
            <h3 className="enrollment-section-title">Application Details</h3>
            <div className="enrollment-grid">
              <div className="enrollment-form-group enrollment-grid-full">
                <label className="enrollment-label">Applicant Type</label>
                <div className="enrollment-radio-group applicant-type-group">
                  {APPLICANT_TYPE_OPTIONS.map(option => (
                    <label key={option.value} className={`enrollment-radio-label ${formData.applicantType === option.value ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="applicantType"
                        value={option.value}
                        checked={formData.applicantType === option.value}
                        onChange={handleChange}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="enrollment-form-group enrollment-grid-full">
                <label className="enrollment-label">Requirements PDF</label>
                <input type="file" accept="application/pdf" onChange={handleRequirementsUpload} className="enrollment-input" disabled={requirementsUploading} />
                {requirementsUploading && <p className="upload-hint">Uploading…</p>}
                {formData.requirementsDocumentUrl && (
                  <p className="upload-hint">
                    Uploaded: <a href={formData.requirementsDocumentUrl} target="_blank" rel="noreferrer">View file</a>
                  </p>
                )}
                {requirementsUploadError && <p className="enrollment-error">{requirementsUploadError}</p>}
                {!formData.requirementsDocumentUrl && !requirementsUploading && (
                  <p className="upload-hint">Upload a single PDF containing the listed requirements.</p>
                )}
              </div>
              {selectedTypeDetails && (
                <div className="enrollment-form-group enrollment-grid-full">
                  <div className="selected-requirements-card">
                    <p className="selected-requirements-title">Requirements for {selectedTypeDetails.heroTitle || selectedTypeDetails.label}</p>
                    <ul>
                      {selectedTypeDetails.requirements.map((req, idx) => (
                        <li key={idx} className={req.note ? 'note' : ''}>{req.text}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section>
            <h3 className="enrollment-section-title">Student Information</h3>
            <div className="enrollment-grid">
              <div className="enrollment-form-group"><label htmlFor="firstName" className="enrollment-label">First Name</label><input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="enrollment-input" /></div>
              <div className="enrollment-form-group"><label htmlFor="lastName" className="enrollment-label">Last Name</label><input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className="enrollment-input" /></div>
              <div className="enrollment-form-group"><label htmlFor="birthDate" className="enrollment-label">Birth Date</label><input type="date" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleChange} className="enrollment-input" /></div>
              <div className="enrollment-form-group">
                <label className="enrollment-label">Gender</label>
                <div className="enrollment-radio-group">
                  <label className="enrollment-radio-label"><input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} /> Male</label>
                  <label className="enrollment-radio-label"><input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} /> Female</label>
                </div>
              </div>
              <div className="enrollment-form-group enrollment-grid-full"><label htmlFor="studentAddress" className="enrollment-label">Address</label><input id="studentAddress" name="studentAddress" value={formData.studentAddress} onChange={handleChange} className="enrollment-input" /></div>
              <div className="enrollment-form-group"><label htmlFor="contactNumber" className="enrollment-label">Contact Number</label><input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="enrollment-input" /></div>
              <div className="enrollment-form-group"><label htmlFor="emailAddress" className="enrollment-label">Email Address</label><input type="email" id="emailAddress" name="emailAddress" value={formData.emailAddress} readOnly className="enrollment-input" title="Email is tied to your login account" /></div>
            </div>
          </section>
        )}

        {currentStep === 3 && (
          <section>
            <h3 className="enrollment-section-title">Parent / Guardian Information</h3>
            <div className="enrollment-grid">
              <div className="enrollment-form-group enrollment-grid-full"><label htmlFor="parentGuardianName" className="enrollment-label">Parent/Guardian Name</label><input id="parentGuardianName" name="parentGuardianName" value={formData.parentGuardianName} onChange={handleChange} className="enrollment-input" /></div>
              <div className="enrollment-form-group">
                <label htmlFor="relationshipToStudent" className="enrollment-label">Relationship</label>
                <select
                  id="relationshipToStudent"
                  name="relationshipToStudent"
                  value={formData.relationshipToStudent || ''}
                  onChange={handleChange}
                  className="enrollment-input"
                >
                  <option value="">Select relationship…</option>
                  {RELATIONSHIP_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="enrollment-form-group"><label htmlFor="parentContactNumber" className="enrollment-label">Contact Number</label><input type="tel" id="parentContactNumber" name="parentContactNumber" value={formData.parentContactNumber} onChange={handleChange} className="enrollment-input" /></div>
              <div className="enrollment-form-group enrollment-grid-full"><label htmlFor="parentEmailAddress" className="enrollment-label">Email Address</label><input type="email" id="parentEmailAddress" name="parentEmailAddress" value={formData.parentEmailAddress} onChange={handleChange} className="enrollment-input" /></div>
            </div>
          </section>
        )}

        {currentStep === 4 && (
          <section>
            <h3 className="enrollment-section-title">Academic Information</h3>
            <div className="enrollment-grid">
              <div className="enrollment-form-group">
                <label htmlFor="departmentId" className="enrollment-label">Department</label>
                <select id="departmentId" name="departmentId" value={formData.departmentId || ''} onChange={handleDepartmentChange} className="enrollment-input">
                  <option value="">Select department…</option>
                  {departments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              <div className="enrollment-form-group">
                <label htmlFor="programId" className="enrollment-label">Program</label>
                <select id="programId" name="programId" value={formData.programId || ''} onChange={handleProgramChange} className="enrollment-input" disabled={programs.length === 0}>
                  <option value="">Select program…</option>
                  {programs.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
              <div className="enrollment-form-group">
                <label htmlFor="yearLevel" className="enrollment-label">Year Level</label>
                <select id="yearLevel" name="yearLevel" value={formData.yearLevel || ''} onChange={(e) => setFormData(prev => ({ ...prev, yearLevel: e.target.value ? Number(e.target.value) : null }))} className="enrollment-input" disabled={yearOptions.length === 0}>
                  <option value="">Select year…</option>
                  {yearOptions.map(y => (<option key={y} value={y}>{y}</option>))}
                </select>
              </div>
              <div className="enrollment-form-group">
                <label htmlFor="semester" className="enrollment-label">Semester</label>
                <select id="semester" name="semester" value={formData.semester || ''} onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))} className="enrollment-input">
                  <option value="">Select semester…</option>
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                  <option value="summer">Summer</option>
                </select>
              </div>
              <div className="enrollment-form-group enrollment-grid-full">
                <label htmlFor="previousSchool" className="enrollment-label">Previous School</label>
                <input id="previousSchool" name="previousSchool" value={formData.previousSchool} onChange={handleChange} className="enrollment-input" />
              </div>
            </div>
          </section>
        )}

        {error && <p className="enrollment-error">{error}</p>}

        <div className="enrollment-nav-container">
          {currentStep > 1 ? <button type="button" onClick={prevStep} className="enrollment-submit-btn enrollment-back-btn">Back</button> : <div />}
          {currentStep < totalSteps ? (
            <button type="button" onClick={nextStep} className="enrollment-submit-btn">Next</button>
          ) : (
            <button type="submit" className="enrollment-submit-btn" disabled={loading}>{loading ? 'Submitting...' : 'Submit Application'}</button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EnrollmentPage;