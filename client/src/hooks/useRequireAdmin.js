import { useEffect, useState } from 'react';
import { me } from '../services/backend';

// Client-side guard that double-checks with the server that the
// current session is an ADMIN before rendering sensitive admin UIs.
export default function useRequireAdmin() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      try {
        const res = await me();
        const isAdmin = Boolean(res?.data?.authenticated) && res?.data?.role === 'ADMIN';
        if (!cancelled) {
          setAuthorized(isAdmin);
        }
      } catch {
        if (!cancelled) {
          setAuthorized(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  return { authorized, loading };
}
