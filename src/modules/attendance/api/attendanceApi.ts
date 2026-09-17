import { apiGet, apiPost, apiPut } from "../../../api/client/apiClient";
import type {
  AttendanceSessionCreate,
  AttendanceSessionResponse,
  AttendanceDraftSavePayload,
  AttendanceSessionListItem,
  LookupItem,
  DepartmentLookup,
  SectionAttendanceStatus,
  AcademicPeriodLookup,
  SectionLookup,
  SubjectOfferingLookup,
} from "../types/attendance.types";

export const attendanceApi = {
  // --- Attendance Operations ---
  getSessions: (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return apiGet<AttendanceSessionListItem[]>(`/attendance/sessions${query}`);
  },

  createSession: (payload: AttendanceSessionCreate) =>
    apiPost<AttendanceSessionResponse>("/attendance/sessions", payload),

  getSession: (sessionId: string) =>
    apiGet<AttendanceSessionResponse>(`/attendance/sessions/${sessionId}`),

  saveDraft: (sessionId: string, payload: AttendanceDraftSavePayload) =>
    apiPut<AttendanceSessionResponse>(`/attendance/sessions/${sessionId}/records`, payload),

  submitSession: (sessionId: string) =>
    apiPost<AttendanceSessionResponse>(`/attendance/sessions/${sessionId}/submit`, {}),

  finalizeSession: (sessionId: string) =>
    apiPost<AttendanceSessionResponse>(`/attendance/sessions/${sessionId}/finalize`, {}),

  returnSession: (sessionId: string, payload: { reason?: string }) =>
    apiPost<AttendanceSessionResponse>(`/attendance/sessions/${sessionId}/return`, payload),

  getSectionsStatus: (date: string, academicYearId?: string, departmentId?: string, academicPeriodId?: string) => {
    const params = new URLSearchParams({ date });
    if (academicYearId) params.append("academicYearId", academicYearId);
    if (departmentId) params.append("departmentId", departmentId);
    if (academicPeriodId) params.append("academicPeriodId", academicPeriodId);
    return apiGet<SectionAttendanceStatus[]>(`/attendance/sections-status?${params.toString()}`);
  },

  // --- Academic Lookups (proxying existing backend endpoints) ---
  getBranches: () =>
    apiGet<LookupItem[]>("/imports/students/lookups/branches"),

  getAcademicYears: () =>
    apiGet<LookupItem[]>("/imports/students/lookups/academic-years"),

  getDepartments: (academicYearId?: string) => {
    const params = new URLSearchParams();
    if (academicYearId) params.append("academic_year_id", academicYearId);
    const qs = params.toString();
    return apiGet<DepartmentLookup[]>(`/academic-structure/departments${qs ? `?${qs}` : ""}`);
  },

  getAcademicPeriods: () =>
    apiGet<AcademicPeriodLookup[]>("/imports/students/lookups/academic-periods"),

  getSections: (paramsInput: { branchId?: string; academicYearId?: string; departmentId?: string; academicPeriodId?: string }) => {
    const params = new URLSearchParams();
    if (paramsInput.branchId) params.append("branch_id", paramsInput.branchId);
    if (paramsInput.academicYearId) params.append("academic_year_id", paramsInput.academicYearId);
    if (paramsInput.departmentId) params.append("department_id", paramsInput.departmentId);
    const academicPeriodId = paramsInput.academicPeriodId;
    if (academicPeriodId) params.append("academic_period_id", academicPeriodId);
    return apiGet<SectionLookup[]>(`/imports/students/lookups/sections?${params.toString()}`);
  },

  getSubjectOfferings: (params: { sectionId?: string; academicYearId?: string; departmentId?: string; academicPeriodId?: string }) => {
    const query = new URLSearchParams();
    if (params.sectionId) query.append("section_id", params.sectionId);
    if (params.academicYearId) query.append("academic_year_id", params.academicYearId);
    if (params.departmentId) query.append("department_id", params.departmentId);
    if (params.academicPeriodId) query.append("academic_period_id", params.academicPeriodId);
    const qs = query.toString();
    return apiGet<SubjectOfferingLookup[]>(`/academic-structure/subject-offerings${qs ? `?${qs}` : ""}`);
  },
};
