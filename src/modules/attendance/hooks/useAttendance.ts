import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "../api/attendanceApi";
import type {
  AttendanceSessionCreate,
  AttendanceDraftSavePayload,
  AttendanceSessionResponse,
} from "../types/attendance.types";

export const ATTENDANCE_KEYS = {
  all: ["attendance"] as const,
  session: (id: string) => [...ATTENDANCE_KEYS.all, "session", id] as const,
  sessions: (status?: string) => [...ATTENDANCE_KEYS.all, "sessions", status || "all"] as const,
  sectionsStatus: (date: string, academicYearId?: string, departmentId?: string, academicPeriodId?: string) =>
    [...ATTENDANCE_KEYS.all, "sectionsStatus", date, academicYearId || "all", departmentId || "all", academicPeriodId || "all"] as const,
  lookups: ["attendance", "lookups"] as const,
};

export function useAttendanceSessions(status?: string) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.sessions(status),
    queryFn: () => attendanceApi.getSessions(status),
  });
}

export function useAttendanceSession(sessionId: string | null) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.session(sessionId as string),
    queryFn: () => attendanceApi.getSession(sessionId as string),
    enabled: !!sessionId,
    staleTime: 0, // Always fetch fresh
  });
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttendanceSessionCreate) => attendanceApi.createSession(payload),
    onSuccess: (data: AttendanceSessionResponse) => {
      queryClient.setQueryData(ATTENDANCE_KEYS.session(data.id), data);
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.sessions() });
    },
  });
}

export function useSaveDraftAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: AttendanceDraftSavePayload }) =>
      attendanceApi.saveDraft(sessionId, payload),
    onSuccess: (data: AttendanceSessionResponse) => {
      queryClient.setQueryData(ATTENDANCE_KEYS.session(data.id), data);
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.sessions() });
    },
  });
}

export function useSubmitAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => attendanceApi.submitSession(sessionId),
    onSuccess: (data: AttendanceSessionResponse) => {
      queryClient.setQueryData(ATTENDANCE_KEYS.session(data.id), data);
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.sessions() });
    },
  });
}

export function useFinalizeAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => attendanceApi.finalizeSession(sessionId),
    onSuccess: (data: AttendanceSessionResponse) => {
      queryClient.setQueryData(ATTENDANCE_KEYS.session(data.id), data);
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.sessions() });
    },
  });
}

export function useReturnAttendanceSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason?: string }) => 
      attendanceApi.returnSession(sessionId, { reason }),
    onSuccess: (data: AttendanceSessionResponse) => {
      queryClient.setQueryData(ATTENDANCE_KEYS.session(data.id), data);
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.sessions() });
    },
  });
}

export function useAttendanceSectionsStatus(date: string, academicYearId?: string, departmentId?: string, academicPeriodId?: string) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.sectionsStatus(date, academicYearId, departmentId, academicPeriodId),
    queryFn: () => attendanceApi.getSectionsStatus(date, academicYearId, departmentId, academicPeriodId),
    enabled: !!academicYearId && !!departmentId && !!academicPeriodId && !!date,
    staleTime: 0, // Always fetch fresh as statuses might change
  });
}

// --- Lookup Hooks ---
export function useAttendanceBranches() {
  return useQuery({
    queryKey: [...ATTENDANCE_KEYS.lookups, "branches"],
    queryFn: () => attendanceApi.getBranches(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttendanceAcademicYears() {
  return useQuery({
    queryKey: [...ATTENDANCE_KEYS.lookups, "academic-years"],
    queryFn: () => attendanceApi.getAcademicYears(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttendanceDepartments(academicYearId?: string) {
  return useQuery({
    queryKey: [...ATTENDANCE_KEYS.lookups, "departments", academicYearId],
    queryFn: () => attendanceApi.getDepartments(academicYearId),
    enabled: !!academicYearId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttendanceAcademicPeriods() {
  return useQuery({
    queryKey: [...ATTENDANCE_KEYS.lookups, "academic-periods"],
    queryFn: () => attendanceApi.getAcademicPeriods(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttendanceSections(branchId?: string, academicYearId?: string, departmentId?: string, academicPeriodId?: string) {
  return useQuery({
    queryKey: [...ATTENDANCE_KEYS.lookups, "sections", branchId, academicYearId, departmentId, academicPeriodId],
    queryFn: () => attendanceApi.getSections({ branchId, academicYearId, departmentId, academicPeriodId }),
    enabled: !!branchId && !!academicYearId && !!departmentId && !!academicPeriodId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttendanceSubjectOfferings(sectionId?: string, academicYearId?: string, departmentId?: string, academicPeriodId?: string) {
  return useQuery({
    queryKey: [...ATTENDANCE_KEYS.lookups, "subject-offerings", sectionId, academicYearId, departmentId, academicPeriodId],
    queryFn: () => attendanceApi.getSubjectOfferings({ sectionId, academicYearId, departmentId, academicPeriodId }),
    enabled: !!sectionId,
    staleTime: 5 * 60 * 1000,
  });
}
