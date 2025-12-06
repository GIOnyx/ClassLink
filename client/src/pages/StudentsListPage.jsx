import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../App.css';
import './StudentsListPage.css';
import { getStudentsByStatus } from '../services/backend';

const defaultFilters = { program: '', year: '', semester: '' };

const StudentsListPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ ...defaultFilters });
  const [lastSynced, setLastSynced] = useState(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getStudentsByStatus('APPROVED');
      setStudents(Array.isArray(data) ? data : []);
      setLastSynced(new Date());
    } catch (err) {
      const message = err?.response?.data || 'Unable to load students.';
      setError(typeof message === 'string' ? message : 'Unable to load students.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const programOptions = useMemo(() => {
    const set = new Set();
    students.forEach((student) => {
      if (student.program?.name) {
        set.add(student.program.name);
      }
    });
    return Array.from(set).sort();
  }, [students]);

  const yearOptions = useMemo(() => {
    const set = new Set();
    students.forEach((student) => {
      if (student.yearLevel) {
        set.add(String(student.yearLevel));
      }
    });
    return Array.from(set)
      .sort((a, b) => Number(a) - Number(b));
  }, [students]);

  const semesterOptions = useMemo(() => {
    const set = new Set();
    students.forEach((student) => {
      if (student.semester) {
        set.add(student.semester);
      }
    });
    return Array.from(set);
  }, [students]);

  const filtered = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    return students.filter((student) => {
      if (normalizedQuery) {
        const target = `${student.firstName || ''} ${student.lastName || ''} ${student.email || ''}`.toLowerCase();
        if (!target.includes(normalizedQuery)) {
          return false;
        }
      }

      if (filters.program) {
        if ((student.program?.name || 'Unassigned') !== filters.program) {
          return false;
        }
      }

      if (filters.year) {
        if (String(student.yearLevel || '') !== filters.year) {
          return false;
        }
      }

      if (filters.semester) {
        if ((student.semester || '') !== filters.semester) {
          return false;
        }
      }

      return true;
    });
  }, [filters.program, filters.semester, filters.year, search, students]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ ...defaultFilters });
    setSearch('');
  };

  const rosterStats = useMemo(() => {
    const yearSpread = yearOptions.length
      ? `${yearOptions[0]}-${yearOptions[yearOptions.length - 1]}`
      : '—';
    return [
      {
        label: 'Enrolled students',
        value: students.length,
        detail: `${filtered.length} shown`
      },
      {
        label: 'Programs represented',
        value: programOptions.length || '—',
        detail: 'Active curriculum tracks'
      },
      {
        label: 'Year coverage',
        value: yearOptions.length ? `${yearOptions.length} years` : 'No data',
        detail: yearSpread === '—' ? 'Awaiting year data' : `Years ${yearSpread}`
      },
      {
        label: 'Semester spread',
        value: semesterOptions.length || '—',
        detail: semesterOptions.length ? semesterOptions.join(' · ') : 'No semester data'
      }
    ];
  }, [filtered.length, programOptions.length, semesterOptions, students.length, yearOptions]);

  const cohortLeaders = useMemo(() => {
    const counts = new Map();
    students.forEach((student) => {
      const programName = student.program?.name || 'Unassigned program';
      counts.set(programName, (counts.get(programName) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [students]);

  const yearDistribution = useMemo(() => {
    const counts = new Map();
    students.forEach((student) => {
      const year = student.yearLevel ? `Year ${student.yearLevel}` : 'Unspecified year';
      counts.set(year, (counts.get(year) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => {
      const numA = Number(a[0].split(' ')[1]);
      const numB = Number(b[0].split(' ')[1]);
      if (Number.isNaN(numA) || Number.isNaN(numB)) {
        return a[0].localeCompare(b[0]);
      }
      return numA - numB;
    });
  }, [students]);

  const lastSyncedLabel = lastSynced
    ? lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not synced yet';

  const heroStatusClass = loading ? 'status-chip syncing' : 'status-chip live';
  const heroStatusLabel = loading ? 'Syncing roster…' : 'Roster current';

  return (
    <div className="standard-page-layout students-roster-page">
      <section className="students-hero-card">
        <div className="students-hero-copy">
          <p className="students-hero-kicker">Student roster • Approved status</p>
          <h1>Enrolled cohort directory</h1>
          <p className="students-hero-subtitle">
            Keep every cleared student aligned with scheduling and enrollment workflows. Search, filter, and export-ready data
            stay in one workspace.
          </p>
          <div className="students-hero-meta">
            <span>Last synced · {lastSyncedLabel}</span>
            <span className={heroStatusClass}>{heroStatusLabel}</span>
          </div>
        </div>
        <div className="students-hero-actions">
          <div className="students-hero-stats">
            <div>
              <span>Total approved</span>
              <strong>{students.length}</strong>
            </div>
            <div>
              <span>Programs tracked</span>
              <strong>{programOptions.length || '—'}</strong>
            </div>
          </div>
          <div className="students-hero-buttons">
            <button type="button" className="admin-ghost-btn" onClick={clearFilters}>
              Reset filters
            </button>
            <button type="button" className="admin-primary-btn" onClick={loadStudents} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh roster'}
            </button>
          </div>
        </div>
      </section>

      <section className="students-metrics-grid">
        {rosterStats.map((card) => (
          <article key={card.label} className="students-metric-card">
            <p className="metric-label">{card.label}</p>
            <p className="metric-value">{card.value}</p>
            <p className="metric-detail">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="students-content-grid">
        <aside className="students-filter-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Filters</p>
              <h3>Focus the roster</h3>
            </div>
            <span className="panel-count">
              Showing {filtered.length} of {students.length}
            </span>
          </div>

          <div className="students-search-bar">
            <input
              type="search"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search students"
            />
          </div>

          <div className="students-filter-controls">
            <label>
              Program
              <select name="program" value={filters.program} onChange={handleFilterChange}>
                <option value="">All programs</option>
                {programOptions.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Year level
              <select name="year" value={filters.year} onChange={handleFilterChange}>
                <option value="">All years</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Semester
              <select name="semester" value={filters.semester} onChange={handleFilterChange}>
                <option value="">All semesters</option>
                {semesterOptions.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type="button" className="btn-clear-filters" onClick={clearFilters}>
            Clear filters
          </button>

          <div className="students-cohort-card">
            <p className="panel-kicker">Top cohorts</p>
            <h4>Programs with highest enrollment</h4>
            <ul>
              {cohortLeaders.map(([program, count]) => (
                <li key={program}>
                  <span>{program}</span>
                  <span className="cohort-count">{count}</span>
                </li>
              ))}
              {cohortLeaders.length === 0 && <li>No programs recorded yet.</li>}
            </ul>
          </div>

          <div className="students-cohort-card">
            <p className="panel-kicker">Year snapshot</p>
            <h4>Distribution by level</h4>
            <ul>
              {yearDistribution.map(([label, count]) => (
                <li key={label}>
                  <span>{label}</span>
                  <span className="cohort-count">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="students-table-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Directory</p>
              <h3>Approved students</h3>
              <p className="panel-subtitle">
                Export-ready roster. Use filters on the left to hone in on cohorts or keep it broad for reporting.
              </p>
            </div>
            <span className="panel-count">{filtered.length} results</span>
          </div>

          {error && <p className="students-error">{error}</p>}

          <div className="students-table-wrapper modern">
            {loading ? (
              <div className="students-loading">Loading students…</div>
            ) : filtered.length === 0 ? (
              <p className="students-empty">
                {search || filters.program || filters.year || filters.semester
                  ? 'No students match the current filters.'
                  : 'No enrolled students found.'}
              </p>
            ) : (
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Program</th>
                    <th>Year</th>
                    <th>Semester</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => (
                    <tr key={student.id || `${student.email}-${student.program?.id || 'program'}`}>
                      <td>
                        <div className="student-identity">
                          <p className="student-name">{`${student.firstName || ''} ${student.lastName || ''}`.trim() || '—'}</p>
                          <span className="student-meta">ID {student.id || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <p className="student-program">{student.program?.name || 'Unassigned'}</p>
                        <span className="student-meta">{student.department?.name || 'No department'}</span>
                      </td>
                      <td>{student.yearLevel || '—'}</td>
                      <td>{student.semester || '—'}</td>
                      <td>{student.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </section>
    </div>
  );
};

export default StudentsListPage;
