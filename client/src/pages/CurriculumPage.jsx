import React, { useState, useEffect } from 'react';
import '../App.css';
import './CurriculumPage.css';
import { getCurriculumByProgramId, createCurriculum, updateCurriculum } from '../services/backend';
import useDepartments from '../hooks/useDepartments';
import usePrograms from '../hooks/usePrograms';

const YEAR_LABELS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
  'Fifth Year',
  'Sixth Year'
];

const ordinalSuffix = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return `${value}th`;
  const mod100 = normalized % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${normalized}th`;
  switch (normalized % 10) {
    case 1:
      return `${normalized}st`;
    case 2:
      return `${normalized}nd`;
    case 3:
      return `${normalized}rd`;
    default:
      return `${normalized}th`;
  }
};

const yearLabelFor = (year) => YEAR_LABELS[year - 1] || `${ordinalSuffix(year)} Year`;

const parseYearLabelToNumber = (label) => {
  if (!label) return null;
  const raw = String(label).trim().toLowerCase();
  if (!raw) return null;
  const matchIndex = YEAR_LABELS.findIndex((candidate) => {
    const normalized = candidate.toLowerCase();
    return raw === normalized || raw.includes(normalized);
  });
  if (matchIndex >= 0) return matchIndex + 1;
  const digitMatch = raw.match(/(\d+)/);
  return digitMatch ? Number.parseInt(digitMatch[1], 10) : null;
};

const getYearNumberFromItem = (item) => {
  if (!item) return null;
  if (item.year !== undefined && item.year !== null) {
    const numeric = Number(item.year);
    if (Number.isFinite(numeric) && numeric > 0) {
      return Math.trunc(numeric);
    }
  }
  return parseYearLabelToNumber(item.yearLabel);
};

// when curriculum data comes from the server, it will be a flat list of items with yearLabel and termTitle

const CurriculumPage = ({ role }) => {
  const [selectedDept, setSelectedDept] = useState('');
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  // removed unused showForm state
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const { departments: adminDepartments, loading: depsLoading, refresh: refreshDepartments } = useDepartments();
  const { programs: adminPrograms, loading: programsLoading, refresh: refreshPrograms } = usePrograms(selectedDeptId);
  const [viewingCurriculum, setViewingCurriculum] = useState(null);
  const [editingCurriculum, setEditingCurriculum] = useState(null);
  const [newYearLabelInput, setNewYearLabelInput] = useState('');
  const [newTermTitleInput, setNewTermTitleInput] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const setFieldError = (field, msg) => setErrors(prev => ({ ...prev, [field]: msg }));
  const clearFieldError = (field) => setErrors(prev => { const c = { ...prev }; delete c[field]; return c; });
  const clearItemError = (index, field) => setErrors(prev => {
    const c = { ...prev };
    if (!c.items) return prev;
    const itemsCopy = { ...c.items };
    if (itemsCopy[index]) {
      const itemCopy = { ...itemsCopy[index] };
      delete itemCopy[field];
      if (Object.keys(itemCopy).length === 0) {
        delete itemsCopy[index];
      } else {
        itemsCopy[index] = itemCopy;
      }
    }
    if (Object.keys(itemsCopy).length === 0) delete c.items; else c.items = itemsCopy;
    return c;
  });

  const handleDurationChange = (rawValue) => {
    clearFieldError('durationInYears');
    const parsed = rawValue === '' ? null : Number.parseInt(rawValue, 10);

    setEditingCurriculum(prev => {
      if (!prev) return prev;

      const nextDuration = parsed !== null && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
      const prevItems = Array.isArray(prev.items) ? [...prev.items] : [];

      if (!nextDuration) {
        return { ...prev, durationInYears: nextDuration };
      }

      const numericYears = prevItems
        .map(getYearNumberFromItem)
        .filter(year => year !== null && Number.isFinite(year));
      const currentMaxYear = numericYears.length ? Math.max(...numericYears) : 0;
      const priorDuration = Number.isInteger(prev.durationInYears) && prev.durationInYears > 0
        ? prev.durationInYears
        : currentMaxYear;
      const baseline = Math.max(priorDuration, currentMaxYear);

      let items = prevItems;

      if (nextDuration < baseline) {
        items = prevItems.filter(item => {
          const yearNumber = getYearNumberFromItem(item);
          return yearNumber === null || yearNumber <= nextDuration;
        });
      } else if (nextDuration > baseline) {
        items = [...prevItems];
        const existingYears = new Set(numericYears);
        for (let year = baseline + 1; year <= nextDuration; year += 1) {
          if (!existingYears.has(year)) {
            items.push({
              year,
              yearLabel: yearLabelFor(year),
              semester: 'First Term',
              termTitle: 'First Term',
              subjectCode: '',
              prerequisite: '',
              equivSubjectCode: '',
              description: '',
              units: ''
            });
            existingYears.add(year);
          }
        }
      }

      return {
        ...prev,
        durationInYears: nextDuration,
        items
      };
    });
  };

  // Fetch curriculum for the selected program (student flow)
  useEffect(() => {
    let cancelled = false;

    if (!selectedProgramId) {
      setCurrent(null);
      setLoadError(null);
      setLoading(false);
      return () => { cancelled = true; };
    }

    setLoading(true);
    setLoadError(null);
    getCurriculumByProgramId(selectedProgramId)
      .then(res => {
        if (cancelled) return;
        setCurrent(res.data);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('Failed to load curriculum for program', selectedProgramId, err);
        setCurrent(null);
        setLoadError(err);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [selectedProgramId]);

  // Reset state when the available programs change (e.g., department cleared)
  useEffect(() => {
    if (!adminPrograms || adminPrograms.length === 0) {
      setSelectedProgramId('');
    }
  }, [adminPrograms]);

  // Clear program selection and current curriculum when department changes
  useEffect(() => {
    setSelectedProgramId('');
    setCurrent(null);
    setLoadError(null);
  }, [selectedDeptId]);

  // If the admin opens the editor but departments haven't loaded yet, fetch them.
  useEffect(() => {
    if (editingCurriculum && role === 'ADMIN' && (!adminDepartments || adminDepartments.length === 0)) {
      refreshDepartments();
    }
  }, [editingCurriculum, role, adminDepartments]);

  return (
    <div className="standard-page-layout curriculum-root">
      {!viewingCurriculum && !editingCurriculum && (
        <div className="curriculum-header">
          {role === 'ADMIN' ? (
          <div className="curriculum-controls admin-controls">
            <div className="dept-block">
              <label htmlFor="deptSelect" className="small-label">Department</label>
                <select
                  id="deptSelect"
                  className="dept-select"
                  value={selectedDeptId}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    setSelectedDeptId(deptId);
                    const deptObj = adminDepartments.find(d => String(d.id) === String(deptId));
                    setSelectedDept(deptObj ? (deptObj.name || '') : '');
                  }}
                  disabled={depsLoading}
                >
                  <option value="">{
                    depsLoading
                      ? 'Loading…'
                      : adminDepartments.length > 0
                        ? 'Select Department'
                        : '-- No Departments --'
                  }</option>
                  {!depsLoading && adminDepartments.length > 0 ? (
                    adminDepartments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))
                  ) : null}
                </select>
            </div>

            <div className="programs-list-wrap">
              <h4 className="programs-heading">Programs</h4>
              <div className="programs-panel">
                {selectedDeptId === '' ? (
                  <div className="no-programs">Select a department to view its programs.</div>
                ) : programsLoading ? (
                  <div className="no-programs">Loading programs…</div>
                ) : adminPrograms.length === 0 ? (
                  <div className="no-programs">No programs for selected department.</div>
                ) : (
                  <div className="admin-program-list">
                    {adminPrograms.map(p => (
                      <div className="program-row" key={p.id}>
                        <div className="program-name">{p.name}</div>
                            <div className="program-actions">
                              <button className="btn-view" onClick={async () => {
                                try {
                                  const res = await getCurriculumByProgramId(p.id);
                                  setViewingCurriculum(res.data);
                                  setEditingCurriculum(null);
                                } catch (e) {
                                  console.error('View error for programId', p.id, e);
                                  alert('No curriculum found for this program.');
                                }
                              }}>View</button>

                              <button className="btn-edit" onClick={async () => {
                                try {
                                  const res = await getCurriculumByProgramId(p.id);
                                  // make a deep copy for editing
                                  setEditingCurriculum(JSON.parse(JSON.stringify(res.data)));
                                  setViewingCurriculum(null);
                                } catch (e) {
                                  console.error('Edit error for programId', p.id, e);
                                  alert('No curriculum found to edit for this program.');
                                }
                              }}>Edit</button>

                              <button className="btn-delete" onClick={() => { if (window.confirm('Delete program?')) { alert('Delete not implemented'); } }}>Delete</button>
                            </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          ) : (
          <div>
            <div style={{display:'flex', alignItems:'center', gap:12}} className="curriculum-controls">
              <div style={{display:'flex', flexDirection:'column'}}>
                <label htmlFor="deptSelect" className="small-label">Department</label>
                <select
                  id="deptSelect"
                  className="dept-select"
                  value={selectedDeptId}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    setSelectedDeptId(deptId);
                    const deptObj = adminDepartments.find(d => String(d.id) === String(deptId));
                    setSelectedDept(deptObj ? (deptObj.name || '') : '');
                  }}
                  disabled={depsLoading}
                >
                  <option value="">{
                    depsLoading
                      ? 'Loading…'
                      : adminDepartments.length > 0
                        ? 'Select Department'
                        : '-- No Departments --'
                  }</option>
                  {!depsLoading && adminDepartments.length > 0 ? (
                    adminDepartments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))
                  ) : null}
                </select>
              </div>

              <div style={{display:'flex', flexDirection:'column'}}>
                <label htmlFor="programSelect" className="small-label">Program</label>
                <select
                  id="programSelect"
                  className="dept-select"
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  disabled={!selectedDeptId || depsLoading || programsLoading}
                >
                  <option value="">{
                    programsLoading
                      ? 'Loading…'
                      : adminPrograms && adminPrograms.length > 0
                        ? 'Select Program'
                        : '-- No Programs --'
                  }</option>
                  {!programsLoading && adminPrograms && adminPrograms.length > 0 ? (
                    adminPrograms.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  ) : null}
                </select>
              </div>
            </div>
            <div className="curriculum-title" style={{marginTop:12}}>
              <h2>{current ? current.programName : 'Curriculum'}</h2>
            </div>
          </div>
        )}
        </div>
      )}

      {(viewingCurriculum || editingCurriculum) && (
        <div className="fullview-header" style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
          <div style={{flex:1}}>
            <h2 style={{margin:0}}>{(viewingCurriculum && viewingCurriculum.programName) || (editingCurriculum && editingCurriculum.programName) || 'Curriculum'}</h2>
          </div>
          <button className="back-btn" onClick={() => { setViewingCurriculum(null); setEditingCurriculum(null); }}>← Back</button>
        </div>
      )}

      <div className="curriculum-content">
        {loading ? <div>Loading…</div> : null}
        {!loading && !viewingCurriculum && !editingCurriculum && loadError ? (
          <div className="no-items-box">Unable to load curriculum for the selected program.</div>
        ) : null}
        {!loading && !viewingCurriculum && !editingCurriculum && selectedProgramId && !loadError && !current ? (
          <div className="no-items-box">No curriculum found for the selected program.</div>
        ) : null}
        {viewingCurriculum ? (
          // FULL-PAGE READ-ONLY VIEW (replaces modal)
          <div className="curriculum-fullview">
            
            <div className="fullview-body">
              {(() => {
                const items = viewingCurriculum.items || [];
                const byYear = {};
                items.forEach(it => {
                  const y = it.yearLabel || 'Unknown Year';
                  const t = it.semester || 'Semester';
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
              })()}
            </div>
          </div>
        ) : editingCurriculum ? (
          // EDIT MODE: full-page editable view with program fields and add-row controls
          (() => {
            const cur = editingCurriculum;
            const items = cur.items || [];
            const byYear = {};
            items.forEach((it, idx) => {
              const y = it.yearLabel || 'Unknown Year';
              const t = it.semester || 'Term';
              byYear[y] = byYear[y] || {};
              byYear[y][t] = byYear[y][t] || [];
              byYear[y][t].push({ ...it, __idx: idx });
            });

            const handleItemChange = (idx, field, value) => {
              setEditingCurriculum(prev => {
                const copy = { ...prev };
                copy.items = copy.items.map((it, i) => i === idx ? { ...it, [field]: value } : it);
                return copy;
              });
            };

            const addSubject = () => {
              setEditingCurriculum(prev => ({ ...prev, items: [...(prev.items||[]), { yearLabel: 'First Year', semester: 'First Term', subjectCode:'', prerequisite:'', equivSubjectCode:'', description:'', units: '' }] }));
            };

            return (
              <div>
                    <div className="editor-row">
                      <div className="editor-col flex-1">
                        <label className="label-block">Program Code</label>
                        <input className={`program-meta-input input-full ${errors.programCode ? 'invalid' : ''}`} value={cur.programCode || ''} onChange={(e) => { clearFieldError('programCode'); setEditingCurriculum(prev => ({ ...prev, programCode: e.target.value })); }} />
                        {errors.programCode ? <div className="inline-error">{errors.programCode}</div> : null}
                      </div>
                      <div className="editor-col flex-3">
                        <label className="label-block">Program Name</label>
                        <input className={`program-meta-input input-full ${errors.programName ? 'invalid' : ''}`} value={cur.programName || ''} onChange={(e) => { clearFieldError('programName'); setEditingCurriculum(prev => ({ ...prev, programName: e.target.value })); }} />
                        {errors.programName ? <div className="inline-error">{errors.programName}</div> : null}
                      </div>
                      <div className="editor-col flex-1">
                        <label className="label-block">Duration (years)</label>
                        <input
                          type="number"
                          min={1}
                          className={`program-meta-input input-full`}
                          value={cur.durationInYears || ''}
                          onChange={(e) => handleDurationChange(e.target.value)}
                        />
                      </div>
                      <div className="editor-col flex-2">
                        <label className="label-block">Department</label>
                        <select
                          className={`program-meta-input input-full ${errors.departmentId ? 'invalid' : ''}`}
                          value={cur.departmentId || (cur.department && cur.department.id) || ''}
                          onChange={(e) => { clearFieldError('departmentId'); setEditingCurriculum(prev => ({ ...prev, departmentId: e.target.value })); }}
                        >
                          <option value="">-- Select Department --</option>
                          {adminDepartments && adminDepartments.length > 0 ? (
                            adminDepartments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))
                          ) : (
                            <option value="">-- No Departments --</option>
                          )}
                        </select>
                        {errors.departmentId ? <div className="inline-error">{errors.departmentId}</div> : null}
                      </div>
                      
                    </div>

                {/* When creating via Duration we auto-generate years; manual year/term inputs removed */}
                {errors.newYearTerm ? <div className="inline-error">{errors.newYearTerm}</div> : null}

                {items.length === 0 ? (
                  <div className="no-items-box">No curriculum items yet. Use "Add Subject" to create entries.</div>
                ) : (
                  Object.keys(byYear).map((yearKey, yi) => (
                    <div className="curriculum-year" key={yi}>
                      <div className="year-header">
                        <h3 className="year-title" style={{margin:0}}>{yearKey}</h3>
                        <div>
                          <button className="inline-action" onClick={() => {
                            // add next term for this year (Second Term, Third Term...)
                            const terms = Object.keys(byYear[yearKey] || {});
                            const nextIdx = (terms ? terms.length : 0) + 1;
                            const ord = ['First','Second','Third','Fourth','Fifth','Sixth'][nextIdx-1] || (nextIdx + 'th');
                            const nextTerm = ord + ' Term';
                            setEditingCurriculum(prev => ({ ...prev, items: [...(prev.items||[]), { yearLabel: yearKey, semester: nextTerm, subjectCode:'', prerequisite:'', equivSubjectCode:'', description:'', units: '' }] }));
                          }}>Add Semester</button>
                        </div>
                      </div>
                      {Object.keys(byYear[yearKey]).map((termKey, ti) => (
                        <div className="term-block" key={ti}>
                          <div className="term-header">
                            <h4 className="term-title" style={{margin:0}}>{termKey}</h4>
                            <div>
                              <button className="inline-action" onClick={() => {
                                // add a blank subject to this year/term
                                setEditingCurriculum(prev => ({ ...prev, items: [...(prev.items||[]), { yearLabel: yearKey, semester: termKey, subjectCode:'', prerequisite:'', equivSubjectCode:'', description:'', units: '' }] }));
                              }}>Add Subject</button>
                            </div>
                          </div>
                          <div className="table-wrap">
                            <table className="curriculum-table">
                              <thead>
                                <tr>
                                  <th>Subject Code</th>
                                  <th>Prerequisite</th>
                                  <th>Equiv. Subject Code</th>
                                  <th>Description</th>
                                  <th>Units</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {byYear[yearKey][termKey].map((s) => (
                                  <tr key={s.__idx}>
                                    <td className="mono"><input className="table-input" value={s.subjectCode || ''} onChange={(e) => handleItemChange(s.__idx, 'subjectCode', e.target.value)} /></td>
                                    <td className="mono"><input className="table-input" value={s.prerequisite || ''} onChange={(e) => handleItemChange(s.__idx, 'prerequisite', e.target.value)} /></td>
                                    <td className="mono"><input className="table-input" value={s.equivSubjectCode || ''} onChange={(e) => handleItemChange(s.__idx, 'equivSubjectCode', e.target.value)} /></td>
                                    <td><input className="table-input" value={s.description || ''} onChange={(e) => handleItemChange(s.__idx, 'description', e.target.value)} /></td>
                                    <td className="mono">
                                      <input className={`table-input ${errors.items && errors.items[s.__idx] && errors.items[s.__idx].units ? 'invalid' : ''}`} value={s.units || ''} onChange={(e) => { clearItemError(s.__idx, 'units'); handleItemChange(s.__idx, 'units', e.target.value); }} />
                                      {errors.items && errors.items[s.__idx] && errors.items[s.__idx].units ? <div className="inline-error">{errors.items[s.__idx].units}</div> : null}
                                    </td>
                                    <td><button className="modal-btn" onClick={() => setEditingCurriculum(prev => { const copy = { ...prev }; copy.items = copy.items.filter((_,i)=> i !== s.__idx); return copy; })}>Remove</button></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            );
          })()
        ) : current ? (
          // group items by yearLabel then termTitle
          (() => {
            const items = current.items || [];
            if (items.length === 0) {
              return (
                <div className="no-items-box">No curriculum items found for this program.</div>
              );
            }
            const byYear = {};
            items.forEach(it => {
              const y = it.yearLabel || 'Unknown Year';
              const t = it.semester || 'Term';
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
          null
        )}
      </div>

      {/* Admin floating Add button (hidden when viewing) */}
      {role === 'ADMIN' && !viewingCurriculum && !editingCurriculum && (
        <>
          <button className="fab-add" onClick={() => { setEditingCurriculum({ programCode: '', programName: '', items: [], isNew: true, departmentId: selectedDeptId || '' }); }} title="Add Curriculum">Add Curriculum</button>

          {/* Add modal removed — Add now opens full-page editor via setEditingCurriculum */}
        </>
      )}

      

      {/* Save button when editing */}
      {editingCurriculum && (
        <button className="save-curriculum-btn" disabled={saving} onClick={async () => {
          try {
            const id = editingCurriculum.curriculumId || editingCurriculum.id;
            const confirmSave = window.confirm(id ? 'Save changes to this curriculum?' : 'Create this new curriculum?');
            if (!confirmSave) return;
            setSaving(true);

            // Basic client-side validation (collect inline errors)
            setErrors({});
            if (!editingCurriculum.departmentId || editingCurriculum.departmentId === '') {
              setFieldError('departmentId', 'Please select a Department for this curriculum.');
              setSaving(false);
              return;
            }
            if (!editingCurriculum.programCode || !editingCurriculum.programCode.toString().trim()) {
              setFieldError('programCode', 'Program Code is required.');
              setSaving(false);
              return;
            }
            if (!editingCurriculum.programName || !editingCurriculum.programName.toString().trim()) {
              setFieldError('programName', 'Program Name is required.');
              setSaving(false);
              return;
            }

            // validate units are numeric when provided
            const itemsToValidate = editingCurriculum.items || [];
            const itemsErrors = {};
            for (let i = 0; i < itemsToValidate.length; i++) {
              const u = itemsToValidate[i].units;
              if (u !== undefined && u !== null && u !== '' && isNaN(Number(u))) {
                itemsErrors[i] = { units: 'Units must be a number' };
              }
            }
            if (Object.keys(itemsErrors).length > 0) {
              setErrors(prev => ({ ...prev, items: itemsErrors }));
              setSaving(false);
              return;
            }

            // Prepare payload (normalize units to numbers where appropriate)
            const payload = { ...editingCurriculum };
            // convert departmentId into department object expected by backend
            if (payload.departmentId) {
              payload.department = { id: payload.departmentId };
              delete payload.departmentId;
            } else if (editingCurriculum.department && editingCurriculum.department.id) {
              payload.department = { id: editingCurriculum.department.id };
            }
            payload.items = (payload.items || []).map(it => ({ ...it, units: (it.units === '' || it.units === null || it.units === undefined) ? null : Number(it.units) }));

            // saving payload (debug logs removed for cleaner console)

            const deptToRefresh = selectedDeptId || (payload.department && payload.department.id) || editingCurriculum.departmentId || '';

            if (id) {
              const res = await updateCurriculum(id, payload);
              alert('Curriculum updated');
            } else {
              const res = await createCurriculum(payload);
              alert('Curriculum created');
            }

            // Refresh programs list for the active department so admin sees the new program immediately
            try {
              if (deptToRefresh) {
                setSelectedDeptId(deptToRefresh);
                // programs hook will react to selectedDeptId change; also trigger explicit refresh
                refreshPrograms();
              }
            } catch (e) {
              console.warn('Failed to refresh programs after save', e);
            }

            setEditingCurriculum(null);
            setSaving(false);
          } catch (e) {
            console.error('Save error', e);
            if (e?.response?.data) console.error('Server response:', e.response.data);
            alert('Failed to save curriculum — see console for details');
            setSaving(false);
          }
        }}>{editingCurriculum.curriculumId || editingCurriculum.id ? 'Save Changes' : 'Create Curriculum'}</button>
      )}
    </div>
  );
};

export default CurriculumPage;
