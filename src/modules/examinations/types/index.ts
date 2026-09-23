export type ExamType =
  | "INTERNAL"
  | "MID_TERM"
  | "BOARD"
  | "PRACTICAL"
  | "SUPPLEMENTARY";

export type ExamStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "RETURNED"
  | "PUBLISHED"
  | "CANCELLED"
  | "ARCHIVED";

export type ExamAttendanceStatus = "PRESENT" | "ABSENT" | "MALPRACTICE" | "EXEMPTED";
export type ExamResultStatus = "PASS" | "FAIL" | "ABSENT" | "WITHHELD" | "EXEMPTED";

export interface ExamSubject {
  id: string;
  examId: string;
  sectionSubjectId?: string | null;
  sectionId?: string | null;
  sectionName?: string | null;
  subjectId: string;
  subjectCode?: string | null;
  subjectName?: string | null;
  maxMarks: number;
  passMarks?: number | null;
  examDate?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface Exam {
  id: string;
  tenantId: string;
  branchId: string;
  departmentId: string;
  academicYearId: string;
  academicPeriodId?: string | null;
  name: string;
  examType: ExamType;
  status: ExamStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  examSubjects: ExamSubject[];
  marksSummary?: Record<string, number> | null;
}

export interface ExamCreatePayload {
  name: string;
  examType: ExamType;
  branchId: string;
  departmentId: string;
  academicYearId: string;
  academicPeriodId?: string | null;
  examSubjects: Array<{
    subjectId: string;
    sectionSubjectId?: string | null;
    maxMarks: number;
    passMarks?: number | null;
    examDate?: string | null;
  }>;
}

export interface StudentExamRecord {
  id: string;
  examSubjectId: string;
  examId: string;
  sectionSubjectId?: string | null;
  subjectId: string;
  subjectCode?: string | null;
  subjectName?: string | null;
  studentId: string;
  enrollmentId: string;
  studentName?: string | null;
  admissionNumber?: string | null;
  rollNumber?: string | null;
  sectionId?: string | null;
  sectionName?: string | null;
  marksObtained?: number | null;
  attendanceStatus: ExamAttendanceStatus;
  resultStatus?: ExamResultStatus | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentExamRecordSave {
  examSubjectId: string;
  enrollmentId: string;
  studentId: string;
  marksObtained?: number | null;
  attendanceStatus: ExamAttendanceStatus;
  resultStatus?: ExamResultStatus | null;
  remarks?: string | null;
}

export interface LookupItem {
  id: string;
  code?: string | null;
  name: string;
}

export interface AcademicPeriodLookup extends LookupItem {
  code: string;
}

export interface SubjectOfferingLookup {
  id: string;
  sectionId: string;
  sectionName?: string | null;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectType?: string | null;
  subjectCategory?: string | null;
  academicPeriodCode?: string | null;
}
