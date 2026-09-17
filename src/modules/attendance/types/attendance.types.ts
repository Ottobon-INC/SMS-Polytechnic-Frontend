export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "NOT_MARKED" | "LEAVE" | "UNMARKED";
export type SessionStatus = "DRAFT" | "SUBMITTED" | "RETURNED" | "FINALIZED" | "CANCELLED";
export type SessionType = "DAILY" | "SUBJECT" | "LAB" | "EXAM" | "OTHER";

export interface AttendanceStudentResponse {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  admissionNumber?: string | null;
  rollNumber?: string | null;
  attendanceStatus: AttendanceStatus;
  note?: string | null;
}

export interface AttendanceSessionListItem {
  id: string;
  tenantId: string;
  branchId: string;
  academicYearId: string;
  academicYearName?: string | null;
  academicPeriodId: string;
  academicPeriodCode: string;
  academicPeriodName?: string;
  sectionId: string;
  sectionName: string;
  departmentName?: string;
  subjectId?: string | null;
  subjectName?: string | null;
  sessionType: SessionType;
  attendanceDate: string;
  status: SessionStatus;
  openedBy: string;
  submittedBy?: string | null;
  submittedAt?: string | null;
  finalizedBy?: string | null;
  finalizedAt?: string | null;
}

export interface AttendanceSessionResponse {
  id: string;
  tenantId: string;
  branchId: string;
  academicYearId: string;
  academicYearName?: string | null;
  academicPeriodId: string;
  academicPeriodCode: string;
  academicPeriodName: string;
  sectionId: string;
  sectionName: string;
  subjectId?: string | null;
  subjectCode?: string | null;
  subjectName?: string | null;
  sessionType: SessionType;
  attendanceDate: string;
  status: SessionStatus;
  openedBy: string;
  submittedBy?: string | null;
  submittedAt?: string | null;
  finalizedBy?: string | null;
  finalizedAt?: string | null;
  revisionReason?: string | null;
  students: AttendanceStudentResponse[];
}

export interface AttendanceSessionCreate {
  sectionId: string;
  attendanceDate: string; // YYYY-MM-DD
  sessionType?: SessionType;
  subjectId?: string | null;
}

export interface AttendanceRecordUpdate {
  enrollmentId: string;
  attendanceStatus: AttendanceStatus;
  note?: string | null;
}

export interface AttendanceDraftSavePayload {
  records: AttendanceRecordUpdate[];
}

export interface SectionAttendanceStatus {
  sectionId: string;
  sectionName: string;
  academicYearName?: string | null;
  departmentName?: string | null;
  academicPeriodCode: string;
  status: SessionStatus | "UNMARKED";
  sessionId?: string | null;
}

// Academic Lookup Types from importsApi
export interface LookupItem {
  id: string;
  name: string;
  code?: string;
}

export interface DepartmentLookup {
  id: string;
  code: string;
  name: string;
}

export interface AcademicPeriodLookup {
  id: string;
  code: string;
  name: string;
}

export interface SectionLookup extends LookupItem {
  academicPeriodCode?: string;
  academicPeriodName?: string;
}

export interface SubjectOfferingLookup {
  id: string;
  subjectId: string;
  subjectCode?: string | null;
  subjectName?: string | null;
  subjectCategory: string;
}
