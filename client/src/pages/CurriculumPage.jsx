import React, { useMemo, useState } from 'react';
import '../App.css';
import './CurriculumPage.css';

const curricula = {
  BSIT: {
    programName: 'Bachelor of Science in Information Technology',
    years: [
      {
        title: 'First Year',
        terms: [
          {
            title: 'First Term',
            subjects: [
              { code: 'PHILO031', prereq: '', equiv: 'PHILO031', desc: 'Ethics', units: 3, schoolYear: '2324', semester: 'First Semester' },
              { code: 'CSIT121', prereq: '', equiv: 'CSIT121', desc: 'Fundamentals of Programming', units: 3, schoolYear: '2324', semester: 'First Semester' },
              { code: 'CSIT111', prereq: '', equiv: 'CSIT111', desc: 'Introduction to Computing', units: 3, schoolYear: '2324', semester: 'First Semester' },
              { code: 'MATH031', prereq: '', equiv: 'MATH031', desc: 'Mathematics in the Modern World', units: 3, schoolYear: '2324', semester: 'First Semester' },
              { code: 'PE103', prereq: '', equiv: 'PE103', desc: 'Movement Enhancement / PATHFit 1-Movement Competency Training', units: 2, schoolYear: '2324', semester: 'First Semester' },
              { code: 'NSTP111', prereq: '', equiv: 'NSTP111', desc: 'National Service Training Program 1', units: 3, schoolYear: '2324', semester: 'First Semester' },
              { code: 'ENGL031', prereq: '', equiv: 'ENGL031', desc: 'Purposive Communication', units: 3, schoolYear: '2324', semester: 'First Semester' },
              { code: 'PSYCH031', prereq: '', equiv: 'PSYCH031', desc: 'Understanding the Self', units: 3, schoolYear: '2324', semester: 'First Semester' },
            ],
          },
          {
            title: 'Second Term',
            subjects: [
              { code: 'HUM031', prereq: '', equiv: 'HUM031', desc: 'Art Appreciation', units: 3, schoolYear: '2324', semester: 'Second Semester' },
              { code: 'CSIT112', prereq: 'CSIT121', equiv: 'CSIT112', desc: 'Discrete Structures 1', units: 3, schoolYear: '2324', semester: 'Second Semester' },
              { code: 'PE104', prereq: 'PE103', equiv: 'PE104', desc: 'Fitness Exercises / PATHFit 2-Exercise-based Fitness Activities', units: 2, schoolYear: '2324', semester: 'Second Semester' },
              { code: 'CSIT122', prereq: 'CSIT121', equiv: 'CSIT122', desc: 'Intermediate Programming', units: 3, schoolYear: '2324', semester: 'Second Semester' },
              { code: 'CS132', prereq: 'CSIT111', equiv: 'CS132', desc: 'Introduction to Computer Systems', units: 3, schoolYear: '2324', semester: 'Second Semester' },
              { code: 'NSTP112', prereq: 'NSTP111', equiv: 'NSTP112', desc: 'National Service Training Program 2', units: 3, schoolYear: '2324', semester: 'Second Semester' },
              { code: 'CSIT201', prereq: 'CSIT121', equiv: 'CSIT201', desc: 'Platform-based Development 2 (Web)', units: 3, schoolYear: '2324', semester: 'Second Semester' },
              { code: 'SOCSC1031', prereq: '', equiv: 'SOCSC1031', desc: 'Readings in Philippine History', units: 3, schoolYear: '2324', semester: 'Second Semester' },
              { code: 'STS031', prereq: '', equiv: 'STS031', desc: 'Science, Technology and Society', units: 3, schoolYear: '2324', semester: 'Second Semester' },
            ],
          },
        ],
      },
      {
        title: 'Second Year',
        terms: [
          {
            title: 'First Term',
            subjects: [
              { code: 'CSIT221', prereq: 'CSIT122', equiv: 'CSIT221', desc: 'Data Structures and Algorithms', units: 3, schoolYear: '2425', semester: 'First Semester' },
              { code: 'GE-IT1', prereq: '', equiv: 'SDG031', desc: 'General Education Elective 1', units: 3, schoolYear: '2425', semester: 'First Semester' },
              { code: 'IT227', prereq: 'CS132', equiv: 'IT227', desc: 'Networking 1', units: 3, schoolYear: '2425', semester: 'First Semester' },
              { code: 'CSIT227', prereq: 'CSIT122', equiv: 'CSIT227', desc: 'Object-oriented Programming 1', units: 3, schoolYear: '2425', semester: 'First Semester' },
              { code: 'PE205', prereq: 'PE103', equiv: 'PE205', desc: 'PATHFIT 1 / PATHFIT 3-Menu of Sports, Dance, Recreation and Martial Arts', units: 2, schoolYear: '2425', semester: 'First Semester' },
              { code: 'CSIT104', prereq: '', equiv: 'CSIT104', desc: 'Platform-based Development 1 (Multimedia)', units: 3, schoolYear: '2425', semester: 'First Semester' },
              { code: 'CSIT213', prereq: 'CSIT111', equiv: 'CSIT213', desc: 'Social Issues and Professional Practice', units: 3, schoolYear: '2425', semester: 'First Semester' },
              { code: 'SOCSIC032', prereq: '', equiv: 'SOCSIC032', desc: 'The Contemporary World', units: 3, schoolYear: '2425', semester: 'First Semester' },
            ],
          },
          {
            title: 'Second Term',
            subjects: [
              // You can extend for remaining terms if needed
            ],
          },
        ],
      },
    ],
  },
};

const departments = [
  { id: 'BSIT', label: 'BSIT - Bachelor of Science in Information Technology' },
  { id: 'BSCS', label: 'BSCS - Bachelor of Science in Computer Science' },
  { id: 'BSIS', label: 'BSIS - Bachelor of Science in Information Systems' },
];

const CurriculumPage = () => {
  const [selectedDept, setSelectedDept] = useState('BSIT');

  const current = useMemo(() => curricula[selectedDept], [selectedDept]);

  return (
    <div className="standard-page-layout curriculum-root">
      <div className="curriculum-header">
        <div className="curriculum-controls">
          <label htmlFor="deptSelect" className="small-label">Department</label>
          <select id="deptSelect" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="curriculum-title">
          <h2>{current ? current.programName : 'Curriculum'}</h2>
        </div>
      </div>

      <div className="curriculum-content">
        {current ? (
          current.years.map((yr, yi) => (
            <div className="curriculum-year" key={yi}>
              <h3 className="year-title">{yr.title}</h3>
              {yr.terms.map((term, ti) => (
                <div className="term-block" key={ti}>
                  <h4 className="term-title">{term.title}</h4>
                  <div className="table-wrap">
                    <table className="curriculum-table">
                      <thead>
                        <tr>
                          <th>Subject Code</th>
                          <th>Prerequisite</th>
                          <th>Equiv. Subject Code</th>
                          <th>Description</th>
                          <th>Units</th>
                          <th>Semester</th>
                        </tr>
                      </thead>
                      <tbody>
                        {term.subjects && term.subjects.length > 0 ? (
                          term.subjects.map((s, i) => (
                            <tr key={i}>
                              <td className="mono">{s.code}</td>
                              <td className="mono">{s.prereq}</td>
                              <td className="mono">{s.equiv}</td>
                              <td>{s.desc}</td>
                              <td className="mono">{s.units}</td>
                              <td>{s.semester}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="no-subjects">No subject</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div>No curriculum available for selected department.</div>
        )}
      </div>
    </div>
  );
};

export default CurriculumPage;
