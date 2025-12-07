import { useState, useEffect, useCallback, useRef } from 'react';
import { getDepartments } from '../services/backend';

export default function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const retryTimeoutRef = useRef();
  const RETRY_DELAY_MS = 3000;

  const clearRetryTimeout = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  const fetch = useCallback(async ({ allowRetry = false } = {}) => {
    clearRetryTimeout();
    setLoading(true);
    setError(null);
    try {
      const res = await getDepartments();
      const list = res.data || [];
      setDepartments(list);
      if (allowRetry && list.length === 0) {
        retryTimeoutRef.current = setTimeout(() => fetch({ allowRetry: true }), RETRY_DELAY_MS);
      }
    } catch (e) {
      setError(e);
      if (allowRetry) {
        retryTimeoutRef.current = setTimeout(() => fetch({ allowRetry: true }), RETRY_DELAY_MS);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch({ allowRetry: true });
    return () => clearRetryTimeout();
  }, [fetch]);

  return { departments, loading, error, refresh: () => fetch({ allowRetry: false }) };
}
