import { useState, useEffect } from "react";
import { User, Shield, Lock, Eye, EyeOff, CheckCircle, Award } from "lucide-react";
import { studentPortalApi } from "../../api/studentPortalApi";
import type { StudentProfile } from "../../types/studentPortal.types";

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="sp-info-field">
      <span className="sp-info-label">{label}</span>
      <span className="sp-info-value">{value || "—"}</span>
    </div>
  );
}

function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isLongEnough = newPassword.length >= 6;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = currentPassword.length > 0 && isLongEnough && passwordsMatch && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await studentPortalApi.changePassword(currentPassword, newPassword);
      setMessage({ type: "success", text: res.message || "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update password." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sp-password-card">
      <div className="sp-password-header">
        <div className="sp-password-icon">
          <Shield size={24} />
        </div>
        <div>
          <h3>Change Portal Password</h3>
          <p className="sp-muted">Update your student portal login password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="sp-password-form">
        {message && (
          <div className={`sp-form-message ${message.type === "success" ? "sp-form-success" : "sp-form-error"}`}>
            {message.text}
          </div>
        )}

        <label className="sp-form-field">
          <span>Current Password</span>
          <div className="sp-input-wrap">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <button type="button" className="sp-eye-btn" onClick={() => setShowCurrent(!showCurrent)}>
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <label className="sp-form-field">
          <span>New Password</span>
          <div className="sp-input-wrap">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
            />
            <button type="button" className="sp-eye-btn" onClick={() => setShowNew(!showNew)}>
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <label className="sp-form-field">
          <span>Confirm New Password</span>
          <div className="sp-input-wrap">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
            />
          </div>
        </label>

        <div className="sp-security-checks">
          <span className="sp-security-label">Security Check:</span>
          <div className={`sp-check-item ${isLongEnough ? "sp-check-pass" : ""}`}>
            <CheckCircle size={14} />
            At least 6 characters in length
          </div>
          <div className={`sp-check-item ${passwordsMatch ? "sp-check-pass" : ""}`}>
            <CheckCircle size={14} />
            Passwords match
          </div>
        </div>

        <button type="submit" className="sp-submit-btn" disabled={!canSubmit}>
          <Lock size={16} />
          {submitting ? "Updating..." : "Update My Password"}
        </button>
      </form>
    </div>
  );
}

export function ProfileSecurityPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studentPortalApi
      .getProfile()
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-spinner" />
        <span>Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return <div className="sp-error-card">{error}</div>;
  }

  if (!profile) {
    return (
      <div className="sp-empty-state">
        <User size={48} />
        <h3>Profile Not Found</h3>
        <p>Unable to load your student profile.</p>
      </div>
    );
  }

  const s = profile.student;
  const e = profile.enrollment;
  const inst = profile.institution;

  return (
    <div className="sp-page-content">
      {/* Profile Hero */}
      <div className="sp-profile-hero">
        <div className="sp-avatar-lg">
          {s.fullName
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div className="sp-profile-hero-info">
          <h2 className="sp-profile-name">{s.fullName}</h2>
          <div className="sp-profile-badges">
            {s.studentCode && <span className="sp-badge sp-badge-blue">{s.studentCode}</span>}
            <span className={`sp-badge ${s.status === "ACTIVE" ? "sp-badge-green" : "sp-badge-slate"}`}>
              {s.status}
            </span>
            {e.entryType && <span className="sp-badge sp-badge-slate">{e.entryType}</span>}
          </div>
          <p className="sp-profile-subtitle">
            {e.departmentName && `${e.departmentName} • `}
            {e.academicPeriodName && `${e.academicPeriodName}`}
          </p>
        </div>
      </div>

      <div className="sp-profile-grid">
        {/* Personal Information */}
        <div className="sp-info-card-section">
          <h3 className="sp-section-heading">
            <User size={18} />
            Personal & Contact Information
          </h3>
          <div className="sp-info-grid">
            <InfoField label="Full Legal Name" value={s.fullName} />
            <InfoField label="Student Roll / USN" value={s.studentCode} />
            <InfoField label="Registered Email (Login ID)" value={s.email} />
            <InfoField label="Mobile Phone" value={s.phone} />
            <InfoField label="Date of Birth" value={s.dateOfBirth} />
            <InfoField label="Gender" value={s.gender} />
          </div>
        </div>

        {/* Password Change */}
        <PasswordChangeForm />

        {/* Academic Enrolment */}
        <div className="sp-info-card-section sp-full-width">
          <h3 className="sp-section-heading">
            <Award size={18} />
            Academic Enrolment & Institution
          </h3>
          <div className="sp-info-grid">
            <InfoField label="Institution / College" value={inst.tenantName} />
            <InfoField label="Campus Location" value={e.branchName} />
            <InfoField label="Programme" value={e.departmentName} />
            <InfoField label="Current Semester" value={e.academicPeriodName} />
            <InfoField label="Section" value={e.sectionName} />
            <InfoField label="Academic Year" value={e.academicYearName} />
            <InfoField label="Roll Number" value={e.rollNumber} />
            <InfoField label="Admission Date" value={e.admissionDate} />
            <InfoField label="Scheme Code" value={e.schemeCode} />
            <InfoField label="Entry Type" value={e.entryType} />
          </div>
        </div>
      </div>
    </div>
  );
}
