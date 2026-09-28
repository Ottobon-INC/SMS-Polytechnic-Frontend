import type { PortalKey } from "../types/authContext.types";

export const portalDefinitions: Record<
  PortalKey,
  {
    label: string;
    description: string;
    expectedRoles: string[];
    dashboardPath: string;
  }
> = {
  institution: {
    label: "Institution Admin / Dean",
    description: "Institution setup, users, branches, academic structures and consolidated oversight.",
    expectedRoles: ["INSTITUTION_ADMIN"],
    dashboardPath: "/institution"
  },
  branch: {
    label: "Principal / Campus Admin",
    description: "Branch approvals, attendance finalization, fee corrections and result approval.",
    expectedRoles: ["BRANCH_ADMIN"],
    dashboardPath: "/branch-dashboard"
  },
  office: {
    label: "Office Staff",
    description: "Daily student, import, fee, attendance and marks operations.",
    expectedRoles: ["OFFICE_STAFF"],
    dashboardPath: "/dashboard"
  },
  parent: {
    label: "Parent / Guardian",
    description: "Linked-child attendance, fees, results, reports and notification preferences.",
    expectedRoles: ["PARENT_GUARDIAN"],
    dashboardPath: "/parent-portal"
  },
  platform: {
    label: "Platform Admin",
    description: "Ottobon platform operations, tenants, subscriptions and system health.",
    expectedRoles: ["PLATFORM_ADMIN"],
    dashboardPath: "/platform-admin"
  },
  student: {
    label: "Student",
    description: "View attendance, fees, marks and personal details.",
    expectedRoles: ["STUDENT"],
    dashboardPath: "/student-portal"
  },
  hod: {
    label: "Head of Department (HOD)",
    description: "Department-level curriculum structure, subjects, timetable, marks entry and academic oversight.",
    expectedRoles: ["HOD", "BRANCH_ADMIN"],
    dashboardPath: "/dashboard"
  }
};

export function getPortalForRole(roleCode: string): PortalKey {
  if (roleCode === "PLATFORM_ADMIN") return "platform";
  if (roleCode === "INSTITUTION_ADMIN") return "institution";
  if (roleCode === "BRANCH_ADMIN") return "branch";
  if (roleCode === "HOD") return "hod";
  if (roleCode === "PARENT_GUARDIAN") return "parent";
  if (roleCode === "STUDENT") return "student";
  return "office";
}
