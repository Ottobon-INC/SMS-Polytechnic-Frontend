import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  FileText,
  Filter,
  GraduationCap,
  History,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { examinationsApi } from "../api/examinationsApi";
import type { AcademicPeriodLookup, Exam, ExamStatus, ExamType, LookupItem, SubjectOfferingLookup } from "../types";
import { useAuth } from "../../authentication/providers/AuthProvider";

const examTypeOptions: Array<{ type: ExamType; label: string; maxMarks: string; passMarks: string; helper: string }> = [
  { type: "INTERNAL", label: "Internal", maxMarks: "30", passMarks: "12", helper: "Regular internal assessment for class-level marks." },
  { type: "MID_TERM", label: "Mid Exam", maxMarks: "50", passMarks: "20", helper: "Mid-semester/mid-year exam with a moderate marks pattern." },
  { type: "BOARD", label: "External", maxMarks: "100", passMarks: "35", helper: "External or final theory assessment marks." },
  { type: "PRACTICAL", label: "Practical", maxMarks: "50", passMarks: "20", helper: "Practical or workshop-oriented assessment. Practical-like offerings are preferred when available." },
  { type: "SUPPLEMENTARY", label: "Supplementary", maxMarks: "100", passMarks: "35", helper: "Re-exam/backlog assessment for selected subject offerings." },
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const darkButtonCls =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60";
const tealButtonCls =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60";

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

function statusConfig(status: ExamStatus) {
  switch (status) {
    case "PUBLISHED":
      return { label: "Published", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
    case "SUBMITTED":
      return { label: "Ready to Publish", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
    case "RETURNED":
      return { label: "Returned", cls: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" };
    case "DRAFT":
    case "SCHEDULED":
    case "IN_PROGRESS":
      return { label: status === "DRAFT" ? "Draft" : titleCaseCode(status), cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" };
    default:
      return { label: titleCaseCode(status), cls: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400" };
  }
}

function Metric({ value, label, tone }: { value: number; label: string; tone: "teal" | "violet" | "amber" | "emerald" }) {
  const tones = {
    teal: "text-teal-300",
    violet: "text-violet-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
  };
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
      <p className={`text-2xl font-black ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-300">{label}</p>
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
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<string[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyExamId, setBusyExamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ExamStatus>("ALL");
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    examType: "INTERNAL" as ExamType,
    branchId: "",
    academicYearId: "",
    departmentId: "",
    academicPeriodId: "",
    maxMarks: "100",
    passMarks: "35",
    examDate: new Date().toISOString().slice(0, 10),
  });

  const selectedExamTypeConfig = examTypeOptions.find((option) => option.type === form.examType) ?? examTypeOptions[0];

  const branchById = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);
  const departmentById = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments]);
  const yearById = useMemo(() => new Map(academicYears.map((y) => [y.id, y])), [academicYears]);
  const periodById = useMemo(() => new Map(periods.map((p) => [p.id, p])), [periods]);

  const activeCount = exams.filter((exam) => !["PUBLISHED", "CANCELLED", "ARCHIVED"].includes(exam.status)).length;
  const submittedCount = exams.filter((exam) => exam.status === "SUBMITTED").length;
  const publishedCount = exams.filter((exam) => exam.status === "PUBLISHED").length;

  const hodDepartmentMatch = auth.activeContext?.role_codes.includes("HOD") && auth.appUser?.email
    ? auth.appUser.email.match(/^hod\.([a-z0-9_]+)@/)
    : null;
  const hodDepartment = hodDepartmentMatch ? hodDepartmentMatch[1].toUpperCase() : null;

  const filteredExams = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return exams.filter((exam) => {
      // HOD filtering
      if (hodDepartment) {
        const dept = departmentById.get(exam.departmentId);
        const deptCode = String(dept?.code || dept?.name || "").toUpperCase();
        if (deptCode !== hodDepartment && !deptCode.includes(hodDepartment)) {
          return false;
        }
      }

      const haystack = [
        exam.name,
        exam.examType,
        exam.status,
        compactLabel(branchById.get(exam.branchId)),
        departmentLabel(departmentById.get(exam.departmentId)),
        compactLabel(yearById.get(exam.academicYearId)),
        periodLabel(periodById.get(exam.academicPeriodId || "")),
        ...exam.examSubjects.map((subject) => `${subject.subjectCode ?? ""} ${subject.subjectName ?? ""}`),
      ].join(" ").toLowerCase();
      return (!needle || haystack.includes(needle)) && (statusFilter === "ALL" || exam.status === statusFilter);
    });
  }, [branchById, departmentById, exams, periodById, query, statusFilter, yearById]);

  async function loadLookups() {
    const [branchData, yearData, periodData] = await Promise.all([
      examinationsApi.getBranches(),
      examinationsApi.getAcademicYears(),
      examinationsApi.getAcademicPeriods(),
    ]);
    const academicYearId = form.academicYearId || yearData[0]?.id || "";
    let departmentData = academicYearId ? await examinationsApi.getDepartments(academicYearId) : [];
    
    if (hodDepartment) {
      departmentData = departmentData.filter(d => 
        String(d.code || d.name || "").toUpperCase() === hodDepartment || 
        String(d.code || d.name || "").toUpperCase().includes(hodDepartment)
      );
    }
    
    setBranches(branchData);
    setAcademicYears(yearData);
    setPeriods(periodData);
    setDepartments(departmentData);
    setForm((prev) => ({
      ...prev,
      branchId: prev.branchId || branchData[0]?.id || "",
      academicYearId: prev.academicYearId || academicYearId,
      departmentId: prev.departmentId || departmentData[0]?.id || "",
      academicPeriodId: prev.academicPeriodId || periodData[0]?.id || "",
    }));
  }

  async function loadExams() {
    setExams(await examinationsApi.getExams());
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
        if (hodDepartment) {
          departmentData = departmentData.filter(d => 
            String(d.code || d.name || "").toUpperCase() === hodDepartment || 
            String(d.code || d.name || "").toUpperCase().includes(hodDepartment)
          );
        }
        setDepartments(departmentData);
        setForm((prev) => ({
          ...prev,
          departmentId: departmentData.some((department) => department.id === prev.departmentId) ? prev.departmentId : departmentData[0]?.id || "",
        }));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load departments."));
  }, [form.academicYearId, hodDepartment]);

  useEffect(() => {
    if (!form.departmentId || !form.academicPeriodId) {
      setOfferings([]);
      setSelectedOfferingIds([]);
      return;
    }
    examinationsApi
      .getSubjectOfferings({ departmentId: form.departmentId, academicPeriodId: form.academicPeriodId })
      .then((data) => {
        setOfferings(data);
        setSelectedOfferingIds(data.map((offering) => offering.id));
      })
      .catch(() => {
        setOfferings([]);
        setSelectedOfferingIds([]);
      });
  }, [form.departmentId, form.academicPeriodId]);

  function practicalOfferingIds(source: SubjectOfferingLookup[]) {
    return source
      .filter((offering) => {
        const haystack = `${offering.subjectType ?? ""} ${offering.subjectCategory ?? ""} ${offering.subjectName ?? ""} ${offering.subjectCode ?? ""}`.toLowerCase();
        return haystack.includes("practical") || haystack.includes("lab") || haystack.includes("workshop");
      })
      .map((offering) => offering.id);
  }

  function handleExamTypeChange(type: ExamType) {
    const config = examTypeOptions.find((option) => option.type === type) ?? examTypeOptions[0];
    setForm((prev) => ({
      ...prev,
      examType: type,
      maxMarks: config.maxMarks,
      passMarks: config.passMarks,
    }));
    if (type === "PRACTICAL") {
      const practicalIds = practicalOfferingIds(offerings);
      if (practicalIds.length) setSelectedOfferingIds(practicalIds);
    }
  }

  function toggleOffering(id: string) {
    setSelectedOfferingIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const selectedOfferings = offerings.filter((offering) => selectedOfferingIds.includes(offering.id));
    if (!selectedOfferings.length) {
      setError("Select at least one subject offering.");
      return;
    }
    setSaving(true);
    try {
      await examinationsApi.createExam({
        name: form.name.trim(),
        examType: form.examType,
        branchId: form.branchId,
        academicYearId: form.academicYearId,
        departmentId: form.departmentId,
        academicPeriodId: form.academicPeriodId,
        examSubjects: selectedOfferings.map((offering) => ({
          subjectId: offering.subjectId,
          sectionSubjectId: offering.id,
          maxMarks: Number(form.maxMarks || 0),
          passMarks: form.passMarks ? Number(form.passMarks) : null,
          examDate: form.examDate || null,
        })),
      });
      setForm((prev) => ({ ...prev, name: "" }));
      setSuccess("Assessment created with student mark records.");
      setShowCreate(false);
      await loadExams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assessment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(examId: string) {
    setBusyExamId(examId);
    setError(null);
    try {
      await examinationsApi.submitExam(examId);
      setSuccess("Assessment submitted for Principal/Dean review.");
      await loadExams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit assessment.");
    } finally {
      setBusyExamId(null);
    }
  }

  async function handleReturn(examId: string) {
    const reason = window.prompt("Reason for returning marks for correction?", "Please review and correct marks.");
    if (reason == null) return;
    setBusyExamId(examId);
    setError(null);
    try {
      await examinationsApi.returnExam(examId, reason || "Returned for correction.");
      setSuccess("Assessment returned for correction.");
      await loadExams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to return assessment.");
    } finally {
      setBusyExamId(null);
    }
  }

  async function handlePublish(examId: string) {
    setBusyExamId(examId);
    setError(null);
    try {
      await examinationsApi.publishExam(examId);
      setSuccess("Assessment published. Result notifications have been queued.");
      await loadExams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish assessment.");
    } finally {
      setBusyExamId(null);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-black tracking-tight">Examinations</h1>
                  <span className="rounded-full border border-rose-300/30 bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-100">Total: {exams.length}</span>
                </div>
                <p className="mt-2 max-w-4xl text-sm text-slate-300">
                  Configure Polytechnic assessments by Department, Year/Semester, Section, and Subject Offering. Enter class marks, submit for review, and publish results after approval.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric value={activeCount} label="Active" tone="violet" />
              <Metric value={submittedCount} label="Review" tone="amber" />
              <Metric value={publishedCount} label="Published" tone="emerald" />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input className={`${inputCls} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assessments, department, subject..." />
            </div>
            <select className={`${inputCls} sm:max-w-[220px]`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "ALL" | ExamStatus)}>
              <option value="ALL">All statuses</option>
              {["DRAFT", "SUBMITTED", "RETURNED", "PUBLISHED"].map((status) => <option key={status} value={status}>{titleCaseCode(status)}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <button type="button" onClick={() => setShowCreate((value) => !value)} className={tealButtonCls}>
                <Plus className="h-4 w-4" />
                Create Assessment
              </button>
            )}
            {canEnterMarks && (
              <button type="button" onClick={() => onNavigateToMarksEntry()} className={darkButtonCls}>
                <GraduationCap className="h-4 w-4" />
                Enter Class Marks
              </button>
            )}
          </div>
        </div>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}

        {showCreate && canManage && (
          <form onSubmit={handleCreate} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950">Create New Assessment</h2>
                  <p className="text-sm text-slate-500">Select Polytechnic scope and include one or more subject offerings.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-5">
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-teal-600" />
                  <h3 className="text-sm font-black uppercase text-slate-800">1. Basic Details & Scope</h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Assessment / Exam Title" />
                  <select className={inputCls} value={form.examType} onChange={(e) => handleExamTypeChange(e.target.value as ExamType)}>
                    {examTypeOptions.map((option) => <option key={option.type} value={option.type}>{option.label}</option>)}
                  </select>
                  <select className={inputCls} required value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                    <option value="">Branch/Campus</option>
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{compactLabel(branch)}</option>)}
                  </select>
                  <select className={inputCls} required value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
                    <option value="">Academic Year</option>
                    {academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
                  </select>
                  <select className={inputCls} required value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} disabled={departments.length === 1}>
                    <option value="">Department</option>
                    {departments.map((department) => <option key={department.id} value={department.id}>{departmentLabel(department)}</option>)}
                  </select>
                  <select className={inputCls} required value={form.academicPeriodId} onChange={(e) => setForm({ ...form, academicPeriodId: e.target.value })}>
                    <option value="">Year/Semester</option>
                    {periods.map((period) => <option key={period.id} value={period.id}>{periodLabel(period)}</option>)}
                  </select>
                  <input className={inputCls} type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <input className={inputCls} type="number" min="0" step="0.01" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} placeholder="Max marks" />
                    <input className={inputCls} type="number" min="0" step="0.01" value={form.passMarks} onChange={(e) => setForm({ ...form, passMarks: e.target.value })} placeholder="Pass marks" />
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                  <span className="font-black">{selectedExamTypeConfig.label}:</span> {selectedExamTypeConfig.helper} Default marks are {selectedExamTypeConfig.maxMarks}/{selectedExamTypeConfig.passMarks}; you can edit them before creating.
                </div>
              </section>

              <section>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpenCheck className="h-4 w-4 text-violet-600" />
                    <h3 className="text-sm font-black uppercase text-slate-800">2. Subject Offerings</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{selectedOfferingIds.length} of {offerings.length} selected</span>
                    <button type="button" onClick={() => setSelectedOfferingIds(offerings.map((offering) => offering.id))} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50">
                      Select all
                    </button>
                    <button type="button" onClick={() => setSelectedOfferingIds([])} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50">
                      Deselect all
                    </button>
                  </div>
                </div>
                {offerings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No subject offerings found for the selected Department and Year/Semester.
                  </div>
                ) : (
                  <div className="max-h-[380px] overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                    {offerings.map((offering) => {
                      const selected = selectedOfferingIds.includes(offering.id);
                      return (
                        <button
                          type="button"
                          key={offering.id}
                          onClick={() => toggleOffering(offering.id)}
                          className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${
                            selected ? "bg-teal-50/80" : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                            selected ? "border-teal-500 bg-teal-500 text-white" : "border-slate-300 bg-white text-transparent"
                          }`}>
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-black text-slate-950">{offering.subjectName}</p>
                              {offering.sectionName && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{offering.sectionName}</span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500">Code: {offering.subjectCode}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${selected ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
                            {selected ? "Selected" : "Not selected"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button className={tealButtonCls} disabled={saving || selectedOfferingIds.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Create Assessment
              </button>
            </div>
          </form>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Assessment Register</h2>
              <p className="mt-1 text-xs text-slate-500">Draft, review, publish, and notification-ready assessments.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
              <Filter className="h-4 w-4" />
              {filteredExams.length} of {exams.length} records
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading assessments...</div>
          ) : filteredExams.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No assessments found for the selected filters.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredExams.map((exam) => {
                const cfg = statusConfig(exam.status);
                const summary = exam.marksSummary ?? {};
                const pending = Number(summary.pending ?? 0);
                const entered = Number(summary.entered ?? 0);
                const total = Number(summary.total ?? 0);
                return (
                  <article key={exam.id} className="grid gap-4 px-5 py-5 xl:grid-cols-[1fr_380px] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-slate-950">{exam.name}</h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${cfg.cls}`}>
                          <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{examTypeLabel(exam.examType)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {compactLabel(yearById.get(exam.academicYearId))} · {departmentLabel(departmentById.get(exam.departmentId))} · {periodLabel(periodById.get(exam.academicPeriodId || ""))}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {exam.examSubjects.slice(0, 5).map((subject) => (
                          <span key={subject.id} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                            {subject.subjectCode || subject.subjectName}
                          </span>
                        ))}
                        {exam.examSubjects.length > 5 && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">+{exam.examSubjects.length - 5} more</span>}
                      </div>
                      <div className="mt-4 grid max-w-xl grid-cols-3 gap-2 text-xs">
                        <MiniStat label="Records" value={total} />
                        <MiniStat label="Entered" value={entered} tone="teal" />
                        <MiniStat label="Pending" value={pending} tone={pending ? "rose" : "slate"} />
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                      {canEnterMarks && (
                        <button type="button" onClick={() => onNavigateToMarksEntry(exam.id)} className={tealButtonCls}>
                          <GraduationCap className="h-4 w-4" />
                          Enter / Review Marks
                        </button>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        {canEnterMarks && exam.status !== "SUBMITTED" && exam.status !== "PUBLISHED" && (
                          <button type="button" onClick={() => handleSubmit(exam.id)} disabled={busyExamId === exam.id} className="inline-flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                            {busyExamId === exam.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            Submit
                          </button>
                        )}
                        {canPublish && exam.status === "SUBMITTED" && (
                          <button type="button" onClick={() => handlePublish(exam.id)} disabled={busyExamId === exam.id} className="inline-flex items-center justify-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-50">
                            {busyExamId === exam.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                            Publish
                          </button>
                        )}
                        {canPublish && exam.status === "SUBMITTED" && (
                          <button type="button" onClick={() => handleReturn(exam.id)} disabled={busyExamId === exam.id} className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                            <RotateCcw className="h-3 w-3" />
                            Return
                          </button>
                        )}
                        <button type="button" className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
                          <History className="h-3 w-3" />
                          History
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "teal" | "rose" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700",
    teal: "bg-teal-50 text-teal-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className={`rounded-xl px-3 py-2 ${tones[tone]}`}>
      <p className="text-base font-black">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}
