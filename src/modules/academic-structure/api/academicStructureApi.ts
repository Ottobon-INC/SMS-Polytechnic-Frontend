import { apiDelete, apiGet, apiPatch, apiPost } from "../../../api/client/apiClient";
import type {
  AcademicYear,
  AcademicYearPayload,
  AcademicPeriod,
  AcademicSection,
  AcademicSectionPayload,
  Department,
  DepartmentOptions,
  DepartmentPayload,
  Subject,
  SubjectPayload,
  SubjectOffering,
  SubjectOfferingPayload,
} from "../types";

export const academicStructureApi = {
  getBranches(): Promise<{ id: string; name: string; code?: string }[]> {
    return apiGet<{ id: string; name: string; code?: string }[]>("/branches");
  },

  getSubjects(): Promise<Subject[]> {
    return apiGet<Subject[]>("/academic-structure/subjects");
  },

  createSubject(payload: SubjectPayload): Promise<Subject> {
    return apiPost<Subject>("/academic-structure/subjects", payload);
  },

  updateSubject(id: string, payload: Partial<SubjectPayload>): Promise<Subject> {
    return apiPatch<Subject>(`/academic-structure/subjects/${id}`, payload);
  },

  getDepartments(params: { branchId?: string; academicYearId?: string } = {}): Promise<Department[]> {
    const query = new URLSearchParams();
    if (params.branchId) query.append("branch_id", params.branchId);
    if (params.academicYearId) query.append("academic_year_id", params.academicYearId);
    const qs = query.toString();
    return apiGet<Department[]>(`/academic-structure/departments${qs ? `?${qs}` : ""}`);
  },

  createDepartment(payload: DepartmentPayload): Promise<Department> {
    return apiPost<Department>("/academic-structure/departments", payload);
  },

  updateDepartment(id: string, payload: Partial<DepartmentPayload>): Promise<Department> {
    return apiPatch<Department>(`/academic-structure/departments/${id}`, payload);
  },

  getDepartmentOptions(): Promise<DepartmentOptions> {
    return apiGet<DepartmentOptions>("/academic-structure/department-options");
  },

  getAcademicYears(): Promise<AcademicYear[]> {
    return apiGet<AcademicYear[]>("/academic-structure/academic-years");
  },

  createAcademicYear(payload: AcademicYearPayload): Promise<AcademicYear> {
    return apiPost<AcademicYear>("/academic-structure/academic-years", payload);
  },

  setDefaultAcademicYear(id: string): Promise<{ status: string; message?: string }> {
    return apiPatch<{ status: string; message?: string }>(`/academic-structure/academic-years/${id}/default`, {});
  },

  getAcademicPeriods(): Promise<AcademicPeriod[]> {
    return apiGet<AcademicPeriod[]>("/academic-structure/academic-periods");
  },

  getSections(params: {
    branchId?: string;
    academicYearId?: string;
    departmentId?: string;
    academicPeriodId?: string;
  } = {}): Promise<AcademicSection[]> {
    const query = new URLSearchParams();
    if (params.branchId) query.append("branch_id", params.branchId);
    if (params.academicYearId) query.append("academic_year_id", params.academicYearId);
    if (params.departmentId) query.append("department_id", params.departmentId);
    if (params.academicPeriodId) query.append("academic_period_id", params.academicPeriodId);
    const qs = query.toString();
    return apiGet<AcademicSection[]>(`/academic-structure/sections${qs ? `?${qs}` : ""}`);
  },

  createSection(payload: AcademicSectionPayload): Promise<AcademicSection> {
    return apiPost<AcademicSection>("/academic-structure/sections", payload);
  },

  updateSection(id: string, payload: Partial<AcademicSectionPayload>): Promise<AcademicSection> {
    return apiPatch<AcademicSection>(`/academic-structure/sections/${id}`, payload);
  },

  deleteSection(id: string): Promise<{ status: string }> {
    return apiDelete<{ status: string }>(`/academic-structure/sections/${id}`);
  },

  getSubjectOfferings(params: {
    branchId?: string;
    academicYearId?: string;
    departmentId?: string;
    academicPeriodId?: string;
    sectionId?: string;
  } = {}): Promise<SubjectOffering[]> {
    const query = new URLSearchParams();
    if (params.branchId) query.append("branch_id", params.branchId);
    if (params.academicYearId) query.append("academic_year_id", params.academicYearId);
    if (params.departmentId) query.append("department_id", params.departmentId);
    if (params.academicPeriodId) query.append("academic_period_id", params.academicPeriodId);
    if (params.sectionId) query.append("section_id", params.sectionId);
    const qs = query.toString();
    return apiGet<SubjectOffering[]>(`/academic-structure/subject-offerings${qs ? `?${qs}` : ""}`);
  },

  createSubjectOffering(payload: SubjectOfferingPayload): Promise<SubjectOffering> {
    return apiPost<SubjectOffering>("/academic-structure/subject-offerings", payload);
  },

  deleteSubjectOffering(id: string): Promise<{ status: string }> {
    return apiDelete<{ status: string }>(`/academic-structure/subject-offerings/${id}`);
  },
} as const;
