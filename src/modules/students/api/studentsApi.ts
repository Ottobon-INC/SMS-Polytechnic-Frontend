import { apiGet, apiPatch, apiPost } from "../../../api/client/apiClient";

export interface StudentListItem {
  id: string;
  tenantId: string;
  studentCode?: string | null;
  admissionNumber: string | null;
  name: string;
  fullName?: string | null;
  rollNumber?: string | null;
  gender: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
  enrollmentId?: string | null;
  enrollmentMetadata?: Record<string, unknown> | null;
  branchId?: string | null;
  branchCode?: string | null;
  branchName?: string | null;
  academicYearId?: string | null;
  academicYearName?: string | null;
  departmentId?: string | null;
  departmentCode?: string | null;
  departmentName?: string | null;
  admissionYear?: number | null;
  academicPeriodId?: string | null;
  academicPeriodCode?: string | null;
  academicPeriodName?: string | null;
  sectionId?: string | null;
  sectionCode?: string | null;
  sectionName?: string | null;
  entryType?: string | null;
  progressionStatus?: string | null;
  schemeCode?: string | null;
  diplomaRegistrationNumber?: string | null;
  admissionDate?: string | null;
  enrollmentStatus?: string | null;
  guardianId?: string | null;
  guardianName?: string | null;
  guardianRelationship?: string | null;
  guardianPhone?: string | null;
  guardianEmail?: string | null;
  guardianAddress?: string | null;
  guardianMetadata?: Record<string, unknown> | null;
  receivesNotifications?: boolean | null;
}

export interface StudentInlineUpdatePayload {
  student_name?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  admission_date?: string | null;
  guardian_name?: string | null;
  guardian_relationship?: string | null;
  guardian_phone?: string | null;
}

export const studentsApi = {
  list: (branchId?: string) => apiGet<StudentListItem[]>(`/students${branchId ? `?branch_id=${branchId}` : ''}`),
  create: (payload: unknown) => apiPost<StudentListItem>("/students", payload),
  updateInline: (studentId: string, payload: StudentInlineUpdatePayload) =>
    apiPatch<{ status: string; message: string }>(`/students/${studentId}`, payload)
} as const;
