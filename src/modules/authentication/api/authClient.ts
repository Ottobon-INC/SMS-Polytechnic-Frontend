import { apiGet, apiPost, getStoredAccessToken, getStoredStudentAccessToken } from "../../../api/client/apiClient";
import type { CurrentUserResponse, LoginResponse, PortalKey } from "../types/authContext.types";

export async function loginWithPassword(
  loginIdentifier: string,
  password: string,
  portal: PortalKey
): Promise<LoginResponse> {
  const endpoint = portal === "student" ? "/auth/student-login" : "/auth/login";
  return apiPost<LoginResponse>(endpoint, {
    login_identifier: loginIdentifier,
    password,
    portal
  });
}

export async function fetchCurrentUser(): Promise<CurrentUserResponse> {
  const studentToken = getStoredStudentAccessToken();
  if (studentToken) {
    try {
      const payloadBase64 = studentToken.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64));
      if (payload.typ === "student_access") {
        return {
          user: {
            id: payload.sub || "student-id",
            display_name: "Student",
            email: null,
            status: "ACTIVE",
            account_category: "STUDENT"
          },
          available_contexts: [
            {
              assignment_id: "student-assignment",
              tenant: null,
              branch: null,
              role: { code: "STUDENT", label: "Student" },
              scope_type: "STUDENT",
              enabled_modules: [],
              permissions: []
            }
          ],
          active_context: {
            assignment_id: "student-assignment",
            tenant_id: payload.tenant_id || null,
            branch_id: payload.branch_id || null,
            role_codes: ["STUDENT"],
            permissions: [],
            enabled_modules: [],
            scope_type: "STUDENT"
          }
        };
      }
    } catch {
      // ignore parsing errors
    }
  }
  return apiGet<CurrentUserResponse>("/auth/me");
}

export async function submitSignupRequest(payload: {
  requested_portal: PortalKey;
  full_name: string;
  email: string;
  mobile?: string;
  institution_name?: string;
  branch_name?: string;
  message?: string;
}): Promise<{ request_id: string; status: string }> {
  return apiPost<{ request_id: string; status: string }>("/auth/signup-request", payload);
}

export async function selectAccessContext(assignmentId: string): Promise<CurrentUserResponse> {
  return apiPost<CurrentUserResponse>("/auth/select-context", { assignment_id: assignmentId });
}
