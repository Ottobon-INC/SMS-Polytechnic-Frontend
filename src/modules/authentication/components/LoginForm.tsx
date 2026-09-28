import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogIn,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { PortalKey } from "../types/authContext.types";

const HOD_BRANCHES = [
  { code: "CSE", name: "Computer Engineering", email: "hod.cse@polytechnic.edu.in", hodName: "Dr. K. Sharma" },
  { code: "MECH", name: "Mechanical Engineering", email: "hod.mech@polytechnic.edu.in", hodName: "Prof. T. Kumar" },
  { code: "CIVIL", name: "Civil Engineering", email: "hod.civil@polytechnic.edu.in", hodName: "Prof. S. Rao" },
  { code: "EEE", name: "Electrical & Electronics", email: "hod.eee@polytechnic.edu.in", hodName: "Mrs. P. Lakshmi" },
  { code: "ECE", name: "Electronics & Communication", email: "hod.ece@polytechnic.edu.in", hodName: "Dr. M. Reddy" },
];

export function LoginForm({
  portal,
  onSubmit,
  error,
}: {
  portal: PortalKey;
  onSubmit: (loginIdentifier: string, password: string) => Promise<void>;
  error: string | null;
}) {
  const [email, setEmail] = useState(portal === "hod" ? "hod.cse@polytechnic.edu.in" : "");
  const [password, setPassword] = useState(portal === "hod" ? "Hod@123" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(email, password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="auth-form-header">
        <span className="auth-form-badge">Verified access</span>
        <h2>Welcome back</h2>
        <p>
          {portal === "hod"
            ? "Sign in as Department Head to manage your branch curriculum, sections and marks."
            : "Use your application credentials to continue into the selected portal."}
        </p>
      </div>

      {portal === "hod" && (
        <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
              Select Department Branch:
            </span>
            <span className="text-[11px] font-medium text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full">
              1 HOD per Department (All Years)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {HOD_BRANCHES.map((dept) => {
              const isSelected = email === dept.email;
              return (
                <button
                  key={dept.code}
                  type="button"
                  onClick={() => {
                    setEmail(dept.email);
                    setPassword("Hod@123");
                  }}
                  className={`flex flex-col items-start p-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? "bg-teal-600 text-white shadow-sm ring-2 ring-teal-600/30"
                      : "bg-white/90 text-slate-700 hover:bg-white hover:border-teal-300 border border-teal-100"
                  }`}
                >
                  <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {dept.code}
                  </span>
                  <span className={`text-[10px] leading-tight truncate w-full ${isSelected ? "text-teal-100" : "text-slate-500"}`}>
                    {dept.name}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-teal-800/80">
            Selected HOD manages curriculum, timetable, subjects and marks for <strong>First Year, Sem 3, 4, 5 & 6</strong>.
          </p>
        </div>
      )}

      <label className="auth-field">
        <span>{portal === "student" ? "Admission Number or PIN" : "Username or email"}</span>
        <span className="auth-input-wrap">
          <Mail size={18} />
          <input
            autoComplete="username"
            disabled={submitting}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={portal === "student" ? "Enter your admission number" : "name@college.edu"}
            required
            type="text"
            value={email}
          />
        </span>
      </label>

      <label className="auth-field">
        <span>Password</span>
        <span className="password-row">
          <span className="auth-input-wrap">
            <KeyRound size={18} />
            <input
              autoComplete="current-password"
              disabled={submitting}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
          </span>
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="auth-icon-button"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      {error != null && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <button
        className="auth-submit-button"
        disabled={submitting}
        type="submit"
      >
        {submitting ? (
          <>
            <Loader2 className="auth-spin" size={18} />
            Signing in...
          </>
        ) : (
          <>
            Sign in
            <LogIn size={18} />
          </>
        )}
      </button>

      <div className="auth-secondary-actions">
        <Link to="/">
          <ArrowLeft size={16} />
          Portal selection
        </Link>
      </div>

      <div className="auth-recovery-note">
        Password recovery will be configured during credential lifecycle
        implementation.
      </div>

      <input type="hidden" name="portal" value={portal} />
    </form>
  );
}
