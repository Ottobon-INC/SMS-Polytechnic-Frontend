import { apiGet, apiPost } from "../../../api/client/apiClient";
import type {
  AcademicPeriodLookup,
  Exam,
  ExamCreatePayload,
  ExamSubject,
  LookupItem,
  StudentExamRecord,
  StudentExamRecordSave,
  SubjectOfferingLookup,
} from "../types";

const API_BASE_URL = "/examinations";

type ApiExamSubject = {
  id: string;
  exam_id: string;
  section_subject_id?: string | null;
  section_id?: string | null;
  section_name?: string | null;
  subject_id: string;
  subject_code?: string | null;
  subject_name?: string | null;
  max_marks: number;
  pass_marks?: number | null;
  exam_date?: string | null;
  created_at: string;
  updated_at?: string | null;
};

type ApiExam = {
  id: string;
  tenant_id: string;
  branch_id: string;
  department_id: string;
  academic_year_id: string;
  academic_period_id?: string | null;
  name: string;
  exam_type: Exam["examType"];
  status: Exam["status"];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  exam_subjects?: ApiExamSubject[];
  marks_summary?: Record<string, number> | null;
};

type ApiStudentExamRecord = {
  id: string;
  exam_subject_id: string;
  exam_id: string;
  section_subject_id?: string | null;
  subject_id: string;
  subject_code?: string | null;
  subject_name?: string | null;
  student_id: string;
  enrollment_id: string;
  student_name?: string | null;
  admission_number?: string | null;
  roll_number?: string | null;
  section_id?: string | null;
  section_name?: string | null;
  marks_obtained?: number | null;
  attendance_status: StudentExamRecord["attendanceStatus"];
  result_status?: StudentExamRecord["resultStatus"];
  remarks?: string | null;
  created_at: string;
  updated_at: string;
};

function mapExamSubject(subject: ApiExamSubject): ExamSubject {
  return {
    id: subject.id,
    examId: subject.exam_id,
    sectionSubjectId: subject.section_subject_id,
    sectionId: subject.section_id,
    sectionName: subject.section_name,
    subjectId: subject.subject_id,
    subjectCode: subject.subject_code,
    subjectName: subject.subject_name,
    maxMarks: Number(subject.max_marks),
    passMarks: subject.pass_marks == null ? null : Number(subject.pass_marks),
    examDate: subject.exam_date,
    createdAt: subject.created_at,
    updatedAt: subject.updated_at,
  };
}

function mapExam(exam: ApiExam): Exam {
  return {
    id: exam.id,
    tenantId: exam.tenant_id,
    branchId: exam.branch_id,
    departmentId: exam.department_id,
    academicYearId: exam.academic_year_id,
    academicPeriodId: exam.academic_period_id,
    name: exam.name,
    examType: exam.exam_type,
    status: exam.status,
    metadata: exam.metadata ?? {},
    createdAt: exam.created_at,
    updatedAt: exam.updated_at,
    examSubjects: exam.exam_subjects?.map(mapExamSubject) ?? [],
    marksSummary: exam.marks_summary,
  };
}

function mapRecord(record: ApiStudentExamRecord): StudentExamRecord {
  return {
    id: record.id,
    examSubjectId: record.exam_subject_id,
    examId: record.exam_id,
    sectionSubjectId: record.section_subject_id,
    subjectId: record.subject_id,
    subjectCode: record.subject_code,
    subjectName: record.subject_name,
    studentId: record.student_id,
    enrollmentId: record.enrollment_id,
    studentName: record.student_name,
    admissionNumber: record.admission_number,
    rollNumber: record.roll_number,
    sectionId: record.section_id,
    sectionName: record.section_name,
    marksObtained: record.marks_obtained,
    attendanceStatus: record.attendance_status,
    resultStatus: record.result_status,
    remarks: record.remarks,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export const examinationsApi = {
  async getExams(branchId?: string, status?: string): Promise<Exam[]> {
    const params = new URLSearchParams();
    if (branchId && branchId !== "ALL") params.append("branch_id", branchId);
    if (status) params.append("status", status);
    const qs = params.toString();
    const data = await apiGet<ApiExam[]>(`${API_BASE_URL}${qs ? `?${qs}` : ""}`);
    return data.map(mapExam);
  },

  async createExam(payload: ExamCreatePayload): Promise<Exam> {
    const data = await apiPost<ApiExam>(API_BASE_URL, {
      name: payload.name,
      exam_type: payload.examType,
      branch_id: payload.branchId,
      department_id: payload.departmentId,
      academic_year_id: payload.academicYearId,
      academic_period_id: payload.academicPeriodId || null,
      exam_subjects: payload.examSubjects.map((subject) => ({
        subject_id: subject.subjectId,
        section_subject_id: subject.sectionSubjectId || null,
        max_marks: subject.maxMarks,
        pass_marks: subject.passMarks ?? null,
        exam_date: subject.examDate || null,
      })),
    });
    return mapExam(data);
  },

  async publishExam(examId: string): Promise<Exam> {
    const data = await apiPost<ApiExam>(`${API_BASE_URL}/${examId}/publish`, {});
    return mapExam(data);
  },

  async submitExam(examId: string): Promise<Exam> {
    const data = await apiPost<ApiExam>(`${API_BASE_URL}/${examId}/submit`, {});
    return mapExam(data);
  },

  async returnExam(examId: string, reason: string): Promise<Exam> {
    const data = await apiPost<ApiExam>(`${API_BASE_URL}/${examId}/return`, { reason });
    return mapExam(data);
  },

  async getStudentExamRecords(examId: string, sectionId?: string): Promise<StudentExamRecord[]> {
    const params = new URLSearchParams();
    if (sectionId) params.append("section_id", sectionId);
    const qs = params.toString();
    const data = await apiGet<ApiStudentExamRecord[]>(`${API_BASE_URL}/${examId}/records${qs ? `?${qs}` : ""}`);
    return data.map(mapRecord);
  },

  async bulkSaveStudentExamRecords(examId: string, records: StudentExamRecordSave[]): Promise<StudentExamRecord[]> {
    const data = await apiPost<ApiStudentExamRecord[]>(`${API_BASE_URL}/${examId}/records/bulk`, {
      records: records.map((record) => ({
        exam_subject_id: record.examSubjectId,
        enrollment_id: record.enrollmentId,
        student_id: record.studentId,
        marks_obtained: record.marksObtained ?? null,
        attendance_status: record.attendanceStatus,
        result_status: record.resultStatus ?? null,
        remarks: record.remarks ?? null,
      })),
    });
    return data.map(mapRecord);
  },

  getExamSubjects: async (examId: string): Promise<ExamSubject[]> => {
    const data = await apiGet<ApiExamSubject[]>(`${API_BASE_URL}/${examId}/subjects`);
    return data.map(mapExamSubject);
  },

  getBranches: () => apiGet<LookupItem[]>("/imports/students/lookups/branches"),
  getAcademicYears: () => apiGet<LookupItem[]>("/imports/students/lookups/academic-years"),
  getDepartments: (academicYearId?: string) => {
    const query = new URLSearchParams();
    if (academicYearId) query.append("academic_year_id", academicYearId);
    const qs = query.toString();
    return apiGet<LookupItem[]>(`/academic-structure/departments${qs ? `?${qs}` : ""}`);
  },
  getAcademicPeriods: () => apiGet<AcademicPeriodLookup[]>("/imports/students/lookups/academic-periods"),
  getSubjectOfferings: (params: { departmentId?: string; academicPeriodId?: string }) => {
    const query = new URLSearchParams();
    if (params.departmentId) query.append("department_id", params.departmentId);
    if (params.academicPeriodId) query.append("academic_period_id", params.academicPeriodId);
    const qs = query.toString();
    return apiGet<SubjectOfferingLookup[]>(`/academic-structure/subject-offerings${qs ? `?${qs}` : ""}`);
  },
};
