import { useState, useEffect } from "react";
import { Award, Printer, CheckCircle, XCircle } from "lucide-react";
import { studentPortalApi } from "../../api/studentPortalApi";
import type { ResultsResponse, SemesterResults, ExamSubjectResult } from "../../types/studentPortal.types";

function ResultBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const isPass = status === "PASS";
  return (
    <span className={`sp-result-badge ${isPass ? "sp-result-pass" : "sp-result-fail"}`}>
      {isPass ? <CheckCircle size={14} /> : <XCircle size={14} />}
      {status}
    </span>
  );
}

function GradeTable({ semester }: { semester: SemesterResults }) {
  const percentage =
    semester.totalMaxMarks > 0
      ? ((semester.totalMarksObtained / semester.totalMaxMarks) * 100).toFixed(1)
      : "0.0";

  const passedCount = semester.subjects.filter((s) => s.resultStatus === "PASS").length;
  const allPassed = passedCount === semester.subjects.length && semester.subjects.length > 0;

  return (
    <div className="sp-grade-section">
      {/* Semester Stats */}
      <div className="sp-stats-row">
        <div className="sp-stat-card">
          <span className="sp-stat-label">Total Marks</span>
          <span className="sp-stat-value sp-stat-blue">
            {semester.totalMarksObtained}
            <small> / {semester.totalMaxMarks}</small>
          </span>
        </div>
        <div className="sp-stat-card">
          <span className="sp-stat-label">Percentage</span>
          <span className="sp-stat-value sp-stat-teal">{percentage}%</span>
        </div>
        <div className="sp-stat-card">
          <span className="sp-stat-label">Credits</span>
          <span className="sp-stat-value sp-stat-green">{semester.totalCredits}</span>
        </div>
        <div className="sp-stat-card">
          <span className="sp-stat-label">Semester Status</span>
          <span className={`sp-stat-value ${allPassed ? "sp-stat-green" : "sp-stat-amber"}`}>
            {allPassed ? "PASSED" : `${passedCount}/${semester.subjects.length} Passed`}
          </span>
        </div>
      </div>

      {/* Marks Table */}
      <div className="sp-table-wrapper">
        <table className="sp-results-table">
          <thead>
            <tr>
              <th>Subject Code & Title</th>
              <th>Credits</th>
              <th>Marks Obtained</th>
              <th>Max Marks</th>
              <th>Percentage</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {semester.subjects.map((sub) => (
              <SubjectRow key={sub.recordId} subject={sub} />
            ))}
          </tbody>
          <tfoot>
            <tr className="sp-table-footer">
              <td>Total / Summary</td>
              <td>{semester.totalCredits}</td>
              <td>{semester.totalMarksObtained}</td>
              <td>{semester.totalMaxMarks}</td>
              <td>{percentage}%</td>
              <td>
                <ResultBadge status={allPassed ? "PASS" : "PARTIAL"} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function SubjectRow({ subject }: { subject: ExamSubjectResult }) {
  const pct =
    subject.maxMarks > 0
      ? ((subject.marksObtained / subject.maxMarks) * 100).toFixed(1)
      : "0.0";

  return (
    <tr>
      <td>
        <div className="sp-subject-cell">
          <span className="sp-subject-code">{subject.subjectCode}</span>
          <span className="sp-subject-cell-name">{subject.subjectName}</span>
        </div>
      </td>
      <td>{subject.credits}</td>
      <td className="sp-marks-cell">{subject.marksObtained}</td>
      <td>{subject.maxMarks}</td>
      <td>{pct}%</td>
      <td>
        <ResultBadge status={subject.resultStatus} />
      </td>
    </tr>
  );
}

export function ExamsResultsPage() {
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    studentPortalApi
      .getResults()
      .then((res) => {
        setData(res);
        if (res.semesters.length > 0) {
          setActiveTab(res.semesters[res.semesters.length - 1].periodCode);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-spinner" />
        <span>Loading results...</span>
      </div>
    );
  }

  if (error) {
    return <div className="sp-error-card">{error}</div>;
  }

  if (!data || data.semesters.length === 0) {
    return (
      <div className="sp-empty-state">
        <Award size={48} />
        <h3>No Published Results</h3>
        <p>No exam results have been published yet for your account.</p>
      </div>
    );
  }

  const activeSemester = data.semesters.find((s) => s.periodCode === activeTab);

  return (
    <div className="sp-page-content">
      {/* Module Header */}
      <div className="sp-module-hero sp-hero-amber">
        <div className="sp-module-hero-icon">
          <Award size={28} />
        </div>
        <div className="sp-module-hero-text">
          <h2 className="sp-module-hero-title">Exams & Results</h2>
          <p className="sp-module-hero-subtitle">
            Your academic performance across all semesters
          </p>
        </div>
        <button className="sp-print-btn" onClick={() => window.print()}>
          <Printer size={16} />
          Print Marksheet
        </button>
      </div>

      {/* Semester Tabs */}
      <div className="sp-semester-tabs">
        {data.semesters.map((sem) => (
          <button
            key={sem.periodCode}
            className={`sp-tab ${activeTab === sem.periodCode ? "sp-tab-active" : ""}`}
            onClick={() => setActiveTab(sem.periodCode)}
          >
            {sem.periodName}
          </button>
        ))}
      </div>

      {/* Active Semester Results */}
      {activeSemester && <GradeTable semester={activeSemester} />}
    </div>
  );
}
