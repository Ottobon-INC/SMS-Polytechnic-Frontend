import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { examinationsApi } from "../api/examinationsApi";
import type { Exam, ExamAttendanceStatus, StudentExamRecord } from "../types";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

export function ClassMarksEntryPage({ initialExamId, onBack }: { initialExamId?: string; onBack: () => void }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState(initialExamId || "");
  const [records, setRecords] = useState<StudentExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedExam = useMemo(() => exams.find((exam) => exam.id === examId), [exams, examId]);

  useEffect(() => {
    setLoading(true);
    examinationsApi
      .getExams()
      .then((data) => {
        setExams(data);
        if (!examId) setExamId(data[0]?.id || "");
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load exams."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!examId) {
      setRecords([]);
      return;
    }
    setLoading(true);
    examinationsApi
      .getStudentExamRecords(examId)
      .then(setRecords)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load mark records."))
      .finally(() => setLoading(false));
  }, [examId]);

  function updateRecord(id: string, patch: Partial<StudentExamRecord>) {
    setRecords((prev) => prev.map((record) => (record.id === id ? { ...record, ...patch } : record)));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!examId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await examinationsApi.bulkSaveStudentExamRecords(
        examId,
        records.map((record) => ({
          examSubjectId: record.examSubjectId,
          enrollmentId: record.enrollmentId,
          studentId: record.studentId,
          marksObtained: record.attendanceStatus === "PRESENT" ? record.marksObtained ?? null : null,
          attendanceStatus: record.attendanceStatus,
          resultStatus: record.resultStatus ?? null,
          remarks: record.remarks ?? null,
        }))
      );
      setRecords(saved);
      setSuccess("Marks saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save marks.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" />
              Back to examinations
            </button>
            <h1 className="text-2xl font-bold text-slate-950">Marks Entry</h1>
            <p className="mt-1 text-sm text-slate-600">Enter marks against active Polytechnic exam subject records.</p>
          </div>
          <select className={`${inputCls} max-w-md`} value={examId} onChange={(e) => setExamId(e.target.value)}>
            <option value="">Select exam</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name} · {exam.examType.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

        <form onSubmit={handleSave} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase text-slate-800">{selectedExam?.name ?? "Exam Records"}</h2>
              <p className="text-xs text-slate-500">{selectedExam?.examSubjects.map((s) => s.subjectCode || s.subjectName).join(", ") || "Select an exam to load records."}</p>
            </div>
            <button disabled={saving || !records.length} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Marks
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading records...</div>
          ) : records.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No student exam records found for the selected exam.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Marks</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{record.studentName ?? record.studentId}</p>
                      <p className="text-xs text-slate-500">{record.rollNumber || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{record.subjectCode || record.subjectName || record.subjectId}</td>
                    <td className="px-4 py-3">
                      <select className={inputCls} value={record.attendanceStatus} onChange={(e) => updateRecord(record.id, { attendanceStatus: e.target.value as ExamAttendanceStatus })}>
                        {["PRESENT", "ABSENT", "MALPRACTICE", "EXEMPTED"].map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className={inputCls}
                        type="number"
                        min="0"
                        step="0.01"
                        value={record.marksObtained ?? ""}
                        disabled={record.attendanceStatus !== "PRESENT"}
                        onChange={(e) => updateRecord(record.id, { marksObtained: e.target.value === "" ? null : Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select className={inputCls} value={record.resultStatus ?? ""} onChange={(e) => updateRecord(record.id, { resultStatus: e.target.value === "" ? null : (e.target.value as StudentExamRecord["resultStatus"]) })}>
                        <option value="">Auto/Unset</option>
                        {["PASS", "FAIL", "ABSENT", "WITHHELD", "EXEMPTED"].map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input className={inputCls} value={record.remarks ?? ""} onChange={(e) => updateRecord(record.id, { remarks: e.target.value || null })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </form>
      </div>
    </div>
  );
}
