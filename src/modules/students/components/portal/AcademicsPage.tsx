import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { studentPortalApi } from "../../api/studentPortalApi";
import type { AcademicsResponse, SemesterAcademics, SubjectInfo } from "../../types/studentPortal.types";

function SubjectTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    THEORY: "sp-badge-blue",
    PRACTICAL: "sp-badge-amber",
    LAB: "sp-badge-teal",
    PROJECT: "sp-badge-violet",
    INDUSTRIAL_TRAINING: "sp-badge-rose",
  };
  return (
    <span className={`sp-badge ${colors[type] || "sp-badge-slate"}`}>
      {type.replace("_", " ")}
    </span>
  );
}

function SubjectCard({ subject }: { subject: SubjectInfo }) {
  return (
    <div className="sp-subject-card">
      <div className="sp-subject-card-header">
        <span className="sp-subject-code">{subject.subjectCode}</span>
        <SubjectTypeBadge type={subject.subjectCategory || subject.subjectType} />
      </div>
      <h4 className="sp-subject-name">{subject.subjectName}</h4>
      <div className="sp-subject-meta">
        {subject.credits != null && (
          <span className="sp-subject-credits">{subject.credits} Credits</span>
        )}
        {subject.totalMarks != null && (
          <span className="sp-subject-marks">Total: {subject.totalMarks}</span>
        )}
        {subject.internalMarks != null && subject.externalMarks != null && (
          <span className="sp-subject-marks">
            Int: {subject.internalMarks} | Ext: {subject.externalMarks}
          </span>
        )}
      </div>
    </div>
  );
}

function SemesterSection({ semester }: { semester: SemesterAcademics }) {
  return (
    <div className="sp-semester-section">
      <div className="sp-semester-header">
        <h3 className="sp-semester-title">
          {semester.periodName}
          <span className="sp-semester-count">
            {semester.subjects.length} Subject{semester.subjects.length !== 1 ? "s" : ""}
          </span>
        </h3>
        <div className="sp-semester-meta">
          <span className="sp-badge sp-badge-slate">{semester.sectionName}</span>
          <span className={`sp-badge ${semester.enrollmentStatus === "ACTIVE" ? "sp-badge-green" : "sp-badge-slate"}`}>
            {semester.progressionStatus}
          </span>
        </div>
      </div>
      {semester.subjects.length === 0 ? (
        <p className="sp-empty-text">No subjects assigned for this semester.</p>
      ) : (
        <div className="sp-subjects-grid">
          {semester.subjects.map((sub) => (
            <SubjectCard key={sub.subjectId} subject={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AcademicsPage() {
  const [data, setData] = useState<AcademicsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    studentPortalApi
      .getAcademics()
      .then((res) => {
        setData(res);
        if (res.semesters.length > 0) {
          const active = res.semesters.find((s) => s.enrollmentStatus === "ACTIVE");
          setActiveTab(active?.periodCode || res.semesters[0].periodCode);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-spinner" />
        <span>Loading academics...</span>
      </div>
    );
  }

  if (error) {
    return <div className="sp-error-card">{error}</div>;
  }

  if (!data || data.semesters.length === 0) {
    return (
      <div className="sp-empty-state">
        <BookOpen size={48} />
        <h3>No Academic Records</h3>
        <p>No enrolled subjects found for your account.</p>
      </div>
    );
  }

  const activeSemester = data.semesters.find((s) => s.periodCode === activeTab);

  return (
    <div className="sp-page-content">
      {/* Module Header */}
      <div className="sp-module-hero">
        <div className="sp-module-hero-icon">
          <BookOpen size={28} />
        </div>
        <div>
          <h2 className="sp-module-hero-title">My Academics & Subjects</h2>
          <p className="sp-module-hero-subtitle">
            View your enrolled subjects across all semesters
          </p>
        </div>
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
            {sem.enrollmentStatus === "ACTIVE" && (
              <span className="sp-tab-dot" />
            )}
          </button>
        ))}
      </div>

      {/* Active Semester Content */}
      {activeSemester && <SemesterSection semester={activeSemester} />}
    </div>
  );
}
