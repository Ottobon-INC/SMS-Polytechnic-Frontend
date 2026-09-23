import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  History,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { examinationsApi } from "../api/examinationsApi";
import type { AcademicPeriodLookup, Exam, ExamAttendanceStatus, ExamResultStatus, LookupItem, StudentExamRecord } from "../types";
import { useAuth } from "../../authentication/providers/AuthProvider";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-400";

const actionCls =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60";

function compactLabel(item?: { code?: string | null; name?: string | null }) {
  if (!item) return "-";
  return item.name || item.code || "-";
}

function departmentLabel(item?: { code?: string | null; name?: string | null }) {
  if (!item) return "-";
  return [item.code, item.name].filter(Boolean).join(" - ") || "-";
}

function periodLabel(period?: { code?: string | null; name?: string | null }) {
  if (!period) return "-";
  if (period.name) return period.name;
  if (period.code === "FIRST_YEAR_ANNUAL") return "First Year";
  const match = /^SEMESTER_(\d+)$/.exec(period.code ?? "");
  return match ? `Semester ${match[1]}` : period.code || "-";
}

function examTypeLabel(value: string) {
  if (value === "BOARD") return "External";
  if (value === "MID_TERM") return "Mid Exam";
  return titleCaseCode(value);
}

function titleCaseCode(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatTimestamp(value: unknown) {
  if (typeof value !== "string" || !value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function statusBadge(status: Exam["status"]) {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "SUBMITTED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "RETURNED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function resultForRecord(record: StudentExamRecord, selectedExam?: Exam): ExamResultStatus | null {
  if (record.resultStatus) return record.resultStatus;
  if (record.attendanceStatus === "ABSENT") return "ABSENT";
  if (record.attendanceStatus === "MALPRACTICE") return "WITHHELD";
  if (record.attendanceStatus === "EXEMPTED") return "EXEMPTED";
  const subject = selectedExam?.examSubjects.find((item) => item.id === record.examSubjectId);
  if (record.marksObtained == null || subject?.passMarks == null) return null;
  return Number(record.marksObtained) >= Number(subject.passMarks) ? "PASS" : "FAIL";
}

function resultPill(status: ExamResultStatus | null) {
  if (!status) return "border-slate-200 bg-slate-50 text-slate-500";
  if (status === "PASS") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "FAIL" || status === "ABSENT") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "WITHHELD") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

export function ClassMarksEntryPage({ initialExamId, onBack }: { initialExamId?: string; onBack: () => void }) {
  const auth = useAuth();
  const canEnterMarks = auth.hasAnyPermission(["exam.enter_marks", "exam.marks_enter", "exam.manage"]);
  const canPublish = auth.hasPermission("exam.publish");

  const [exams, setExams] = useState<Exam[]>([]);
  const [branches, setBranches] = useState<LookupItem[]>([]);
  const [academicYears, setAcademicYears] = useState<LookupItem[]>([]);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriodLookup[]>([]);
  const [examId, setExamId] = useState(initialExamId || "");
  const [records, setRecords] = useState<StudentExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<"submit" | "publish" | "return" | null>(null);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ExamAttendanceStatus | "PENDING">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedExam = useMemo(() => exams.find((exam) => exam.id === examId), [exams, examId]);
  const branchById = useMemo(() => new Map(branches.map((branch) => [branch.id, branch])), [branches]);
  const yearById = useMemo(() => new Map(academicYears.map((year) => [year.id, year])), [academicYears]);
  const departmentById = useMemo(() => new Map(departments.map((department) => [department.id, department])), [departments]);
  const periodById = useMemo(() => new Map(periods.map((period) => [period.id, period])), [periods]);
  const sectionNames = useMemo(() => Array.from(new Set(records.map((record) => record.sectionName).filter(Boolean))) as string[], [records]);
  const isPublished = selectedExam?.status === "PUBLISHED";
  const canEdit = canEnterMarks && !isPublished;

  const subjectOptions = useMemo(() => {
    const unique = new Map<string, { id: string; label: string }>();
    records.forEach((record) => {
      unique.set(record.examSubjectId, {
        id: record.examSubjectId,
        label: [record.subjectCode, record.subjectName].filter(Boolean).join(" - ") || record.subjectId,
      });
    });
    return Array.from(unique.values());
  }, [records]);

  const stats = useMemo(() => {
    const total = records.length;
    let entered = 0;
    let pending = 0;
    let absent = 0;
    let pass = 0;
    let fail = 0;
    records.forEach((record) => {
      const result = resultForRecord(record, selectedExam);
      if (record.attendanceStatus === "ABSENT") absent += 1;
      if (record.attendanceStatus === "PRESENT" && record.marksObtained == null) pending += 1;
      else entered += 1;
      if (result === "PASS") pass += 1;
      if (result === "FAIL") fail += 1;
    });
    return { total, entered, pending, absent, pass, fail };
  }, [records, selectedExam]);

  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      const result = resultForRecord(record, selectedExam);
      const haystack = [
        record.studentName,
        record.admissionNumber,
        record.rollNumber,
        record.sectionName,
        record.subjectCode,
        record.subjectName,
        record.attendanceStatus,
        result,
      ].join(" ").toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      const matchesSubject = subjectFilter === "ALL" || record.examSubjectId === subjectFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING" ? record.attendanceStatus === "PRESENT" && record.marksObtained == null : record.attendanceStatus === statusFilter);
      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [query, records, selectedExam, statusFilter, subjectFilter]);

  async function loadExams(nextExamId?: string) {
    const data = await examinationsApi.getExams();
    setExams(data);
    const preferred = nextExamId || examId || data[0]?.id || "";
    if (!examId && preferred) setExamId(preferred);
    return preferred;
  }

  async function loadRecords(targetExamId: string) {
    if (!targetExamId) {
      setRecords([]);
      return;
    }
    setRecords(await examinationsApi.getStudentExamRecords(targetExamId));
  }

  useEffect(() => {
    examinationsApi.getBranches().then(setBranches).catch(() => setBranches([]));
    examinationsApi.getAcademicYears().then(setAcademicYears).catch(() => setAcademicYears([]));
    examinationsApi.getAcademicPeriods().then(setPeriods).catch(() => setPeriods([]));
    setLoading(true);
    loadExams(initialExamId)
      .then((targetExamId) => loadRecords(targetExamId))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load mark records."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!examId) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setSubjectFilter("ALL");
    setStatusFilter("ALL");
    loadRecords(examId)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load mark records."))
      .finally(() => setLoading(false));
  }, [examId]);

  useEffect(() => {
    if (!selectedExam?.academicYearId) {
      setDepartments([]);
      return;
    }
    examinationsApi.getDepartments(selectedExam.academicYearId).then(setDepartments).catch(() => setDepartments([]));
  }, [selectedExam?.academicYearId]);

  function updateRecord(id: string, patch: Partial<StudentExamRecord>) {
    setRecords((prev) => prev.map((record) => (record.id === id ? { ...record, ...patch } : record)));
  }

  async function refreshCurrentExam(message?: string) {
    const targetExamId = examId;
    await loadExams(targetExamId);
    await loadRecords(targetExamId);
    if (message) setSuccess(message);
  }

  async function handleSave(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!examId || !canEdit) return;
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
      await loadExams(examId);
      setSuccess("Marks saved. Last edited time has been updated for review.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save marks.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForReview() {
    if (!examId) return;
    setBusyAction("submit");
    setError(null);
    setSuccess(null);
    try {
      await handleSave();
      await examinationsApi.submitExam(examId);
      await refreshCurrentExam("Marks submitted for Principal/Dean review.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit marks for review.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handlePublish() {
    if (!examId) return;
    setBusyAction("publish");
    setError(null);
    setSuccess(null);
    try {
      await examinationsApi.publishExam(examId);
      await refreshCurrentExam("Assessment published. Result notifications have been queued.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish assessment.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleReturn() {
    if (!examId) return;
    const reason = window.prompt("Reason for returning marks for correction?", "Please review and correct marks.");
    if (reason == null) return;
    setBusyAction("return");
    setError(null);
    setSuccess(null);
    try {
      await examinationsApi.returnExam(examId, reason || "Returned for correction.");
      await refreshCurrentExam("Assessment returned for correction.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to return assessment.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-sm">
          <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Examinations
          </button>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight">Class Marks Entry</h1>
                  <p className="mt-1 text-sm text-slate-300">Enter, review, submit, and approve Polytechnic assessment marks.</p>
                </div>
              </div>
              {selectedExam && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusBadge(selectedExam.status)}`}>{titleCaseCode(selectedExam.status)}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">{selectedExam.name}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">{examTypeLabel(selectedExam.examType)}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3 text-center sm:min-w-[520px]">
              <HeroStat label="Records" value={stats.total} tone="slate" />
              <HeroStat label="Entered" value={stats.entered} tone="teal" />
              <HeroStat label="Pending" value={stats.pending} tone={stats.pending ? "amber" : "teal"} />
              <HeroStat label="Pass" value={stats.pass} tone="emerald" />
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[1fr_260px_180px]">
            <select className={inputCls} value={examId} onChange={(e) => setExamId(e.target.value)}>
              <option value="">Select assessment</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} · {examTypeLabel(exam.examType)} · {titleCaseCode(exam.status)}
                </option>
              ))}
            </select>
            <select className={inputCls} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="ALL">All subjects</option>
              {subjectOptions.map((subject) => <option key={subject.id} value={subject.id}>{subject.label}</option>)}
            </select>
            <select className={inputCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="ALL">All records</option>
              <option value="PENDING">Pending marks</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="MALPRACTICE">Malpractice</option>
              <option value="EXEMPTED">Exempted</option>
            </select>
          </div>
        </div>

        {selectedExam && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Assessment Scope</h2>
                <p className="mt-1 text-sm text-slate-500">Academic context for the selected marks entry session.</p>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusBadge(selectedExam.status)}`}>{titleCaseCode(selectedExam.status)}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <ScopeItem label="Assessment" value={selectedExam.name} />
              <ScopeItem label="Type" value={examTypeLabel(selectedExam.examType)} />
              <ScopeItem label="Branch/Campus" value={compactLabel(branchById.get(selectedExam.branchId))} />
              <ScopeItem label="Academic Year" value={compactLabel(yearById.get(selectedExam.academicYearId))} />
              <ScopeItem label="Department" value={departmentLabel(departmentById.get(selectedExam.departmentId))} />
              <ScopeItem label="Year/Semester" value={periodLabel(periodById.get(selectedExam.academicPeriodId || ""))} />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <ScopeItem label="Section(s)" value={sectionNames.length ? sectionNames.join(", ") : "-"} />
              <ScopeItem label="Subject(s)" value={selectedExam.examSubjects.map((subject) => [subject.subjectCode, subject.subjectName, subject.sectionName ? `(${subject.sectionName})` : ""].filter(Boolean).join(" - ")).join(", ") || "-"} />
            </div>
          </section>
        )}

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}

        <form onSubmit={handleSave} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-900">
                <FileCheck2 className="h-4 w-4 text-teal-600" />
                Marks Matrix
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {selectedExam?.examSubjects.map((subject) => subject.subjectCode || subject.subjectName).join(", ") || "Select an assessment to load records."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[280px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input className={`${inputCls} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student, roll no, subject..." />
              </div>
              {canEdit && (
                <button disabled={saving || !records.length} className={`${actionCls} bg-slate-950 text-white hover:bg-slate-800`}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              )}
              {canEdit && selectedExam?.status !== "SUBMITTED" && (
                <button type="button" onClick={handleSubmitForReview} disabled={busyAction === "submit" || !records.length || stats.pending > 0} className={`${actionCls} bg-teal-600 text-white hover:bg-teal-700`}>
                  {busyAction === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit for Review
                </button>
              )}
              {canPublish && selectedExam?.status === "SUBMITTED" && (
                <>
                  <button type="button" onClick={handlePublish} disabled={busyAction === "publish"} className={`${actionCls} bg-violet-600 text-white hover:bg-violet-700`}>
                    {busyAction === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Approve & Publish
                  </button>
                  <button type="button" onClick={handleReturn} disabled={busyAction === "return"} className={`${actionCls} border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100`}>
                    <RotateCcw className="h-4 w-4" />
                    Return
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading records...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No mark records found for the selected filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Section</th>
                    <th className="px-5 py-3">Subject</th>
                    <th className="px-5 py-3">Attendance</th>
                    <th className="px-5 py-3">Marks</th>
                    <th className="px-5 py-3">Result</th>
                    <th className="px-5 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record, index) => {
                    const subject = selectedExam?.examSubjects.find((item) => item.id === record.examSubjectId);
                    const result = resultForRecord(record, selectedExam);
                    return (
                      <tr key={record.id} className="bg-white hover:bg-slate-50/70">
                        <td className="px-5 py-4 font-mono text-xs font-bold text-slate-400">{String(index + 1).padStart(2, "0")}</td>
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-950">{record.studentName ?? record.studentId}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">Adm. No: {record.admissionNumber || "-"}</p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">Roll No: {record.rollNumber || "-"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{record.sectionName || "-"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800">{record.subjectName || record.subjectId}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{record.subjectCode || "-"} · Max {subject?.maxMarks ?? "-"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <select className={inputCls} disabled={!canEdit} value={record.attendanceStatus} onChange={(e) => updateRecord(record.id, { attendanceStatus: e.target.value as ExamAttendanceStatus })}>
                            {["PRESENT", "ABSENT", "MALPRACTICE", "EXEMPTED"].map((status) => <option key={status} value={status}>{titleCaseCode(status)}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <input
                            className={inputCls}
                            type="number"
                            min="0"
                            max={subject?.maxMarks ?? undefined}
                            step="0.01"
                            value={record.marksObtained ?? ""}
                            disabled={!canEdit || record.attendanceStatus !== "PRESENT"}
                            onChange={(e) => updateRecord(record.id, { marksObtained: e.target.value === "" ? null : Number(e.target.value), resultStatus: null })}
                            placeholder="Marks"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${resultPill(result)}`}>
                            {result ? titleCaseCode(result) : "Pending"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <input className={inputCls} disabled={!canEdit} value={record.remarks ?? ""} onChange={(e) => updateRecord(record.id, { remarks: e.target.value || null })} placeholder="Optional" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </form>

        {selectedExam && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-900">
              <History className="h-4 w-4 text-slate-500" />
              Review Trail
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <TrailItem label="Status" value={titleCaseCode(selectedExam.status)} />
              <TrailItem label="Submitted At" value={formatTimestamp(selectedExam.metadata.submitted_at)} />
              <TrailItem label="Last Edited At" value={formatTimestamp(selectedExam.metadata.last_edited_at)} />
            </div>
            {isPublished && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                This assessment is published and locked.
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function HeroStat({ label, value, tone }: { label: string; value: number; tone: "slate" | "teal" | "amber" | "emerald" }) {
  const tones = {
    slate: "text-slate-200",
    teal: "text-teal-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
  };
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/10">
      <p className={`text-2xl font-black ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-300">{label}</p>
    </div>
  );
}

function ScopeItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value || "-"}</p>
    </div>
  );
}

function TrailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-950">{value || "-"}</p>
    </div>
  );
}
