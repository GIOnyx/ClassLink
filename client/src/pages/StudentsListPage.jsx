import React, { useEffect, useState } from 'react';
import '../App.css';
import './StudentsListPage.css';
import { getStudentsByStatus } from '../services/backend';

const StudentsListPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getStudentsByStatus('APPROVED');
        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        const message = err?.response?.data || 'Unable to load students.';
        setError(typeof message === 'string' ? message : 'Unable to load students.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = students.filter((student) => {
    if (!search.trim()) return true;
    const target = `${student.firstName || ''} ${student.lastName || ''} ${student.email || ''}`.toLowerCase();
    return target.includes(search.trim().toLowerCase());
  });

  return (
    <div className="standard-page-layout students-page">
      <div className="students-header">
        <div>
          <h2>Enrolled Students</h2>
          <p>Showing approved applications ready for enrollment.</p>
        </div>
        <input
          type="search"
          className="students-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
        />
      </div>
      {loading ? (
        <p>Loading students…</p>
      ) : error ? (
        <p className="students-error">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="students-empty">No enrolled students found.</p>
      ) : (
        <div className="students-table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Program</th>
                <th>Year</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id}>
                  <td>{`${student.firstName || ''} ${student.lastName || ''}`.trim() || '—'}</td>
                  <td>{student.email || '—'}</td>
                  <td>{student.program?.name || '—'}</td>
                  <td>{student.yearLevel || '—'}</td>
                  <td>{student.semester || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentsListPage;
