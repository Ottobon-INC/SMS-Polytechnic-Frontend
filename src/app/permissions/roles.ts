export const roles = [
  "platform_admin",
  "institution_admin",
  "branch_admin",
  "office_staff",
  "parent_guardian"
] as const;

export type Role = (typeof roles)[number];
