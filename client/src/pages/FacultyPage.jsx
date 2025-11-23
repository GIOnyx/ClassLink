import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getTeachers, addTeacher, updateTeacher, deleteTeacher } from '/src/services/backend.js';
import '/src/App.css';
import './FacultyPage.css';

// Reusing modal styles from AdminPage.css or creating new ones? 
// To keep it clean, let's define the inline styles for the modal here or reuse a global modal class if one existed.
// For this file, I will use inline styles for the modal ONLY, as it's a specific sub-component, but all page-level styles are in CSS.

const FacultyPage = () => {
  const { role } = useOutletContext();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [modalMode, setModalMode] = useState(null);
  const [currentTeacher, setCurrentTeacher] = useState({ teacherId: null, name: '', email: '' });

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await getTeachers();
      setTeachers(res.data || []);
    } catch (e) {
      setError('Failed to load faculty. Are you logged in as an admin?');
    } finally {
      setLoading(false);
    }
  };

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
    setLoading(true);

    try {
      if (modalMode === 'edit') {
        await updateTeacher(currentTeacher.teacherId, { name: currentTeacher.name, email: currentTeacher.email });
      } else {
        await addTeacher({ name: currentTeacher.name, email: currentTeacher.email });
      }
      closeModal();
      await loadTeachers();
    } catch (err) {
      setError('Failed to save teacher. Is the email already in use?');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (teacher) => {
    setModalMode('edit');
    setCurrentTeacher({ teacherId: teacher.teacherId, name: teacher.name, email: teacher.email });
    setError('');
  };

  const handleAddClick = () => {
    setModalMode('add');
    setCurrentTeacher({ teacherId: null, name: '', email: '' });
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await deleteTeacher(id);
        await loadTeachers();
      } catch (err) {
        setError('Failed to delete teacher. They might be assigned to a course.');
      }
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentTeacher({ teacherId: null, name: '', email: '' });
    setError('');
  };

  if (role !== 'ADMIN') {
    return (
      <div className="standard-page-layout">
        <h2 className="faculty-header">Access Denied</h2>
        <p style={{color:'#666'}}>You must be an admin to manage faculty.</p>
      </div>
    );
  }

  return (
    <div className="standard-page-layout">
      <h2 className="faculty-header">Faculty Management</h2>
      
      {error && !modalMode && <div className="faculty-error">{error}</div>}

      <div className="faculty-panel">
        <h3 className="faculty-sub-header">All Faculty</h3>
        {loading && teachers.length === 0 ? (
          <div>Loading...</div>
        ) : (
          <div className="faculty-table-wrapper">
            <table className="faculty-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.teacherId}>
                    <td>{teacher.teacherId}</td>
                    <td>{teacher.name}</td>
                    <td>{teacher.email}</td>
                    <td>
                      <button onClick={() => handleEdit(teacher)} className="btn-edit" disabled={loading}>Edit</button>
                      <button onClick={() => handleDelete(teacher.teacherId)} className="btn-delete" disabled={loading}>Delete</button>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" className="faculty-empty-row">No faculty members found. Add one to get started!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button type="button" className="fab-add-btn" onClick={handleAddClick}>+</button>

      {modalMode && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth:'500px'}}>
            <h3 className="modal-header">
              {modalMode === 'edit' ? 'Edit Teacher' : 'Add New Teacher'}
            </h3>
            
            <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:15}}>
              <div style={{display:'flex', flexDirection:'column'}}>
                <label style={{marginBottom:4, fontWeight:500}}>Name</label>
                <input type="text" name="name" placeholder="e.g., Dr. Evelyn Reed" value={currentTeacher.name} onChange={handleFormChange} disabled={loading} style={{padding:12, border:'1px solid #ccc', borderRadius:4}} />
              </div>
              
              <div style={{display:'flex', flexDirection:'column'}}>
                <label style={{marginBottom:4, fontWeight:500}}>Email</label>
                <input type="email" name="email" placeholder="e.g., ereed@cit.edu" value={currentTeacher.email} onChange={handleFormChange} disabled={loading} style={{padding:12, border:'1px solid #ccc', borderRadius:4}} />
              </div>

              {error && <div className="faculty-error">{error}</div>}

              <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginTop:20}}>
                <button type="button" onClick={closeModal} style={{padding:'8px 16px', cursor:'pointer', background:'#6c757d', color:'white', border:'none', borderRadius:4}} disabled={loading}>Cancel</button>
                <button type="submit" style={{padding:'8px 16px', cursor:'pointer', background:'#800000', color:'white', border:'none', borderRadius:4}} disabled={loading}>
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