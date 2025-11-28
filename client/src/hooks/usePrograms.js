import { useState, useEffect, useCallback } from 'react';
import { getPrograms } from '../services/backend';

export default function usePrograms(departmentId = null) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (deptId) => {
    if (!deptId) {
      setPrograms([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setPrograms([]); // reset list so dropdown reflects current department while loading
    try {
      const res = await getPrograms(deptId);
      setPrograms(res.data || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(departmentId);
  }, [fetch, departmentId]);

  return { programs, loading, error, refresh: () => fetch(departmentId) };
}
