import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, Loader2, MessageSquareText, PhoneCall, RefreshCw } from "lucide-react";
import { notificationsApi, type NotificationLog } from "../api/notificationsApi";
import { useAuth } from "../../authentication/providers/AuthProvider";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

function payloadEntity(log: NotificationLog) {
  const payload = log.payload || {};
  return String(payload.exam_id || payload.fee_account_id || payload.attendance_session_id || payload.entity_id || "");
}

export function NotificationsAuditPage() {
  const auth = useAuth();
  const canUpdateGuardianPhone = auth.hasAnyPermission(["guardian.update", "student.update_basic", "student.update_sensitive"]);

  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<NotificationLog | null>(null);
  const [mobile, setMobile] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) =>
      [
        log.recipient_type,
        log.recipient_name,
        log.recipient_phone,
        log.student_name,
        log.admission_number,
        log.section_name,
        log.channel,
        log.template_code,
        log.status,
        payloadEntity(log),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [logs, query]);

  async function loadLogs() {
    setError(null);
    setLogs(await notificationsApi.getLogs(undefined, 200));
  }

  useEffect(() => {
    setLoading(true);
    loadLogs()
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load notification logs."))
      .finally(() => setLoading(false));
  }, []);

  function openPhoneUpdate(log: NotificationLog) {
    setSelected(log);
    setMobile(log.recipient_phone || "");
    setSuccess(null);
    setError(null);
  }

  async function handleUpdatePhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected?.student_id) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await notificationsApi.updateGuardianPhone(selected.student_id, mobile);
      setSuccess(`Guardian phone updated. Requeued ${response.requeued_count} log(s).`);
      setSelected(null);
      await loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update guardian phone.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-cyan-600">Polytechnic Notifications</p>
                <h1 className="mt-1 text-2xl font-black text-slate-950">Notification Logs</h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-500">
                  Review WhatsApp logs from attendance, fees, exams, and workflow events.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadLogs().finally(() => setLoading(false));
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-700 hover:bg-cyan-100"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </header>

        <section className="rounded-lg bg-slate-950 px-5 py-5 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-cyan-300">Delivery Audit</p>
              <h2 className="mt-1 text-2xl font-black">Message Status and Guardian Contact Review</h2>
              <p className="mt-1 text-sm text-slate-300">
                Track delivery outcomes and quickly repair missing guardian phone numbers when your role allows it.
              </p>
            </div>
            <div className="rounded-md bg-white/10 px-4 py-3 text-center ring-1 ring-white/10">
              <p className="text-2xl font-black">{logs.length}</p>
              <p className="text-[10px] font-black uppercase text-slate-300">Recent logs</p>
            </div>
          </div>
        </section>

        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-800"><Bell className="h-4 w-4" /> Audit Trail</h2>
            <input className={`${inputCls} md:max-w-sm`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipient, student, section or template" />
          </div>
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading notifications...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No notification logs found.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Template</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{log.recipient_name || log.recipient_type}</p>
                      <p className="text-xs text-slate-500">{log.recipient_phone || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{log.student_name || "-"}</p>
                      <p className="text-xs text-slate-500">{log.admission_number || "-"} · {log.section_name || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{log.template_code || "-"}</p>
                      <p className="text-xs text-slate-400">{payloadEntity(log) || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.channel}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{log.status}</span></td>
                    <td className="px-4 py-3 text-slate-500">{new Date(log.created_at).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right">
                      {canUpdateGuardianPhone ? (
                        <button type="button" onClick={() => openPhoneUpdate(log)} disabled={!log.student_id} className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 disabled:opacity-50">
                          <PhoneCall className="h-3 w-3" /> Guardian Phone
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <form onSubmit={handleUpdatePhone} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <h2 className="text-lg font-bold text-slate-950">Update Guardian Phone</h2>
              <p className="mt-1 text-sm text-slate-600">{selected.student_name || selected.recipient_name || "Selected log"}</p>
              <input className={`${inputCls} mt-4`} required value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Guardian phone" />
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setSelected(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                <button className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
