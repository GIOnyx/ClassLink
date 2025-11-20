import React, { useEffect, useState } from 'react';
import '../App.css';
import './StudentPage.css';
import { me } from '../services/backend';

const StudentPage = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await me();
        setInfo(data);
      } catch (e) {
        setError('Failed to load your information');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="student-page-container" style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Student Dashboard</h2>
      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: '#b00020' }}>{error}</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <p style={{ marginTop: 0 }}>Welcome! You're signed in as <strong>{info?.userType}</strong>.</p>
          <p>Your user id: {info?.userId}</p>
          <p>Your role: <strong>{info?.role}</strong></p>
          <p style={{ color: '#666', marginTop: 12 }}>
            This is a temporary student page. Once features are ready, you'll see your enrollment,
            courses, and account details here.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentPage;