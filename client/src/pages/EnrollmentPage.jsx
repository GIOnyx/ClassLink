import React, { useState, useEffect } from 'react';
import { submitStudentApplication, getMyStudent, getDepartments, getPrograms } from '../services/backend';
import '../App.css';

// Helper styles for the form layout
const formStyles = {
  container: {
    padding: '40px',
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #eee',
  },
  header: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#333',
    borderBottom: '2px solid #eee',
    paddingBottom: '20px',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '1.8rem',
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
    width: '100%',
    padding: '15px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#800000',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '30px',
    transition: 'background-color 0.2s',
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
  }
};

const EnrollmentPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingApp, setExistingApp] = useState(null);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.emailAddress || !formData.birthDate) {
      setError('Please fill out all required fields.');
      return;
    }
    
    setLoading(true);
    try {
      // Submit to backend (include programId)
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

  if (existingApp) {
    // Show status and submitted information instead of the form
    return (
      <div className="page-content" style={{ paddingTop: '40px' }}>
        <div style={{ ...formStyles.container, color: '#111' }}>
          <h2 style={formStyles.header}>Your Application</h2>
          <div style={{ marginBottom: 12, color: '#111' }}>
            <strong>Status:</strong> {existingApp.status || 'Submitted'}
          </div>
          <div style={{ lineHeight: 1.6 }}>
            <div><strong>Name:</strong> {existingApp.firstName} {existingApp.lastName}</div>
            <div><strong>Email:</strong> {existingApp.email}</div>
            <div><strong>Program Applying For:</strong> {existingApp.program ? existingApp.program.name : '—'}</div>
            <div><strong>Previous School:</strong> {existingApp.previousSchool || '—'}</div>
            <div><strong>Parent/Guardian:</strong> {existingApp.parentGuardianName || '—'}</div>
            <div style={{ marginTop: 12 }}>
              If you need to update your application, edit your profile.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Use page-content for correct padding from the navbar
    <div className="page-content" style={{ paddingTop: '40px' }}>
      <form style={formStyles.container} onSubmit={handleSubmit}>
        <h2 style={formStyles.header}>Student Enrollment Form</h2>

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

        <h3 style={formStyles.sectionTitle}>Academic Information</h3>
        <div style={formStyles.grid}>
          <div style={formStyles.formGroup}>
            <label htmlFor="departmentId" style={formStyles.label}>Department</label>
            <select id="departmentId" name="departmentId" value={formData.departmentId || ''} onChange={async (e) => {
              const deptId = e.target.value ? Number(e.target.value) : null;
              setFormData(prev => ({ ...prev, departmentId: deptId, programId: null }));
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
                setFormData(prev => ({ ...prev, programId: pid }));
                const sel = programs.find(p => p.id === pid);
                if (sel && sel.durationInYears) {
                  const years = Array.from({ length: sel.durationInYears }, (_, i) => i + 1);
                  setYearOptions(years);
                } else {
                  setYearOptions([]);
                }
              }} style={formStyles.input}>
              <option value="">Select program…</option>
              {programs.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
            <div style={formStyles.formGroup}>
              <label htmlFor="yearLevel" style={formStyles.label}>Year Level</label>
              <select id="yearLevel" name="yearLevel" value={formData.yearLevel || ''} onChange={(e) => setFormData(prev => ({ ...prev, yearLevel: e.target.value ? Number(e.target.value) : null }))} style={formStyles.input}>
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
          <div style={formStyles.formGroup}>
            <label htmlFor="previousSchool" style={formStyles.label}>Previous School (if applicable)</label>
            <input type="text" id="previousSchool" name="previousSchool" value={formData.previousSchool} onChange={handleChange} style={formStyles.input} />
          </div>
        </div>

        {error && <p style={formStyles.error}>{error}</p>}

        <button type="submit" style={formStyles.submitButton} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default EnrollmentPage;