import { apiGet, apiPost } from "../../../api/client/apiClient";

export interface NotificationLog {
  id: string;
  tenant_id?: string | null;
  branch_id?: string | null;
  recipient_type: string;
  recipient_id?: string | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  student_id?: string | null;
  student_name?: string | null;
  admission_number?: string | null;
  section_name?: string | null;
  channel: string;
  template_code?: string | null;
  payload: Record<string, unknown>;
  status: string;
  provider_response: Record<string, unknown>;
  message_body?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface DispatchProgress {
  entity_id: string;
  status: string;
  total_notifications: number;
  completed_notifications: number;
  failed_notifications: number;
  missing_phone_notifications: number;
  progress_percentage: number;
  is_ongoing: boolean;
}

export const notificationsApi = {
  getLogs: (branchId?: string, limit = 100): Promise<NotificationLog[]> => {
    const params = new URLSearchParams();
    if (branchId) params.append("branch_id", branchId);
    params.append("limit", String(limit));
    return apiGet<NotificationLog[]>(`/whatsapp/logs?${params.toString()}`);
  },

  getProgress: (entityId: string): Promise<DispatchProgress> =>
    apiGet<DispatchProgress>(`/whatsapp/progress/${encodeURIComponent(entityId)}`),

  updateGuardianPhone: (studentId: string, mobile: string): Promise<{ status: string; mobile: string; requeued_count: number }> =>
    apiPost<{ status: string; mobile: string; requeued_count: number }>("/whatsapp/update-guardian-phone", {
      student_id: studentId,
      mobile,
    }),
};
