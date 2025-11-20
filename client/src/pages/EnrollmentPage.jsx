import React, { useState, useEffect } from 'react';
// Use real backend helpers
import { submitStudentApplication, getMyStudent, getDepartments, getPrograms } from '../services/backend';


// Helper styles for the form layout (Unchanged)
const formStyles = {
  container: {
    padding: '40px',
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #eee',
    marginTop: '150px',
  },
  header: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#333',
    borderBottom: '2px solid #eee',
    paddingBottom: '20px',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#800000', // Maroon
    marginTop: '30px',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  gridFull: {
    gridColumn: '1 / -1',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontWeight: '600',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  radioGroup: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '1rem',
    color: '#333',
  },
  submitButton: {
    // Note: width is now 'auto' by default
    padding: '15px 30px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#800000',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  // Style for the navigation button container
  navContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '30px',
    borderTop: '1px solid #eee',
    paddingTop: '30px'
  },
  successMessage: {
    textAlign: 'center',
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#087f23',
    padding: '50px',
  },
  error: {
    color: '#b00020',
    marginTop: '10px',
    textAlign: 'center',
    fontSize: '1.1rem',
  }
};

const EnrollmentPage = () => {
  // --- STATE ---
  const [currentStep, setCurrentStep] = useState(1); // New state for step management
  const [isSubmitted, setIsSubmitted] = useState(false); // Kept from original
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingApp, setExistingApp] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'Male',
    studentAddress: '',
    contactNumber: '',
    emailAddress: '',
    parentGuardianName: '',
    relationshipToStudent: '',
    parentContactNumber: '',
    parentEmailAddress: '',
    departmentId: null,
    programId: null,
    yearLevel: null,
    semester: '',
    previousSchool: '',
  });

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- NAVIGATION ---
  const nextStep = () => {
    setError(''); // Clear old errors
    // Validate Step 1
    if (currentStep === 1) {
      const { firstName, lastName, birthDate, emailAddress } = formData;
      if (!firstName || !lastName || !birthDate || !emailAddress) {
        setError('Please fill out all required fields: First Name, Last Name, Birth Date, and Email.');
        return; // Stop navigation
      }
    }
    // Validate Step 2 (Example: making parent name required)
    if (currentStep === 2) {
      if (!formData.parentGuardianName || !formData.parentContactNumber) {
        setError('Please fill out Parent/Guardian Name and Contact Number.');
        return; // Stop navigation
      }
    }
    
    // If validation passed, move to next step
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setError(''); // Clear errors when going back
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // --- FORM SUBMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Final validation (Step 3 + key fields from other steps)
    const { firstName, lastName, emailAddress, birthDate, departmentId, programId, yearLevel, semester } = formData;
    if (!firstName || !lastName || !emailAddress || !birthDate) {
      setError('Please go back and fill out all required student fields.');
      setCurrentStep(1); // Send user back to step 1
      return;
    }
    if (!departmentId || !programId || !yearLevel || !semester) {
      setError('Please complete all academic information fields.');
      return; // Stay on step 3
    }
    
    setLoading(true);
    try {
      // Submit to backend
      const payload = { ...formData, programId: formData.programId, yearLevel: formData.yearLevel, semester: formData.semester };
      const res = await submitStudentApplication(payload);
      
      // backend returns saved student record
      setExistingApp(res.data || null);

      // Show success
      setIsSubmitted(true);
    } catch (err) {
      console.error('Application submission failed:', err);
      setError('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    // On load, check if the current student already has an application
    const load = async () => {
      try {
        const res = await getMyStudent();
        const student = res.data;
        // Consider an application submitted if program or parentGuardianName or previousSchool exist
        const hasApplication = student && (student.program || student.parentGuardianName || student.previousSchool);
        if (hasApplication) setExistingApp(student);
      } catch (err) {
        // not logged in or no student record — ignore
      }
    };
    load();

    // load departments for dropdown
    const loadDeps = async () => {
      try {
        const res = await getDepartments();
        setDepartments(res.data || []);
      } catch (err) {
        setDepartments([]);
      }
    };
    loadDeps();
  }, []);

  // When an existing application is loaded, populate the form data so
  // we can render the full form (either read-only preview or editable)
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

    // pre-load programs for the department/program so selects show values
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
            const years = Array.from({ length: sel.durationInYears }, (_, i) => i + 1);
            setYearOptions(years);
          }
        }
      } catch (err) {
        // ignore
      }
    })();
  }, [existingApp]);

  // Toggle edit mode and allow cancelling edits
  const startEdit = () => setEditMode(true);
  const cancelEdit = () => {
    // reset form to existingApp values
    if (existingApp) {
      setFormData(prev => ({
        ...prev,
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
    }
    setEditMode(false);
    setError('');
  };

  const handleSave = async (e) => {
    e && e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Reuse submitStudentApplication for saving/updating
      const payload = { ...formData, id: existingApp?.id };
      const res = await submitStudentApplication(payload);
      setExistingApp(res.data || existingApp);
      setEditMode(false);
    } catch (err) {
      console.error('Save failed', err);
      setError('Save failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---

  // 1. Show existing application preview if it exists
  if (existingApp) {
    const status = (existingApp.status || 'Pending').toLowerCase();
    const statusColor = status === 'approved' ? '#087f23' : status === 'pending' ? '#b36b00' : '#6c757d';

    return (
      <div className="page-content">
        {/* Status container aligned with form width (card) */}
        <div style={{ maxWidth: 900, margin: '24px auto 0', padding: '0 16px' }}>
          <div style={{ ...formStyles.container, padding: '16px 20px', marginTop: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#333' }}>Application Status</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: 999,
                    backgroundColor: statusColor,
                    color: '#fff',
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    fontSize: '0.8rem'
                  }}>{(existingApp.status || 'Pending')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
          {/* Full form preview (single page) */}
          <form style={{ ...formStyles.container, marginTop: 18 }} onSubmit={handleSave}>

            <section>
              <h3 style={formStyles.sectionTitle}>Student Information</h3>
              <div style={formStyles.grid}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>First Name</label>
                  <input style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="firstName" value={formData.firstName} onChange={handleChange} disabled={!editMode} />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Last Name</label>
                  <input style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="lastName" value={formData.lastName} onChange={handleChange} disabled={!editMode} />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Birth Date</label>
                  <input type="date" style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="birthDate" value={formData.birthDate} onChange={handleChange} disabled={!editMode} />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Gender</label>
                  <div style={formStyles.radioGroup}>
                    <label style={formStyles.radioLabel}><input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} disabled={!editMode} /> Male</label>
                    <label style={formStyles.radioLabel}><input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} disabled={!editMode} /> Female</label>
                  </div>
                </div>
                <div style={{ ...formStyles.formGroup, ...formStyles.gridFull }}>
                  <label style={formStyles.label}>Student Address</label>
                  <input style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="studentAddress" value={formData.studentAddress} onChange={handleChange} disabled={!editMode} />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Contact Number</label>
                  <input style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="contactNumber" value={formData.contactNumber} onChange={handleChange} disabled={!editMode} />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Email Address</label>
                  <input style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="emailAddress" value={formData.emailAddress} onChange={handleChange} disabled={!editMode} />
                </div>
              </div>
            </section>

            <section>
              <h3 style={formStyles.sectionTitle}>Parent / Guardian</h3>
              <div style={formStyles.grid}>
                <div style={{ ...formStyles.formGroup, ...formStyles.gridFull }}>
                  <label style={formStyles.label}>Parent / Guardian Name</label>
                  <input style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="parentGuardianName" value={formData.parentGuardianName} onChange={handleChange} disabled={!editMode} />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Relationship</label>
                  <input style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="relationshipToStudent" value={formData.relationshipToStudent} onChange={handleChange} disabled={!editMode} />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Contact Number</label>
                  <input style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="parentContactNumber" value={formData.parentContactNumber} onChange={handleChange} disabled={!editMode} />
                </div>
                <div style={{ ...formStyles.formGroup, ...formStyles.gridFull }}>
                  <label style={formStyles.label}>Parent Email</label>
                  <input style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="parentEmailAddress" value={formData.parentEmailAddress} onChange={handleChange} disabled={!editMode} />
                </div>
              </div>
            </section>

            <section>
              <h3 style={formStyles.sectionTitle}>Academic Information</h3>
              <div style={formStyles.grid}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Department</label>
                  <select style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="departmentId" value={formData.departmentId || ''} onChange={async (e) => {
                    const deptId = e.target.value ? Number(e.target.value) : null;
                    setFormData(prev => ({ ...prev, departmentId: deptId, programId: null, yearLevel: null }));
                    setPrograms([]);
                    setYearOptions([]);
                    if (deptId) {
                      try { const res = await getPrograms(deptId); setPrograms(res.data || []); } catch (err) { setPrograms([]); }
                    }
                  }} disabled={!editMode}>
                    <option value="">Select department…</option>
                    {departments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Program</label>
                  <select style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="programId" value={formData.programId || ''} onChange={(e) => {
                    const pid = e.target.value ? Number(e.target.value) : null;
                    setFormData(prev => ({ ...prev, programId: pid, yearLevel: null }));
                    const sel = programs.find(p => p.id === pid);
                    if (sel && sel.durationInYears) setYearOptions(Array.from({ length: sel.durationInYears }, (_, i) => i + 1));
                  }} disabled={!editMode || programs.length === 0}>
                    <option value="">Select program…</option>
                    {programs.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Year Level</label>
                  <select style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="yearLevel" value={formData.yearLevel || ''} onChange={(e) => setFormData(prev => ({ ...prev, yearLevel: e.target.value ? Number(e.target.value) : null }))} disabled={!editMode || yearOptions.length === 0}>
                    <option value="">Select year…</option>
                    {yearOptions.map(y => (<option key={y} value={y}>{y}</option>))}
                  </select>
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Semester</label>
                  <select style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="semester" value={formData.semester || ''} onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))} disabled={!editMode}>
                    <option value="">Select semester…</option>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="summer">Summer</option>
                  </select>
                </div>
                <div style={{ ...formStyles.formGroup, ...formStyles.gridFull }}>
                  <label style={formStyles.label}>Previous School</label>
                  <input style={{ ...formStyles.input, backgroundColor: '#fff', color: '#111' }} name="previousSchool" value={formData.previousSchool} onChange={handleChange} disabled={!editMode} />
                </div>
              </div>
            </section>

            {error && <p style={formStyles.error}>{error}</p>}

            {/* explanatory line removed per request */}

          </form>

          {/* Buttons below the form (outside) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            {!editMode ? (
              <button type="button" onClick={startEdit} style={formStyles.submitButton}>Edit Enrollment Form</button>
            ) : (
              <>
                <button type="button" onClick={handleSave} style={formStyles.submitButton} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={cancelEdit} style={{ ...formStyles.submitButton, backgroundColor: '#6c757d' }}>Cancel</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Show the multi-step form
  return (
    // Use page-content for correct padding from the navbar
    <div className="page-content">
      <form style={formStyles.container} onSubmit={handleSubmit}>
        {/* Header shows current step */}
        <h2 style={formStyles.header}>Student Enrollment Form (Step {currentStep} of 3)</h2>

        {/* --- STEP 1: Student Information --- */}
        {currentStep === 1 && (
          <section>
            <h3 style={formStyles.sectionTitle}>Student Information</h3>
            <div style={formStyles.grid}>
              <div style={formStyles.formGroup}>
                <label htmlFor="firstName" style={formStyles.label}>Student Name: First Name</label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} style={formStyles.input} />
              </div>
              <div style={formStyles.formGroup}>
                <label htmlFor="lastName" style={formStyles.label}>Last Name</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} style={formStyles.input} />
              </div>
              <div style={formStyles.formGroup}>
                <label htmlFor="birthDate" style={formStyles.label}>Birth Date</label>
                <input type="date" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleChange} style={formStyles.input} />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Gender</label>
                <div style={formStyles.radioGroup}>
                  <label style={formStyles.radioLabel}>
                    <input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} />
                    Male
                  </label>
                  <label style={formStyles.radioLabel}>
                    <input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} />
                    Female
                  </label>
                </div>
              </div>
              <div style={{ ...formStyles.formGroup, ...formStyles.gridFull }}>
                <label htmlFor="studentAddress" style={formStyles.label}>Student Address</label>
                <input type="text" id="studentAddress" name="studentAddress" value={formData.studentAddress} onChange={handleChange} style={formStyles.input} />
              </div>
              <div style={formStyles.formGroup}>
                <label htmlFor="contactNumber" style={formStyles.label}>Contact Number</label>
                <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} style={formStyles.input} />
              </div>
              <div style={formStyles.formGroup}>
                <label htmlFor="emailAddress" style={formStyles.label}>Email Address</label>
                <input type="email" id="emailAddress" name="emailAddress" value={formData.emailAddress} onChange={handleChange} style={formStyles.input} />
              </div>
            </div>
          </section>
        )}

        {/* --- STEP 2: Parent/Guardian Information --- */}
        {currentStep === 2 && (
          <section>
            <h3 style={formStyles.sectionTitle}>Parent/Guardian Information</h3>
            <div style={formStyles.grid}>
              <div style={{ ...formStyles.formGroup, ...formStyles.gridFull }}>
                <label htmlFor="parentGuardianName" style={formStyles.label}>Parent/Guardian Name</label>
                <input type="text" id="parentGuardianName" name="parentGuardianName" value={formData.parentGuardianName} onChange={handleChange} style={formStyles.input} />
              </div>
              <div style={formStyles.formGroup}>
                <label htmlFor="relationshipToStudent" style={formStyles.label}>Relationship To Student</label>
                <input type="text" id="relationshipToStudent" name="relationshipToStudent" value={formData.relationshipToStudent} onChange={handleChange} style={formStyles.input} />
              </div>
              <div style={formStyles.formGroup}>
                <label htmlFor="parentContactNumber" style={formStyles.label}>Contact Number</label>
                <input type="tel" id="parentContactNumber" name="parentContactNumber" value={formData.parentContactNumber} onChange={handleChange} style={formStyles.input} />
              </div>
              <div style={{ ...formStyles.formGroup, ...formStyles.gridFull }}>
                <label htmlFor="parentEmailAddress" style={formStyles.label}>Email Address</label>
                <input type="email" id="parentEmailAddress" name="parentEmailAddress" value={formData.parentEmailAddress} onChange={handleChange} style={formStyles.input} />
              </div>
            </div>
          </section>
        )}

        {/* --- STEP 3: Academic Information --- */}
        {currentStep === 3 && (
          <section>
            <h3 style={formStyles.sectionTitle}>Academic Information</h3>
            <div style={formStyles.grid}>
              <div style={formStyles.formGroup}>
                <label htmlFor="departmentId" style={formStyles.label}>Department</label>
                <select id="departmentId" name="departmentId" value={formData.departmentId || ''} onChange={async (e) => {
                  const deptId = e.target.value ? Number(e.target.value) : null;
                  setFormData(prev => ({ ...prev, departmentId: deptId, programId: null, yearLevel: null }));
                    setPrograms([]); // Clear previous programs
                    setYearOptions([]); // Clear previous years
                  if (deptId) {
                    try {
                      const res = await getPrograms(deptId);
                      setPrograms(res.data || []);
                    } catch (err) {
                      setPrograms([]);
                    }
                  } else {
                    setPrograms([]);
                  }
                }} style={formStyles.input}>
                  <option value="">Select department…</option>
                  {departments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              <div style={formStyles.formGroup}>
                <label htmlFor="programId" style={formStyles.label}>Program</label>
                <select id="programId" name="programId" value={formData.programId || ''} onChange={(e) => {
                  const pid = e.target.value ? Number(e.target.value) : null;
                  setFormData(prev => ({ ...prev, programId: pid, yearLevel: null })); // Reset year level on program change
                  const sel = programs.find(p => p.id === pid);
                  if (sel && sel.durationInYears) {
                    const years = Array.from({ length: sel.durationInYears }, (_, i) => i + 1);
                    setYearOptions(years);
                  } else {
                    setYearOptions([]);
                  }
                }} style={formStyles.input} disabled={programs.length === 0}>
                  <option value="">Select program…</option>
                  {programs.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
                <div style={formStyles.formGroup}>
                  <label htmlFor="yearLevel" style={formStyles.label}>Year Level</label>
                  <select id="yearLevel" name="yearLevel" value={formData.yearLevel || ''} onChange={(e) => setFormData(prev => ({ ...prev, yearLevel: e.target.value ? Number(e.target.value) : null }))} style={formStyles.input} disabled={yearOptions.length === 0}>
                    <option value="">Select year…</option>
                    {yearOptions.map(y => (<option key={y} value={y}>{y}</option>))}
                  </select>
                </div>
                <div style={formStyles.formGroup}>
                  <label htmlFor="semester" style={formStyles.label}>Semester</label>
                  <select id="semester" name="semester" value={formData.semester || ''} onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))} style={formStyles.input}>
                    <option value="">Select semester…</option>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="summer">Summer</option>
                  </select>
                </div>
              <div style={{ ...formStyles.formGroup, ...formStyles.gridFull }}>
                <label htmlFor="previousSchool" style={formStyles.label}>Previous School (if applicable)</label>
                <input type="text" id="previousSchool" name="previousSchool" value={formData.previousSchool} onChange={handleChange} style={formStyles.input} />
              </div>
            </div>
          </section>
        )}

        {error && <p style={formStyles.error}>{error}</p>}

        {/* --- DYNAMIC NAVIGATION --- */}
        <div style={formStyles.navContainer}>
          {/* Show "Back" button if not on step 1 */}
          {currentStep > 1 ? (
            <button 
              type="button" 
              onClick={prevStep} 
              style={{ ...formStyles.submitButton, backgroundColor: '#6c757d' }}
            >
              Back
            </button>
          ) : (
            <div /> // Empty div to keep 'Next'/'Submit' button to the right
          )}

          {/* Show "Next" button if not on last step */}
          {currentStep < 3 ? (
             <button 
              type="button" 
              onClick={nextStep} 
              style={formStyles.submitButton}
            >
              Next
            </button>
          ) : (
            // Show "Submit" button on last step
            <button 
              type="submit" 
              style={formStyles.submitButton} 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EnrollmentPage;