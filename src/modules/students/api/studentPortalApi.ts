/** API client functions for the Student Portal endpoints. */

import { apiGet, apiPost } from "../../../api/client/apiClient";
import type {
  AcademicsResponse,
  AttendanceResponse,
  ResultsResponse,
  StudentProfile,
  TimetableResponse,
} from "../types/studentPortal.types";

export const studentPortalApi = {
  getProfile: () => apiGet<StudentProfile>("/student-portal/profile"),

  getAcademics: () => apiGet<AcademicsResponse>("/student-portal/academics"),

  getTimetable: () => apiGet<TimetableResponse>("/student-portal/timetable"),

  getResults: () => apiGet<ResultsResponse>("/student-portal/results"),

  getAttendance: () => apiGet<AttendanceResponse>("/student-portal/attendance"),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiPost<{ status: string; message: string }>("/student-portal/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    }),
};
