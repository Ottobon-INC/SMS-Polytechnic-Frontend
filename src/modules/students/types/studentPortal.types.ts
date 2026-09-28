/** TypeScript types for the Student Portal API responses. */

export interface StudentProfile {
  student: {
    id: string;
    studentCode: string | null;
    admissionNumber: string | null;
    fullName: string;
    gender: string | null;
    dateOfBirth: string | null;
    phone: string | null;
    email: string | null;
    status: string;
    metadata: Record<string, unknown>;
  };
  enrollment: {
    id: string | null;
    branchId: string | null;
    branchCode: string | null;
    branchName: string | null;
    departmentId: string | null;
    departmentCode: string | null;
    departmentName: string | null;
    academicYearId: string | null;
    academicYearName: string | null;
    academicPeriodId: string | null;
    academicPeriodCode: string | null;
    academicPeriodName: string | null;
    sectionId: string | null;
    sectionName: string | null;
    entryType: string | null;
    progressionStatus: string | null;
    schemeCode: string | null;
    rollNumber: string | null;
    diplomaRegistrationNumber: string | null;
    admissionDate: string | null;
    enrollmentStatus: string | null;
    metadata: Record<string, unknown>;
  };
  institution: {
    tenantId: string | null;
    tenantName: string | null;
    metadata: Record<string, unknown>;
  };
}

export interface SubjectInfo {
  sectionSubjectId: string | null;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectType: string;
  subjectCategory: string;
  credits: number | null;
  weeklyHours: number | null;
  internalMarks: number | null;
  externalMarks: number | null;
  totalMarks: number | null;
  isMandatory: boolean;
}

export interface SemesterAcademics {
  enrollmentId: string;
  periodCode: string;
  periodName: string;
  sequenceNumber: number;
  sectionName: string;
  enrollmentStatus: string;
  progressionStatus: string;
  subjects: SubjectInfo[];
}

export interface AcademicsResponse {
  semesters: SemesterAcademics[];
}

export interface TimetableSubject {
  subjectCode: string;
  subjectName: string;
  subjectType: string;
  subjectCategory: string;
  credits: number | null;
  weeklyHours: number | null;
  metadata: Record<string, unknown>;
}

export interface TimetableResponse {
  enrollment: {
    enrollmentId: string;
    sectionName: string;
    periodCode: string;
    periodName: string;
    academicYearName: string;
    branchName: string;
    departmentName: string;
  } | null;
  subjects: TimetableSubject[];
  timetableData: Record<string, unknown> | null;
}

export interface ExamSubjectResult {
  recordId: string;
  subjectCode: string;
  subjectName: string;
  subjectType: string;
  credits: number;
  marksObtained: number;
  maxMarks: number;
  passMarks: number | null;
  attendanceStatus: string;
  resultStatus: string | null;
  remarks: string | null;
  examName: string;
  examType: string;
  examDate: string | null;
}

export interface SemesterResults {
  periodCode: string;
  periodName: string;
  sequenceNumber: number;
  subjects: ExamSubjectResult[];
  totalCredits: number;
  totalMarksObtained: number;
  totalMaxMarks: number;
}

export interface ResultsResponse {
  semesters: SemesterResults[];
}

export interface AttendanceSummary {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  attendancePercentage: number;
  isEligible: boolean;
  minimumRequired: number;
  statusLabel: string;
}

export interface AttendanceRecordItem {
  recordId: string;
  date: string;
  sessionType: string;
  status: string;
  sessionStatus: string;
  subjectCode: string | null;
  subjectName: string;
  takenBy: string;
  remarks: string | null;
}

export interface AttendanceResponse {
  summary: AttendanceSummary;
  records: AttendanceRecordItem[];
}

export type StudentPortalTab = "academics" | "timetable" | "results" | "attendance" | "fees" | "profile" | "notifications";
