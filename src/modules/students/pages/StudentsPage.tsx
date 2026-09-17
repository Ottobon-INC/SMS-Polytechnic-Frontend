import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Edit3,
  GraduationCap,
  PhoneOff,
  RefreshCw,
  Save,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../authentication/providers/AuthProvider";
import { useAttendanceBranches } from "../../attendance/hooks/useAttendance";
import { STUDENT_KEYS, useStudents } from "../hooks/useStudents";
import { studentsApi, type StudentInlineUpdatePayload, type StudentListItem } from "../api/studentsApi";
import { StudentProfileSidePanel } from "../components/StudentProfileSidePanel";

type Column = {
  key: string;
  label: string;
  value: (student: StudentListItem) => string;
  updateKey?: keyof StudentInlineUpdatePayload;
  inputType?: "text" | "date" | "select";
  options?: string[];
  className?: string;
};

function valueOrDash(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function dateValue(value: unknown): string {
  return value ? String(value).slice(0, 10) : "";
}

function labelFromCode(value: unknown): string {
  const raw = valueOrDash(value);
  return raw === "-" ? raw : raw.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function departmentDisplay(student: StudentListItem): string {
  if (student.departmentCode && student.departmentName) return `${student.departmentCode} - ${student.departmentName}`;
  return valueOrDash(student.departmentName ?? student.departmentCode);
}

function periodDisplay(student: StudentListItem): string {
  if (student.academicPeriodCode === "FIRST_YEAR_ANNUAL") return "First Year";
  if (student.academicPeriodCode && student.academicPeriodName) return `${student.academicPeriodCode} - ${student.academicPeriodName}`;
  return valueOrDash(student.academicPeriodName ?? student.academicPeriodCode);
}

function academicYearDisplay(student: StudentListItem): string {
  return valueOrDash(student.academicYearName ?? student.admissionYear);
}

function sectionDisplay(student: StudentListItem): string {
  return valueOrDash(student.sectionName);
}

const columns: Column[] = [
  { key: "admissionNumber", label: "Admission No", value: (s) => valueOrDash(s.admissionNumber), className: "font-mono font-bold text-teal-700" },
  { key: "name", label: "Student", value: (s) => valueOrDash(s.fullName ?? s.name), updateKey: "student_name", className: "font-bold text-slate-900" },
  { key: "academicYear", label: "Academic Year", value: academicYearDisplay },
  { key: "department", label: "Department", value: departmentDisplay },
  { key: "period", label: "Academic Period", value: periodDisplay },
  { key: "section", label: "Section", value: sectionDisplay },
  { key: "rollNumber", label: "Roll No", value: (s) => valueOrDash(s.rollNumber), updateKey: "roll_number" },
  { key: "entryType", label: "Entry Type", value: (s) => labelFromCode(s.entryType) },
  { key: "studentPhone", label: "Student Phone", value: (s) => valueOrDash(s.phone), updateKey: "student_mobile" },
  { key: "guardianPhone", label: "Guardian Phone", value: (s) => valueOrDash(s.guardianPhone), updateKey: "guardian_phone" },
];

const editColumns: Column[] = [
  ...columns,
  { key: "gender", label: "Gender", value: (s) => valueOrDash(s.gender), updateKey: "gender", inputType: "select", options: ["MALE", "FEMALE", "OTHER", "UNSPECIFIED"] },
  { key: "dateOfBirth", label: "Date Of Birth", value: (s) => dateValue(s.dateOfBirth), updateKey: "date_of_birth", inputType: "date" },
  { key: "studentEmail", label: "Student Email", value: (s) => valueOrDash(s.email), updateKey: "student_email" },
  { key: "guardianName", label: "Guardian Name", value: (s) => valueOrDash(s.guardianName), updateKey: "guardian_name" },
  { key: "guardianRelationship", label: "Relationship", value: (s) => valueOrDash(s.guardianRelationship), updateKey: "guardian_relationship", inputType: "select", options: ["FATHER", "MOTHER", "LEGAL_GUARDIAN", "RELATIVE", "SPONSOR", "OTHER"] },
  { key: "guardianEmail", label: "Guardian Email", value: (s) => valueOrDash(s.guardianEmail), updateKey: "guardian_email" },
];

export function StudentsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const isTenantLevel = !auth.activeContext?.branch_id;
  const canEdit = auth.hasAnyPermission(["student.update_basic", "student.update_sensitive", "student.manage"]);
  const canCreate = auth.hasAnyPermission(["import.upload", "student.create", "student.manage"]);
  const { data: branches = [] } = useAttendanceBranches();
  const [branchFilter, setBranchFilter] = useState(isTenantLevel ? "" : "ALL");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("ALL");
  const [editMode, setEditMode] = useState(false);
  const [draftChanges, setDraftChanges] = useState<Record<string, StudentInlineUpdatePayload>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);
  const fetchBranchId = isTenantLevel && branchFilter ? branchFilter : undefined;
  const { data: students = [], isLoading, error, refetch } = useStudents(fetchBranchId, !isTenantLevel || !!branchFilter);

  useEffect(() => {
    if (isTenantLevel && !branchFilter && branches.length === 1) {
      setBranchFilter(branches[0].id);
    }
  }, [branches, branchFilter, isTenantLevel]);

  const departments = useMemo(() => {
    const values = new Map<string, string>();
    students.forEach((student) => {
      if (student.departmentId) values.set(student.departmentId, departmentDisplay(student));
    });
    return [...values.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [students]);

  const periods = useMemo(() => {
    const values = new Map<string, string>();
    students.forEach((student) => {
      if (student.academicPeriodId) values.set(student.academicPeriodId, periodDisplay(student));
    });
    return [...values.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [students]);

  const filteredStudents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return students.filter((student) => {
      const haystack = [
        student.fullName,
        student.name,
        student.admissionNumber,
        student.rollNumber,
        student.academicYearName,
        student.admissionYear,
        student.departmentName,
        student.departmentCode,
        student.academicPeriodName,
        student.academicPeriodCode,
        student.sectionName,
        student.guardianName,
        student.guardianPhone,
      ].map(valueOrDash).join(" ").toLowerCase();
      return (!needle || haystack.includes(needle))
        && (departmentFilter === "ALL" || student.departmentId === departmentFilter)
        && (periodFilter === "ALL" || student.academicPeriodId === periodFilter);
    });
  }, [periodFilter, departmentFilter, search, students]);

  const activeStudents = filteredStudents.filter((student) => student.enrollmentStatus === "ACTIVE" || student.status === "ACTIVE").length;
  const lateralEntries = filteredStudents.filter((student) => student.entryType === "LATERAL_ENTRY").length;
  const missingGuardianPhone = filteredStudents.filter((student) => !student.guardianPhone).length;
  const activeColumns = editMode ? editColumns : columns;

  function updateDraft(studentId: string, key: keyof StudentInlineUpdatePayload, value: string) {
    setDraftChanges((current) => ({ ...current, [studentId]: { ...current[studentId], [key]: value } }));
  }

  function draftValue(student: StudentListItem, column: Column) {
    if (!column.updateKey) return column.value(student);
    const draft = draftChanges[student.id]?.[column.updateKey];
    return draft == null ? (column.value(student) === "-" ? "" : column.value(student)) : String(draft);
  }

  async function saveChanges() {
    const changes = Object.entries(draftChanges).filter(([, payload]) => Object.keys(payload).length > 0);
    if (changes.length === 0) {
      setEditMode(false);
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      for (const [studentId, payload] of changes) {
        await studentsApi.updateInline(studentId, payload);
      }
      setDraftChanges({});
      setEditMode(false);
      await queryClient.invalidateQueries({ queryKey: STUDENT_KEYS.lists() });
      setMessage("Student changes saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save student changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Users className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-blue-600">Student Records</p>
                <h1 className="mt-1 text-2xl font-black text-slate-950">Student Directory</h1>
                <p className="mt-1 max-w-4xl text-sm text-slate-500">
                  Review enrolled students by academic year, department, academic period, section, and guardian contact readiness.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => void refetch()} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              {canEdit && (
                editMode ? (
                  <button onClick={() => void saveChanges()} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">
                    <Save className="h-4 w-4" />
                    {saving ? "Saving" : "Save Changes"}
                  </button>
                ) : (
                  <button onClick={() => setEditMode(true)} className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-indigo-600">
                    <Edit3 className="h-4 w-4" />
                    Edit Records
                  </button>
                )
              )}
              {canCreate && (
                <button onClick={() => navigate("/imports/manual")} className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-teal-600">
                  <UserPlus className="h-4 w-4" />
                  Enroll Student
                </button>
              )}
            </div>
          </div>
        </header>

        {message && <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">{message}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error instanceof Error ? error.message : "Unable to load students."}</div>}

        <section className="rounded-lg bg-slate-950 px-5 py-5 text-white shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-blue-300">Active Student Catalog</p>
              <h2 className="mt-1 text-2xl font-black">{filteredStudents.length} Students</h2>
              <p className="mt-1 text-sm text-slate-300">
                {isTenantLevel && !branchFilter ? "Select a branch to load branch-scoped records." : "Click a row to open the student profile panel."}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric label="Active" value={activeStudents} tone="blue" />
              <Metric label="Lateral Entry" value={lateralEntries} tone="amber" />
              <Metric label="Missing Phone" value={missingGuardianPhone} tone="rose" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(260px,1fr)_220px_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, admission no, department, section, guardian..."
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {isTenantLevel && (
            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option value="">Select branch</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          )}
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option value="ALL">All departments</option>
            {departments.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option value="ALL">All periods</option>
            {periods.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-12 text-sm font-semibold text-slate-500 shadow-sm">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            Loading student records
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white py-12 text-center shadow-sm">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">No students found</p>
            {!isTenantLevel || branchFilter ? (
              <p className="mt-1 text-xs text-slate-400">Use Enroll Student to add the first student in this scope.</p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">Select a branch to load tenant-level records.</p>
            )}
          </div>
        ) : (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-black text-slate-950">Student Roster</h2>
              </div>
              <p className="text-xs font-bold uppercase text-slate-400">{filteredStudents.length} matching records</p>
            </div>
            <div className="max-h-[66vh] overflow-auto">
              <table className={`${editMode ? "min-w-[2200px]" : "min-w-[1220px]"} w-full text-left text-xs`}>
                <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                  <tr>
                    {activeColumns.map((column) => <th key={column.key} className="border-b border-r border-slate-200 px-3 py-3">{column.label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} onClick={() => !editMode && setSelectedStudent(student)} className={!editMode ? "cursor-pointer hover:bg-blue-50/50" : ""}>
                      {activeColumns.map((column) => (
                        <td key={`${student.id}-${column.key}`} className={`max-w-[270px] whitespace-nowrap border-r border-slate-100 px-3 py-3 ${column.className ?? "text-slate-700"}`}>
                          {editMode && column.updateKey ? (
                            column.inputType === "select" ? (
                              <select value={draftValue(student, column)} onChange={(e) => updateDraft(student.id, column.updateKey!, e.target.value)} className="min-w-[150px] rounded border border-blue-200 px-2 py-1 outline-none focus:border-blue-500">
                                {column.options?.map((option) => <option key={option} value={option}>{labelFromCode(option)}</option>)}
                              </select>
                            ) : (
                              <input type={column.inputType ?? "text"} value={draftValue(student, column)} onChange={(e) => updateDraft(student.id, column.updateKey!, e.target.value)} className="min-w-[150px] rounded border border-blue-200 px-2 py-1 outline-none focus:border-blue-500" />
                            )
                          ) : column.value(student)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {isTenantLevel && !branchFilter && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            <AlertCircle className="h-4 w-4" />
            Tenant-level users must select a branch before loading branch-scoped student records.
          </div>
        )}
      </div>
      <StudentProfileSidePanel student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "blue" | "amber" | "rose" }) {
  const toneClasses = {
    blue: "bg-blue-500/15 text-blue-100 ring-blue-300/20",
    amber: "bg-amber-500/15 text-amber-100 ring-amber-300/20",
    rose: "bg-rose-500/15 text-rose-100 ring-rose-300/20",
  };
  const icons = {
    blue: Users,
    amber: BookOpen,
    rose: PhoneOff,
  };
  const Icon = icons[tone];
  return (
    <div className={`min-w-[112px] rounded-md px-3 py-2 ring-1 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-center gap-2">
        <Icon className="h-4 w-4" />
        <p className="text-lg font-black text-white">{value}</p>
      </div>
      <p className="text-[10px] font-black uppercase tracking-wide">{label}</p>
    </div>
  );
}
