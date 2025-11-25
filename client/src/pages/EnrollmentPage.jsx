import React, { useState, useEffect } from 'react';
import { submitStudentApplication, getMyStudent, getDepartments, getPrograms } from '../services/backend';
import '../App.css';
import './EnrollmentPage.css';

const EnrollmentPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingApp, setExistingApp] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', birthDate: '', gender: 'Male', studentAddress: '', contactNumber: '', emailAddress: '',
    parentGuardianName: '', relationshipToStudent: '', parentContactNumber: '', parentEmailAddress: '',
    departmentId: null, programId: null, yearLevel: null, semester: '', previousSchool: '',
  });

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

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
    setPrograms([]); 
    setYearOptions([]);
    if (deptId) {
      try { const res = await getPrograms(deptId); setPrograms(res.data || []); } catch (err) {}
    }
  };

  const handleProgramChange = (e) => {
    const pid = e.target.value ? Number(e.target.value) : null;
    setFormData(prev => ({ ...prev, programId: pid, yearLevel: null }));
    const sel = programs.find(p => p.id === pid);
    if (sel && sel.durationInYears) {
      setYearOptions(Array.from({ length: sel.durationInYears }, (_, i) => i + 1));
    } else { setYearOptions([]); }
  };

  const nextStep = () => {
    setError('');
    if (currentStep === 1) {
      const { firstName, lastName, birthDate, emailAddress } = formData;
      if (!firstName || !lastName || !birthDate || !emailAddress) {
        setError('Please fill out all required fields: Name, Birth Date, and Email.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.parentGuardianName || !formData.parentContactNumber) {
        setError('Please fill out Parent/Guardian Name and Contact Number.');
        return; 
      }
    }
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { firstName, lastName, emailAddress, birthDate, departmentId, programId, yearLevel, semester } = formData;
    if (!firstName || !lastName || !emailAddress || !birthDate) {
      setError('Please go back and fill out all required student fields.');
      setCurrentStep(1);
      return;
    }
    if (!departmentId || !programId || !yearLevel || !semester) {
      setError('Please complete all academic information fields.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...formData };
      const res = await submitStudentApplication(payload);
      setExistingApp(res.data || null);
      setIsSubmitted(true);
    } catch (err) {
      setError('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyStudent();
        const student = res.data;
        const hasApplication = student && (student.program || student.parentGuardianName || student.previousSchool);
        if (hasApplication) {
            setExistingApp(student);
            if (student.status === 'REJECTED') {
                setEditMode(true);
                setError('Your application was rejected. Please review your details and resubmit.');
            }
        }
      } catch (err) {}
    };
    load();
    const loadDeps = async () => {
      try {
        const res = await getDepartments();
        setDepartments(res.data || []);
      } catch (err) { setDepartments([]); }
    };
    loadDeps();
  }, []);

  useEffect(() => {
    if (!existingApp) return;
    setFormData(prev => ({
      firstName: existingApp.firstName || prev.firstName,
      lastName: existingApp.lastName || prev.lastName,
      birthDate: existingApp.birthDate || prev.birthDate,
      gender: existingApp.gender || prev.gender,
      studentAddress: existingApp.studentAddress || prev.studentAddress,
      contactNumber: existingApp.contactNumber || prev.contactNumber,
      emailAddress: existingApp.email || existingApp.emailAddress || prev.emailAddress,
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
    (async () => {
      try {
        if (existingApp.departmentId || existingApp.department?.id) {
          const depId = existingApp.departmentId || existingApp.department?.id;
          const res = await getPrograms(depId);
          setPrograms(res.data || []);
        }
        if (existingApp.programId || existingApp.program?.id) {
          const pid = existingApp.programId || existingApp.program?.id;
          // Wait for programs to set, or find directly from response if needed
          // For simplicity, relies on useEffect race or existing data. 
          // Ideally we fetch program specific details if 'programs' state isn't ready.
          // For now, let's assume programs load fast or are consistent.
          // Trigger year options update manually if needed or rely on user interaction for edit.
          // To ensure Year Options appear on load:
           const res = await getPrograms(existingApp.departmentId || existingApp.department?.id);
           const progList = res.data || [];
           setPrograms(progList);
           const sel = progList.find(p => p.id === pid);
           if (sel && sel.durationInYears) {
             setYearOptions(Array.from({ length: sel.durationInYears }, (_, i) => i + 1));
           }
        }
      } catch (err) {}
    })();
  }, [existingApp]);

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
                <div className="enrollment-form-group"><label className="enrollment-label">Email</label><input className="enrollment-input" name="emailAddress" value={formData.emailAddress} onChange={handleChange} disabled={!editMode}/></div>
              </div>
            </section>

            <section>
              <h3 className="enrollment-section-title">Parent / Guardian</h3>
              <div className="enrollment-grid">
                <div className="enrollment-form-group enrollment-grid-full"><label className="enrollment-label">Guardian Name</label><input className="enrollment-input" name="parentGuardianName" value={formData.parentGuardianName} onChange={handleChange} disabled={!editMode}/></div>
                <div className="enrollment-form-group"><label className="enrollment-label">Relationship</label><input className="enrollment-input" name="relationshipToStudent" value={formData.relationshipToStudent} onChange={handleChange} disabled={!editMode}/></div>
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
                (status === 'REJECTED' || status === 'PENDING') && <button type="button" onClick={startEdit} className="enrollment-submit-btn">Edit Information</button>
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

  // --- NEW APPLICATION WIZARD RENDER ---
  return (
    <div className="standard-page-layout">
      <form className="enrollment-form-container" onSubmit={handleSubmit}>
        <h2 className="enrollment-header">Student Enrollment Form (Step {currentStep} of 3)</h2>
        
        {currentStep === 1 && (
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
              <div className="enrollment-form-group"><label htmlFor="emailAddress" className="enrollment-label">Email Address</label><input type="email" id="emailAddress" name="emailAddress" value={formData.emailAddress} onChange={handleChange} className="enrollment-input" /></div>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section>
            <h3 className="enrollment-section-title">Parent / Guardian Information</h3>
            <div className="enrollment-grid">
              <div className="enrollment-form-group enrollment-grid-full"><label htmlFor="parentGuardianName" className="enrollment-label">Parent/Guardian Name</label><input id="parentGuardianName" name="parentGuardianName" value={formData.parentGuardianName} onChange={handleChange} className="enrollment-input" /></div>
              <div className="enrollment-form-group"><label htmlFor="relationshipToStudent" className="enrollment-label">Relationship</label><input id="relationshipToStudent" name="relationshipToStudent" value={formData.relationshipToStudent} onChange={handleChange} className="enrollment-input" /></div>
              <div className="enrollment-form-group"><label htmlFor="parentContactNumber" className="enrollment-label">Contact Number</label><input type="tel" id="parentContactNumber" name="parentContactNumber" value={formData.parentContactNumber} onChange={handleChange} className="enrollment-input" /></div>
              <div className="enrollment-form-group enrollment-grid-full"><label htmlFor="parentEmailAddress" className="enrollment-label">Email Address</label><input type="email" id="parentEmailAddress" name="parentEmailAddress" value={formData.parentEmailAddress} onChange={handleChange} className="enrollment-input" /></div>
            </div>
          </section>
        )}

        {currentStep === 3 && (
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
          {currentStep < 3 ? <button type="button" onClick={nextStep} className="enrollment-submit-btn">Next</button> : <button type="submit" className="enrollment-submit-btn" disabled={loading}>{loading ? 'Submitting...' : 'Submit Application'}</button>}
        </div>
      </form>
    </div>
  );
};

export default EnrollmentPage;