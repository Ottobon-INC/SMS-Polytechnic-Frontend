import { useState, useEffect } from "react";
import { Calendar, Printer } from "lucide-react";
import { studentPortalApi } from "../../api/studentPortalApi";
import type { TimetableResponse, TimetableSubject } from "../../types/studentPortal.types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [
  { label: "Period 1", time: "09:00 – 10:00 AM" },
  { label: "Period 2", time: "10:00 – 11:00 AM" },
  { label: "Break", time: "11:00 – 11:15", isBreak: true },
  { label: "Period 3", time: "11:15 – 12:15 PM" },
  { label: "Period 4", time: "12:15 – 01:15 PM" },
  { label: "Lunch", time: "01:15 – 02:00", isBreak: true },
  { label: "Period 5", time: "02:00 – 03:00 PM" },
  { label: "Period 6", time: "03:00 – 04:00 PM" },
];

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    THEORY: { label: "LECTURE", cls: "sp-tt-badge-blue" },
    PRACTICAL: { label: "PRACTICAL", cls: "sp-tt-badge-amber" },
    LAB: { label: "LAB", cls: "sp-tt-badge-teal" },
    PROJECT: { label: "PROJECT", cls: "sp-tt-badge-violet" },
    INDUSTRIAL_TRAINING: { label: "TRAINING", cls: "sp-tt-badge-rose" },
  };
  const info = map[type] || { label: type, cls: "sp-tt-badge-slate" };
  return <span className={`sp-tt-type-badge ${info.cls}`}>{info.label}</span>;
}

function SubjectListView({ subjects }: { subjects: TimetableSubject[] }) {
  return (
    <div className="sp-tt-subject-list">
      <h3 className="sp-section-heading">Enrolled Subjects</h3>
      <div className="sp-tt-subjects-grid">
        {subjects.map((sub) => (
          <div key={sub.subjectCode} className="sp-tt-subject-card">
            <div className="sp-tt-subject-card-top">
              <span className="sp-subject-code">{sub.subjectCode}</span>
              <TypeBadge type={sub.subjectCategory || sub.subjectType} />
            </div>
            <h4 className="sp-subject-name">{sub.subjectName}</h4>
            <div className="sp-subject-meta">
              {sub.credits != null && <span>{sub.credits} Credits</span>}
              {sub.weeklyHours != null && <span>{sub.weeklyHours} Hrs/Week</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimetablePage() {
  const [data, setData] = useState<TimetableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studentPortalApi
      .getTimetable()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-spinner" />
        <span>Loading timetable...</span>
      </div>
    );
  }

  if (error) {
    return <div className="sp-error-card">{error}</div>;
  }

  if (!data || !data.enrollment) {
    return (
      <div className="sp-empty-state">
        <Calendar size={48} />
        <h3>No Active Enrollment</h3>
        <p>Timetable is not available because you have no active enrollment.</p>
      </div>
    );
  }

  const timetable = data.timetableData as Record<string, Record<string, { subjectCode: string; type: string; faculty?: string; venue?: string }>> | null;

  return (
    <div className="sp-page-content">
      {/* Module Header */}
      <div className="sp-module-hero sp-hero-teal">
        <div className="sp-module-hero-icon">
          <Calendar size={28} />
        </div>
        <div className="sp-module-hero-text">
          <h2 className="sp-module-hero-title">
            Class Timetable — {data.enrollment.periodName}
          </h2>
          <p className="sp-module-hero-subtitle">
            {data.enrollment.branchName} • {data.enrollment.departmentName} • {data.enrollment.sectionName}
          </p>
        </div>
        <button className="sp-print-btn" onClick={() => window.print()}>
          <Printer size={16} />
          Print Timetable
        </button>
      </div>

      {/* Timetable Grid */}
      {timetable ? (
        <div className="sp-timetable-wrapper">
          <table className="sp-timetable-table">
            <thead>
              <tr>
                <th className="sp-tt-corner">DAY / TIME</th>
                {PERIODS.map((p) => (
                  <th
                    key={p.label}
                    className={p.isBreak ? "sp-tt-break-header" : "sp-tt-period-header"}
                  >
                    <span className="sp-tt-period-label">{p.label}</span>
                    <span className="sp-tt-period-time">{p.time}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <td className="sp-tt-day">{day}</td>
                  {PERIODS.map((p) => {
                    if (p.isBreak) {
                      return <td key={p.label} className="sp-tt-break-cell" />;
                    }
                    const slot = timetable?.[day]?.[p.label];
                    if (!slot) {
                      return <td key={p.label} className="sp-tt-empty-cell" />;
                    }
                    return (
                      <td key={p.label} className="sp-tt-slot-cell">
                        <div className="sp-tt-slot">
                          <span className="sp-tt-slot-code">{slot.subjectCode}</span>
                          <TypeBadge type={slot.type || "THEORY"} />
                          {slot.faculty && (
                            <span className="sp-tt-slot-faculty">{slot.faculty}</span>
                          )}
                          {slot.venue && (
                            <span className="sp-tt-slot-venue">{slot.venue}</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="sp-info-card">
          <Calendar size={20} />
          <p>
            The detailed timetable grid has not been configured yet. Below are your enrolled
            subjects for the current semester.
          </p>
        </div>
      )}

      {/* Subject List Fallback */}
      <SubjectListView subjects={data.subjects} />
    </div>
  );
}
