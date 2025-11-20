import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
// ✅ Import the new API functions (using absolute paths for Vite)
import { getTeachers, addTeacher, updateTeacher, deleteTeacher } from '/src/services/backend.js';
import '/src/App.css'; // ✅ Use absolute path
import './FacultyPage.css';

// --- New Styles ---

// Style for the new Floating Action Button (FAB)
const fabStyles = {
  position: 'fixed',
  bottom: '40px',
  right: '40px',
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: '#800000',
  color: 'white',
  border: 'none',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '30px',
  zIndex: 1001, // Above page content, below modal overlay
  transition: 'background-color 0.2s, transform 0.2s',
};

// Style for the modal overlay
const modalOverlayStyles = {
  position: 'fixed',
  inset: 0, // Covers the whole screen
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000, // On top of everything
};

// Style for the modal content box
const modalContentStyles = {
  background: '#fff',
  padding: '25px 30px',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '500px',
  color: '#333', // Dark text for modal content
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
};

// Styles for the new modal's form elements
const modalFormStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const modalInputStyle = {
  padding: '12px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '1rem',
  width: '100%',
  color: '#333', // Dark text for input
  backgroundColor: '#fff', // White background for input
};

const modalLabelStyle = {
  marginBottom: '4px',
  fontWeight: 500,
  color: '#333', // Dark text for labels
};

const modalButtonContainer = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end',
  marginTop: '20px',
};
// --- End of New Styles ---


const FacultyPage = () => {
  const { role } = useOutletContext(); // Get role from MainLayout
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  // This error state is now for the modal
  const [error, setError] = useState('');
  
  // State for the modal
  const [modalMode, setModalMode] = useState(null); // 'add', 'edit', or null
  const [currentTeacher, setCurrentTeacher] = useState({ teacherId: null, name: '', email: '' });

  const loadTeachers = async () => {
    setLoading(true);
    // We don't clear modal errors here, only list-loading errors
    // setError('');
    try {
      const res = await getTeachers();
      setTeachers(res.data || []);
    } catch (e) {
      console.error(e);
      // Set a page-level error if the list fails to load
      setError('Failed to load faculty. Are you logged in as an admin?');
    } finally {
      setLoading(false);
    }
  };

  // Load teachers only if the user is an admin
  useEffect(() => {
    if (role === 'ADMIN') {
      loadTeachers();
    }
  }, [role]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentTeacher(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentTeacher.name || !currentTeacher.email) {
      setError('Name and Email are required.');
      return;
    }
    setError('');
    setLoading(true); // Disable form during submission

    try {
      if (modalMode === 'edit') {
        // Pass only name and email for update
        await updateTeacher(currentTeacher.teacherId, { name: currentTeacher.name, email: currentTeacher.email });
      } else {
        await addTeacher({ name: currentTeacher.name, email: currentTeacher.email });
      }
      closeModal(); // Close modal on success
      await loadTeachers(); // Wait for reload before enabling form
    } catch (err) {
      console.error(err);
      // Show error inside the modal
      setError('Failed to save teacher. Is the email already in use?');
    } finally {
      setLoading(false);
    }
  };

  // --- Modal and Action Handlers ---

  const handleEdit = (teacher) => {
    setModalMode('edit');
    setCurrentTeacher({ teacherId: teacher.teacherId, name: teacher.name, email: teacher.email });
    setError(''); // Clear errors when opening modal
  };

  const handleAddClick = () => {
    setModalMode('add');
    setCurrentTeacher({ teacherId: null, name: '', email: '' });
    setError(''); // Clear errors when opening modal
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await deleteTeacher(id);
        await loadTeachers();
      } catch (err) {
        console.error(err);
        // This error will show on the main page
        setError('Failed to delete teacher. They might be assigned to a course.');
      }
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentTeacher({ teacherId: null, name: '', email: '' });
    setError('');
  };

  // --- Renders ---

  // Show a restricted view if not an admin
  if (role !== 'ADMIN') {
    return (
      <div
        className="student-page-container"
        // ✅ ADDED inline styles to ensure white background and dark text
        style={{ backgroundColor: '#ffffff', color: '#333' }}
      >
        <h2>Access Denied</h2>
        <p>You must be an admin to manage faculty.</p>
      </div>
    );
  }

  // Admin View
  return (
    <div
      className="student-page-container"
      // ✅ ADDED inline styles to ensure white background and dark text
      style={{ backgroundColor: '#ffffff', color: '#333' }}
    >
      <h2 style={{ marginBottom: 12 }}>Faculty Management</h2>
      
      {/* Page-level errors (e.g., load/delete failures) */}
      {error && !modalMode && <div style={{ color: '#b00020', marginBottom: 8, fontWeight: 'bold' }}>{error}</div>}

      {/* Teachers List */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>All Faculty</h3>
        {loading && teachers.length === 0 ? (
          <div>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>ID</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Name</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Email</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.teacherId}>
                    <td style={{ padding: 8 }}>{teacher.teacherId}</td>
                    <td style={{ padding: 8 }}>{teacher.name}</td>
                    <td style={{ padding: 8 }}>{teacher.email}</td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => handleEdit(teacher)} style={{ marginRight: 8, cursor: 'pointer' }} disabled={loading}>Edit</button>
                      <button onClick={() => handleDelete(teacher.teacherId)} className="danger" style={{ cursor: 'pointer' }} disabled={loading}>Delete</button>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" style={{ padding: 8, color: '#666' }}>No faculty members found. Add one to get started!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Floating Action Button --- */}
      <button
        type="button"
        style={fabStyles}
        onClick={handleAddClick}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        +
      </button>

      {/* --- Add/Edit Modal --- */}
      {modalMode && (
        <div style={modalOverlayStyles} onClick={closeModal}>
          <div style={modalContentStyles} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
              {modalMode === 'edit' ? 'Edit Teacher' : 'Add New Teacher'}
            </h3>
            
            <form onSubmit={handleSubmit} style={modalFormStyles}>
              <div>
                <label style={modalLabelStyle}>Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Dr. Evelyn Reed"
                  value={currentTeacher.name}
                  onChange={handleFormChange}
                  disabled={loading}
                  style={modalInputStyle}
                />
              </div>
              
              <div>
                <label style={modalLabelStyle}>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g., ereed@cit.edu"
                  value={currentTeacher.email}
                  onChange={handleFormChange}
                  disabled={loading}
                  style={modalInputStyle}
                />
              </div>

              {/* Modal-specific error message */}
              {error && <div style={{ color: '#b00020', fontWeight: 'bold' }}>{error}</div>}

              <div style={modalButtonContainer}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 4 }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#800000', color: 'white', border: 'none', borderRadius: 4 }}
                  disabled={loading}
                >
                  {loading ? (modalMode === 'edit' ? 'Updating...' : 'Adding...') : (modalMode === 'edit' ? 'Update Teacher' : 'Add Teacher')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyPage;