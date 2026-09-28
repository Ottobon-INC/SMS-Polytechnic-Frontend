import { useState, useEffect } from "react";
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Printer,
} from "lucide-react";
import { studentPortalApi } from "../../api/studentPortalApi";
import type { AttendanceResponse, AttendanceRecordItem } from "../../types/studentPortal.types";

export function AttendancePage() {
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studentPortalApi
      .getAttendance()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-spinner" />
        <span>Loading attendance records...</span>
      </div>
    );
  }

  if (error) {
    return <div className="sp-error-card">{error}</div>;
  }

  if (!data || data.records.length === 0) {
    return (
      <div className="sp-empty-card">
        <CalendarCheck size={48} className="sp-empty-icon" />
        <h3>No Attendance Records Yet</h3>
        <p>Attendance is recorded by department faculty and approved by the Dean/Principal.</p>
      </div>
    );
  }

  const { summary, records } = data;
  const isGoodStanding = summary.attendancePercentage >= summary.minimumRequired;

  return (
    <div className="sp-page-wrapper">
      {/* Top Banner */}
      <div className="sp-page-top">
        <div>
          <h2 className="sp-page-title">Attendance & Register</h2>
          <p className="sp-page-subtitle">
            Official class & practical session attendance. Minimum 75% required for exam hall tickets.
          </p>
        </div>
        <button className="sp-btn-outline" onClick={() => window.print()}>
          <Printer size={16} />
          Print Register
        </button>
      </div>

      {/* Governance & Decision Banner */}
      <div className="sp-notice-banner">
        <ShieldCheck className="sp-notice-icon" />
        <div>
          <span className="sp-notice-title">Official Governance & Verification Notice: </span>
          Attendance is marked daily by departmental faculty and HOD, with final verification and condonation decision by the <strong>Institution Dean & Principal</strong>. Student portal access is strictly read-only.
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="sp-stats-row mb-6">
        <div className="sp-stat-card">
          <span className="sp-stat-label">Overall Attendance</span>
          <span className={`sp-stat-value ${isGoodStanding ? "sp-stat-teal" : "sp-stat-amber"}`}>
            {summary.attendancePercentage}%
          </span>
          <span className="text-[11px] text-slate-500 mt-1">Min {summary.minimumRequired}% required</span>
        </div>

        <div className="sp-stat-card">
          <span className="sp-stat-label">Total Sessions</span>
          <span className="sp-stat-value sp-stat-blue">{summary.totalSessions}</span>
          <span className="text-[11px] text-slate-500 mt-1">Recorded classes</span>
        </div>

        <div className="sp-stat-card">
          <span className="sp-stat-label">Present</span>
          <span className="sp-stat-value sp-stat-green">{summary.presentCount}</span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1">Attended</span>
        </div>

        <div className="sp-stat-card">
          <span className="sp-stat-label">Absent / Leave</span>
          <span className={`sp-stat-value ${summary.absentCount > 0 ? "text-rose-600" : "text-slate-600"}`}>
            {summary.absentCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-1">Sessions missed</span>
        </div>

        <div className="sp-stat-card">
          <span className="sp-stat-label">Exam Eligibility</span>
          <div className="mt-1 flex items-center gap-1.5">
            {isGoodStanding ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <CheckCircle size={14} /> Eligible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                <AlertTriangle size={14} /> Shortage
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Board condonation rules apply</span>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="sp-card mb-6">
        <div className="sp-card-header">
          <h3 className="sp-card-title">
            <Clock size={16} className="sp-card-title-icon" />
            Session Attendance History ({records.length})
          </h3>
          <span className="sp-card-subtitle">Sorted by most recent date</span>
        </div>

        <div className="sp-table-wrapper">
          <table className="sp-results-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Session Type</th>
                <th>Subject / Activity</th>
                <th>Marked By (Higher Official)</th>
                <th>Approval Status</th>
                <th>Your Attendance</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec: AttendanceRecordItem) => {
                const isPresent = rec.status === "PRESENT";
                const isAbsent = rec.status === "ABSENT";
                return (
                  <tr key={rec.recordId}>
                    <td className="font-mono text-xs">{rec.date}</td>
                    <td>
                      <span className="sp-badge sp-badge-slate">{rec.sessionType}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-slate-900">{rec.subjectName}</span>
                      {rec.subjectCode && (
                        <span className="block text-[11px] text-slate-400">{rec.subjectCode}</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-600">{rec.takenBy}</td>
                    <td>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.sessionStatus === "FINALIZED"
                            ? "bg-teal-100 text-teal-800 border border-teal-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {rec.sessionStatus === "FINALIZED" ? "Dean Finalized" : "Staff Submitted"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isPresent
                            ? "bg-emerald-100 text-emerald-800"
                            : isAbsent
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isPresent ? <CheckCircle size={12} /> : isAbsent ? <XCircle size={12} /> : null}
                        {rec.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500 italic">{rec.remarks || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
