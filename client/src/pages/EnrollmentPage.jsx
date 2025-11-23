import React, { useState, useEffect } from 'react';
import { submitStudentApplication, getMyStudent, getDepartments, getPrograms } from '../services/backend';
import '../App.css';
import './EnrollmentPage.css';

const EnrollmentPage = () => {
  // ... (State variables remain the same) ...
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

  // ... (Handlers remain the same) ...
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
            // ✅ Auto-enable edit mode if status is REJECTED so they can fix it immediately
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
          const sel = (existingApp.program && [existingApp.program]) || programs.find(p => p.id === pid);
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
      // Clear error if submission succeeded
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
           <h3 className="status-header">
             Application Status: <span className={`status-label ${statusClass}`}>{status}</span>
           </h3>
           {/* Show message if rejected */}
           {status === 'REJECTED' && (
               <p style={{color: '#b00020', marginTop: 10, fontWeight: 600}}>
                   Action Required: Please correct your information below and click "Save Changes" to resubmit.
               </p>
           )}
        </div>
        
        <form className="enrollment-form-container" onSubmit={handleSave}>
            {/* ... (Keep existing form fields - First Name, Last Name, etc.) ... */}
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
              <div className="enrollment-grid">
                 <div className="enrollment-form-group enrollment-grid-full">
                    <label className="enrollment-label">Program</label>
                    <input className="enrollment-input" value={existingApp.program ? existingApp.program.name : 'N/A'} disabled />
                 </div>
                 <div className="enrollment-form-group"><label className="enrollment-label">Year Level</label><input className="enrollment-input" value={formData.yearLevel} disabled /></div>
                 <div className="enrollment-form-group"><label className="enrollment-label">Semester</label><input className="enrollment-input" value={formData.semester} disabled /></div>
              </div>
            </section>

            <div className="enrollment-edit-actions">
              {!editMode ? (
                /* Hide Edit button if Pending/Approved, but allow editing if Rejected */
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

  // ... (Render Wizard Form for New Applications) ...
  // Keep existing return block here...
  return (
    <div className="standard-page-layout">
      <form className="enrollment-form-container" onSubmit={handleSubmit}>
        <h2 className="enrollment-header">Student Enrollment Form (Step {currentStep} of 3)</h2>
        
        {/* STEP 1 */}
        {currentStep === 1 && (
          <section>
            <h3 className="enrollment-section-title">Student Information</h3>
            <div className="enrollment-grid">
              <div className="enrollment-form-group">
                <label htmlFor="firstName" className="enrollment-label">First Name</label>
                <input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="enrollment-input" />
              </div>
              <div className="enrollment-form-group">
                <label htmlFor="lastName" className="enrollment-label">Last Name</label>
                <input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className="enrollment-input" />
              </div>
              <div className="enrollment-form-group">
                <label htmlFor="birthDate" className="enrollment-label">Birth Date</label>
                <input type="date" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleChange} className="enrollment-input" />
              </div>
              <div className="enrollment-form-group">
                <label className="enrollment-label">Gender</label>
                <div className="enrollment-radio-group">
                  <label className="enrollment-radio-label"><input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} /> Male</label>
                  <label className="enrollment-radio-label"><input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} /> Female</label>
                </div>
              </div>
              <div className="enrollment-form-group enrollment-grid-full">
                <label htmlFor="studentAddress" className="enrollment-label">Address</label>
                <input id="studentAddress" name="studentAddress" value={formData.studentAddress} onChange={handleChange} className="enrollment-input" />
              </div>
              <div className="enrollment-form-group">
                <label htmlFor="contactNumber" className="enrollment-label">Contact Number</label>
                <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="enrollment-input" />
              </div>
              <div className="enrollment-form-group">
                <label htmlFor="emailAddress" className="enrollment-label">Email Address</label>
                <input type="email" id="emailAddress" name="emailAddress" value={formData.emailAddress} onChange={handleChange} className="enrollment-input" />
              </div>
            </div>
          </section>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <section>
            <h3 className="enrollment-section-title">Parent / Guardian Information</h3>
            <div className="enrollment-grid">
              <div className="enrollment-form-group enrollment-grid-full">
                <label htmlFor="parentGuardianName" className="enrollment-label">Parent/Guardian Name</label>
                <input id="parentGuardianName" name="parentGuardianName" value={formData.parentGuardianName} onChange={handleChange} className="enrollment-input" />
              </div>
              <div className="enrollment-form-group">
                <label htmlFor="relationshipToStudent" className="enrollment-label">Relationship</label>
                <input id="relationshipToStudent" name="relationshipToStudent" value={formData.relationshipToStudent} onChange={handleChange} className="enrollment-input" />
              </div>
              <div className="enrollment-form-group">
                <label htmlFor="parentContactNumber" className="enrollment-label">Contact Number</label>
                <input type="tel" id="parentContactNumber" name="parentContactNumber" value={formData.parentContactNumber} onChange={handleChange} className="enrollment-input" />
              </div>
              <div className="enrollment-form-group enrollment-grid-full">
                <label htmlFor="parentEmailAddress" className="enrollment-label">Email Address</label>
                <input type="email" id="parentEmailAddress" name="parentEmailAddress" value={formData.parentEmailAddress} onChange={handleChange} className="enrollment-input" />
              </div>
            </div>
          </section>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <section>
            <h3 className="enrollment-section-title">Academic Information</h3>
            <div className="enrollment-grid">
              <div className="enrollment-form-group">
                <label htmlFor="departmentId" className="enrollment-label">Department</label>
                <select id="departmentId" name="departmentId" value={formData.departmentId || ''} onChange={async (e) => {
                  const deptId = e.target.value ? Number(e.target.value) : null;
                  setFormData(prev => ({ ...prev, departmentId: deptId, programId: null, yearLevel: null }));
                  setPrograms([]); setYearOptions([]);
                  if (deptId) {
                    try { const res = await getPrograms(deptId); setPrograms(res.data || []); } catch (err) {}
                  }
                }} className="enrollment-input">
                  <option value="">Select department…</option>
                  {departments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              <div className="enrollment-form-group">
                <label htmlFor="programId" className="enrollment-label">Program</label>
                <select id="programId" name="programId" value={formData.programId || ''} onChange={(e) => {
                  const pid = e.target.value ? Number(e.target.value) : null;
                  setFormData(prev => ({ ...prev, programId: pid, yearLevel: null }));
                  const sel = programs.find(p => p.id === pid);
                  if (sel && sel.durationInYears) {
                    setYearOptions(Array.from({ length: sel.durationInYears }, (_, i) => i + 1));
                  } else { setYearOptions([]); }
                }} className="enrollment-input" disabled={programs.length === 0}>
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
          {currentStep > 1 ? (
            <button type="button" onClick={prevStep} className="enrollment-submit-btn enrollment-back-btn">Back</button>
          ) : <div />}
          
          {currentStep < 3 ? (
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