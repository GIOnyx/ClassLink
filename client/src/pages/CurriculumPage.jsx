import React, { useMemo, useState, useEffect } from 'react';
import '../App.css';
import './CurriculumPage.css';
import { getCurriculum } from '../services/backend';

// when curriculum data comes from the server, it will be a flat list of items with yearLabel and termTitle

const departments = [
  { id: 'BSIT', label: 'BSIT - Bachelor of Science in Information Technology' },
  { id: 'BSCS', label: 'BSCS - Bachelor of Science in Computer Science' },
  { id: 'BSIS', label: 'BSIS - Bachelor of Science in Information Systems' },
];

const CurriculumPage = () => {
  const [selectedDept, setSelectedDept] = useState(departments[0].label);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCurriculum(selectedDept).then(res => {
      if (!mounted) return;
      setCurrent(res.data);
    }).catch(() => {
      if (!mounted) return;
      setCurrent(null);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [selectedDept]);

  return (
    <div className="standard-page-layout curriculum-root">
      <div className="curriculum-header">
        <div className="curriculum-controls">
          <label htmlFor="deptSelect" className="small-label">Department</label>
          <select id="deptSelect" className="dept-select" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
            {departments.map(d => (
              <option key={d.id} value={d.label}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="curriculum-title">
          <h2>{current ? current.programName : 'Curriculum'}</h2>
        </div>
      </div>

      <div className="curriculum-content">
        {loading ? <div>Loading…</div> : null}
        {current ? (
          // group items by yearLabel then termTitle
          (() => {
            const items = current.items || [];
            const byYear = {};
            items.forEach(it => {
              const y = it.yearLabel || 'Unknown Year';
              const t = it.termTitle || 'Term';
              byYear[y] = byYear[y] || {};
              byYear[y][t] = byYear[y][t] || [];
              byYear[y][t].push(it);
            });

            return Object.keys(byYear).map((yearKey, yi) => (
              <div className="curriculum-year" key={yi}>
                <h3 className="year-title">{yearKey}</h3>
                {Object.keys(byYear[yearKey]).map((termKey, ti) => (
                  <div className="term-block" key={ti}>
                    <h4 className="term-title">{termKey}</h4>
                    <div className="table-wrap">
                      <table className="curriculum-table">
                        <thead>
                          <tr>
                            <th>Subject Code</th>
                            <th>Prerequisite</th>
                            <th>Equiv. Subject Code</th>
                            <th>Description</th>
                            <th>Units</th>
                          </tr>
                        </thead>
                        <tbody>
                          {byYear[yearKey][termKey].map((s, i) => (
                            <tr key={i}>
                              <td className="mono">{s.subjectCode}</td>
                              <td className="mono">{s.prerequisite}</td>
                              <td className="mono">{s.equivSubjectCode}</td>
                              <td>{s.description}</td>
                                <td className="mono">{s.units}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ));
          })()
        ) : (
          <div>No curriculum available for selected department.</div>
        )}
      </div>
    </div>
  );
};

export default CurriculumPage;
