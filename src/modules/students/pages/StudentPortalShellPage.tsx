import { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  CalendarCheck,
  Award,
  User,
  LogOut,
  GraduationCap,
  Banknote,
  Menu,
  Bell,
} from "lucide-react";
import { useAuth } from "../../authentication/providers/AuthProvider";
import { studentPortalApi } from "../api/studentPortalApi";
import { AcademicsPage } from "../components/portal/AcademicsPage";
import { TimetablePage } from "../components/portal/TimetablePage";
import { AttendancePage } from "../components/portal/AttendancePage";
import { ExamsResultsPage } from "../components/portal/ExamsResultsPage";
import { ProfileSecurityPage } from "../components/portal/ProfileSecurityPage";
import { FeesPage } from "../components/portal/FeesPage";
import { NotificationsPage } from "../components/portal/NotificationsPage";
import type { StudentProfile, StudentPortalTab } from "../types/studentPortal.types";
import "./studentPortal.css";

const NAV_ITEMS: { key: StudentPortalTab; label: string; icon: typeof BookOpen }[] = [
  { key: "academics", label: "My Academics & Subjects", icon: BookOpen },
  { key: "timetable", label: "Class Timetable", icon: Calendar },
  { key: "attendance", label: "Attendance & Register", icon: CalendarCheck },
  { key: "results", label: "Exams & Results", icon: Award },
  { key: "fees", label: "Fees & Payments", icon: Banknote },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "profile", label: "My Profile & Security", icon: User },
];

function StudentAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return <div className="sp-sidebar-avatar">{initials}</div>;
}

export function StudentPortalShellPage() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<StudentPortalTab>("academics");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    studentPortalApi.getProfile().then(setProfile).catch(() => {});
  }, []);

  const handleTabChange = (key: StudentPortalTab) => {
    setActiveTab(key);
    setIsMobileMenuOpen(false);
  };

  const studentName = profile?.student.fullName || "Student";
  const studentCode = profile?.student.studentCode || "";
  const departmentName = profile?.enrollment.departmentName || "";
  const periodName = profile?.enrollment.academicPeriodName || "";

  return (
    <div className="sp-shell">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="sp-mobile-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Dark Sidebar ── */}
      <aside className={`sp-sidebar ${isMobileMenuOpen ? "sp-sidebar-open" : ""}`}>
        <div className="sp-sidebar-brand">
          <div className="sp-sidebar-brand-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="sp-sidebar-brand-title">Student Management System</div>
            <div className="sp-sidebar-brand-subtitle">Student Portal</div>
          </div>
        </div>

        <div className="sp-sidebar-user">
          <StudentAvatar name={studentName} />
          <div>
            <div className="sp-sidebar-user-name">{studentName}</div>
            <div className="sp-sidebar-user-meta">{departmentName || "Loading..."}</div>
          </div>
        </div>

        <div className="sp-sidebar-label">MENU</div>
        <nav className="sp-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`sp-sidebar-link ${activeTab === item.key ? "sp-sidebar-link-active" : ""}`}
                onClick={() => handleTabChange(item.key)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button className="sp-sidebar-signout" onClick={logout}>
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main className="sp-main">
        {/* Top Header Bar */}
        <header className="sp-header">
          <div className="sp-header-left">
            <button 
              className="sp-mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <StudentAvatar name={studentName} />
            <div>
              <div className="sp-header-name">
                {studentName}
                {studentCode && <span className="sp-header-code">{studentCode}</span>}
              </div>
              <div className="sp-header-meta">
                {departmentName}
                {periodName && ` • ${periodName}`}
              </div>
            </div>
          </div>
          <nav className="sp-header-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  className={`sp-header-tab ${activeTab === item.key ? "sp-header-tab-active" : ""}`}
                  onClick={() => setActiveTab(item.key)}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Page Content */}
        <div className="sp-content">
          {activeTab === "academics" && <AcademicsPage />}
          {activeTab === "timetable" && <TimetablePage />}
          {activeTab === "attendance" && <AttendancePage />}
          {activeTab === "results" && <ExamsResultsPage />}
          {activeTab === "fees" && <FeesPage />}
          {activeTab === "notifications" && <NotificationsPage />}
          {activeTab === "profile" && <ProfileSecurityPage />}
        </div>
      </main>
    </div>
  );
}
