import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarChart3, BookOpenCheck, ClipboardList, GraduationCap, Layers3, Loader2, Plus, Send } from "lucide-react";
import { examinationsApi } from "../api/examinationsApi";
import type { AcademicPeriodLookup, Exam, ExamType, LookupItem, SubjectOfferingLookup } from "../types";
import { useAuth } from "../../authentication/providers/AuthProvider";

const examTypes: ExamType[] = [
  "INTERNAL",
  "MID_TERM",
  "BOARD",
  "PRACTICAL",
  "LAB",
  "PROJECT",
  "INDUSTRIAL_TRAINING",
  "SUPPLEMENTARY",
];

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const buttonCls =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60";
const accentButtonCls =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60";

function label(item?: { code?: string | null; name?: string | null }) {
  if (!item) return "-";
  return [item.code, item.name].filter(Boolean).join(" - ") || "-";
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-md bg-white/10 px-3 py-2 ring-1 ring-white/10">
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-[10px] font-black uppercase text-slate-300">{label}</p>
    </div>
  );
}

export function ExamsPage({ onNavigateToMarksEntry }: { onNavigateToMarksEntry: (examId?: string) => void }) {
  const auth = useAuth();
  const canManage = auth.hasPermission("exam.manage");
  const canPublish = auth.hasPermission("exam.publish");
  const canEnterMarks = auth.hasAnyPermission(["exam.enter_marks", "exam.marks_enter", "exam.manage"]);

  const [branches, setBranches] = useState<LookupItem[]>([]);
  const [academicYears, setAcademicYears] = useState<LookupItem[]>([]);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriodLookup[]>([]);
  const [offerings, setOfferings] = useState<SubjectOfferingLookup[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    examType: "INTERNAL" as ExamType,
    branchId: "",
    academicYearId: "",
    departmentId: "",
    academicPeriodId: "",
    subjectOfferingId: "",
    maxMarks: "100",
    passMarks: "35",
    examDate: new Date().toISOString().slice(0, 10),
  });

  const branchNameById = useMemo(() => new Map(branches.map((b) => [b.id, label(b)])), [branches]);
  const departmentNameById = useMemo(() => new Map(departments.map((d) => [d.id, label(d)])), [departments]);
  const yearNameById = useMemo(() => new Map(academicYears.map((y) => [y.id, y.name])), [academicYears]);
  const periodNameById = useMemo(() => new Map(periods.map((p) => [p.id, label(p)])), [periods]);
  const scheduledCount = exams.filter((exam) => exam.status !== "PUBLISHED" && exam.status !== "CANCELLED" && exam.status !== "ARCHIVED").length;
  const publishedCount = exams.filter((exam) => exam.status === "PUBLISHED").length;
  const subjectCount = exams.reduce((total, exam) => total + exam.examSubjects.length, 0);

  async function loadLookups() {
    setError(null);
    const [branchData, yearData] = await Promise.all([
      examinationsApi.getBranches(),
      examinationsApi.getAcademicYears(),
    ]);
    const academicYearId = form.academicYearId || yearData[0]?.id || "";
    const departmentData = academicYearId ? await examinationsApi.getDepartments(academicYearId) : [];
    setBranches(branchData);
    setAcademicYears(yearData);
    setDepartments(departmentData);
    setForm((prev) => ({
      ...prev,
      branchId: prev.branchId || branchData[0]?.id || "",
      academicYearId: prev.academicYearId || academicYearId,
      departmentId: prev.departmentId || departmentData[0]?.id || "",
    }));
  }

  async function loadExams() {
    const data = await examinationsApi.getExams();
    setExams(data);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadLookups(), loadExams()])
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load examinations."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!form.academicYearId) return;
    examinationsApi.getDepartments(form.academicYearId)
      .then((departmentData) => {
        setDepartments(departmentData);
        setForm((prev) => ({
          ...prev,
          departmentId: departmentData.some((department) => department.id === prev.departmentId)
            ? prev.departmentId
            : departmentData[0]?.id || "",
          subjectOfferingId: "",
        }));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load departments."));
  }, [form.academicYearId]);

  useEffect(() => {
    examinationsApi
      .getAcademicPeriods()
      .then((data) => {
        setPeriods(data);
        setForm((prev) => ({
          ...prev,
          academicPeriodId: data.some((p) => p.id === prev.academicPeriodId) ? prev.academicPeriodId : data[0]?.id || "",
          subjectOfferingId: "",
        }));
      })
      .catch(() => setPeriods([]));
  }, []);

  useEffect(() => {
    if (!form.departmentId || !form.academicPeriodId) {
      setOfferings([]);
      return;
    }
    examinationsApi
      .getSubjectOfferings({ departmentId: form.departmentId, academicPeriodId: form.academicPeriodId })
      .then((data) => {
        setOfferings(data);
        setForm((prev) => ({
          ...prev,
          subjectOfferingId: data.some((o) => o.id === prev.subjectOfferingId) ? prev.subjectOfferingId : data[0]?.id || "",
        }));
      })
      .catch(() => setOfferings([]));
  }, [form.departmentId, form.academicPeriodId]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const offering = offerings.find((item) => item.id === form.subjectOfferingId);
    if (!offering) {
      setError("Select a subject offering.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await examinationsApi.createExam({
        name: form.name.trim(),
        examType: form.examType,
        branchId: form.branchId,
        academicYearId: form.academicYearId,
        departmentId: form.departmentId,
        academicPeriodId: form.academicPeriodId,
        examSubjects: [
          {
            subjectId: offering.subjectId,
            sectionSubjectId: offering.id,
            maxMarks: Number(form.maxMarks || 0),
            passMarks: form.passMarks ? Number(form.passMarks) : null,
            examDate: form.examDate || null,
          },
        ],
      });
      setForm((prev) => ({ ...prev, name: "" }));
      await loadExams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exam.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(examId: string) {
    setPublishingId(examId);
    setError(null);
    try {
      await examinationsApi.publishExam(examId);
      await loadExams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish exam.");
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-violet-600">Polytechnic Assessments</p>
                <h1 className="mt-1 text-2xl font-black text-slate-950">Examinations</h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-500">
                  Schedule exams by department, academic period, and subject offering, then enter marks for active enrollments.
                </p>
              </div>
            </div>
            {canEnterMarks && (
              <button type="button" onClick={() => onNavigateToMarksEntry()} className={accentButtonCls}>
                <ClipboardList className="h-4 w-4" />
                Marks Entry
              </button>
            )}
          </div>
        </header>

        <section className="rounded-lg bg-slate-950 px-5 py-5 text-white shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-violet-300">Assessment Workspace</p>
              <h2 className="mt-1 text-2xl font-black">Exam Schedule and Marks Control</h2>
              <p className="mt-1 text-sm text-slate-300">
                Subject offerings decide which enrolled students receive exam records.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
              <Metric value={exams.length} label="Exams" />
              <Metric value={scheduledCount} label="Active" />
              <Metric value={publishedCount} label="Published" />
            </div>
          </div>
        </section>

        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {canManage ? (
          <form onSubmit={handleCreate} className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5 text-teal-700" />
                <h2 className="text-sm font-black uppercase text-slate-900">Create Exam</h2>
              </div>
              <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">{subjectCount} subject records</span>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-4">
              <input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Exam name" />
              <select className={inputCls} value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value as ExamType })}>
                {examTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
              </select>
              <select className={inputCls} required value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                <option value="">Branch</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{label(branch)}</option>)}
              </select>
              <select className={inputCls} required value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
                <option value="">Academic Year</option>
                {academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
              </select>
              <select className={inputCls} required value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value, subjectOfferingId: "" })}>
                <option value="">Department</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{label(department)}</option>)}
              </select>
              <select className={inputCls} required value={form.academicPeriodId} onChange={(e) => setForm({ ...form, academicPeriodId: e.target.value, subjectOfferingId: "" })}>
                <option value="">Academic Period</option>
                {periods.map((period) => <option key={period.id} value={period.id}>{label(period)}</option>)}
              </select>
              <select className={inputCls} required value={form.subjectOfferingId} onChange={(e) => setForm({ ...form, subjectOfferingId: e.target.value })}>
                <option value="">Subject Offering</option>
                {offerings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.subjectCode} - {offering.subjectName}
                  </option>
                ))}
              </select>
              <input className={inputCls} type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
              <input className={inputCls} type="number" min="0" step="0.01" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} placeholder="Max marks" />
              <input className={inputCls} type="number" min="0" step="0.01" value={form.passMarks} onChange={(e) => setForm({ ...form, passMarks: e.target.value })} placeholder="Pass marks" />
              <button className={`${accentButtonCls} md:col-span-2`} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Exam
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Your role can view examinations. Creating exams requires exam.manage permission.
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-violet-700" />
              <h2 className="text-sm font-black uppercase text-slate-900">Exam Register</h2>
            </div>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{exams.length} records</span>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading exams...</div>
          ) : exams.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No exams found.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Exam</th>
                  <th className="px-4 py-3">Context</th>
                  <th className="px-4 py-3">Subjects</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{exam.name}</p>
                      <p className="text-xs text-slate-500">{exam.examType.replaceAll("_", " ")}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{branchNameById.get(exam.branchId) ?? exam.branchId}</p>
                      <p>{departmentNameById.get(exam.departmentId) ?? exam.departmentId}</p>
                      <p>{yearNameById.get(exam.academicYearId) ?? exam.academicYearId} · {periodNameById.get(exam.academicPeriodId || "") ?? exam.academicPeriodId ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {exam.examSubjects.map((subject) => subject.subjectCode || subject.subjectName || subject.subjectId).join(", ") || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{exam.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {canEnterMarks && (
                          <button type="button" onClick={() => onNavigateToMarksEntry(exam.id)} className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50">
                            <BarChart3 className="h-3 w-3" />
                            Marks
                          </button>
                        )}
                        {canPublish && (
                          <button type="button" onClick={() => handlePublish(exam.id)} disabled={publishingId === exam.id || exam.status === "PUBLISHED"} className="inline-flex items-center gap-1 rounded-lg border border-teal-200 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-50">
                            {publishingId === exam.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            Publish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
