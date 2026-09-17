export type AcademicPeriodCode =
  | "FIRST_YEAR_ANNUAL"
  | "SEMESTER_3"
  | "SEMESTER_4"
  | "SEMESTER_5"
  | "SEMESTER_6";

export interface Department {
  id: string;
  tenantId?: string | null;
  branchId?: string | null;
  academicYearId?: string | null;
  code: string;
  name: string;
  durationYears: number;
  defaultSchemeCode?: string | null;
  status: string;
  isTemplate?: boolean;
  metadata?: Record<string, unknown>;
}

export interface DepartmentPayload {
  branchId?: string | null;
  academicYearId: string;
  code: string;
  name: string;
  durationYears?: number;
  defaultSchemeCode?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  metadata?: Record<string, unknown>;
}

export interface AcademicYearPayload {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface AcademicPeriod {
  id: string;
  tenantId?: string | null;
  code: AcademicPeriodCode;
  name: string;
  periodType: string;
  sequenceNumber: number;
  displayOrder: number;
  durationType?: string;
  status: string;
  isTemplate?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AcademicSection {
  id: string;
  tenantId?: string;
  branchId: string;
  academicYearId: string;
  departmentId: string;
  departmentName?: string | null;
  academicPeriodId: string;
  academicPeriodName?: string | null;
  name: string;
  capacity?: number | null;
  status: string;
  metadata?: Record<string, unknown>;
}

export interface AcademicSectionPayload {
  branchId: string;
  academicYearId: string;
  departmentId: string;
  academicPeriodId: string;
  name: string;
  capacity?: number | null;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface Subject {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  subjectType?: string;
  status: string;
  metadata?: Record<string, unknown>;
}

export interface SubjectPayload {
  code: string;
  name: string;
  subjectType?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface SubjectOffering {
  id: string;
  tenantId: string;
  branchId: string;
  academicYearId: string;
  departmentId: string;
  departmentName?: string | null;
  academicPeriodId: string;
  sectionId: string;
  sectionName?: string | null;
  subjectId: string;
  subjectCode?: string | null;
  subjectName?: string | null;
  subjectCategory: string;
  weeklyHours?: number | null;
  internalMarks?: number | null;
  externalMarks?: number | null;
  totalMarks?: number | null;
  isMandatory: boolean;
  status: string;
  metadata?: Record<string, unknown>;
}

export interface SubjectOfferingPayload {
  sectionId: string;
  subjectId: string;
  subjectCategory?: string;
  weeklyHours?: number | null;
  internalMarks?: number | null;
  externalMarks?: number | null;
  totalMarks?: number | null;
  isMandatory?: boolean;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface DepartmentOptions {
  academicPeriods: Array<{ code: AcademicPeriodCode; label: string }>;
  subjectCategories: string[];
  entryTypes: string[];
  progressionStatuses: string[];
}
