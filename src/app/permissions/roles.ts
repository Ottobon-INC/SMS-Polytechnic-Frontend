export const roles = [
  "platform_admin",
  "institution_admin",
  "branch_admin",
  "hod",
  "office_staff",
  "parent_guardian",
  "student"
] as const;

export type Role = (typeof roles)[number];
