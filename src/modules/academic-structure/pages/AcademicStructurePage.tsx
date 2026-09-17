import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { academicStructureApi } from "../api/academicStructureApi";
import { useAuth } from "../../authentication/providers/AuthProvider";
import type { AcademicPeriod, AcademicSection, AcademicYear, Department, Subject, SubjectOffering } from "../types";

type Branch = { id: string; name: string; code?: string };
type FormMode = "academicYear" | "department" | "section" | "subject" | "offering" | null;

const subjectCategories = ["THEORY", "PRACTICAL", "LAB", "PROJECT", "INDUSTRIAL_TRAINING"];
const inputCls =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const primaryButtonCls =
  "inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonCls =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function codeName(item?: { code?: string; name?: string } | null) {
  if (!item) return "-";
  return item.code ? `${item.code} - ${item.name ?? ""}` : item.name ?? "-";
}

function periodLabel(period?: AcademicPeriod | null) {
  if (!period) return "Academic Period";
  return period.code === "FIRST_YEAR_ANNUAL" ? "First Year" : period.name;
}

export function AcademicStructurePage() {
  const auth = useAuth();
  const canManage = auth.hasPermission("academic_structure.manage");
  const lockedBranchId = auth.activeContext?.branch_id ?? "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [sections, setSections] = useState<AcademicSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [offerings, setOfferings] = useState<SubjectOffering[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState(lockedBranchId);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingSectionId, setEditingSectionId] = useState("");
  const [editingSectionLabel, setEditingSectionLabel] = useState("");

  const currentYear = new Date().getFullYear();
  const [academicYearForm, setAcademicYearForm] = useState({
    name: `${currentYear}-${currentYear + 1}`,
    startDate: `${currentYear}-06-01`,
    endDate: `${currentYear + 1}-05-31`,
    isCurrent: true,
  });
  const [departmentForm, setDepartmentForm] = useState({ code: "", name: "" });
  const [sectionForm, setSectionForm] = useState({ academicPeriodId: "", label: "" });
  const [subjectForm, setSubjectForm] = useState({ code: "", name: "", subjectType: "THEORY" });
  const [offeringForm, setOfferingForm] = useState({
    sectionId: "",
    subjectId: "",
    subjectCategory: "THEORY",
    weeklyHours: "",
    internalMarks: "",
    externalMarks: "",
  });

  const effectiveBranchId = lockedBranchId || selectedBranchId;
  const canEditStructure = canManage && isEditing;
  const selectedBranch = useMemo(() => branches.find((branch) => branch.id === effectiveBranchId) ?? null, [branches, effectiveBranchId]);
  const selectedAcademicYear = useMemo(
    () => academicYears.find((year) => year.id === selectedAcademicYearId) ?? null,
    [academicYears, selectedAcademicYearId],
  );
  const selectedDepartment = useMemo(
    () => departments.find((department) => department.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId],
  );
  const selectedPeriod = useMemo(() => periods.find((period) => period.id === selectedPeriodId) ?? null, [periods, selectedPeriodId]);
  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? null,
    [sections, selectedSectionId],
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [branchData, academicYearData, periodData, subjectData] = await Promise.all([
        academicStructureApi.getBranches(),
        academicStructureApi.getAcademicYears(),
        academicStructureApi.getAcademicPeriods(),
        academicStructureApi.getSubjects(),
      ]);
      const branchId = lockedBranchId || selectedBranchId || (branchData.length === 1 ? branchData[0].id : "");
      const academicYearId =
        selectedAcademicYearId || academicYearData.find((year) => year.isCurrent)?.id || academicYearData[0]?.id || "";
      const [departmentData, sectionData, offeringData] = await Promise.all([
        academicStructureApi.getDepartments({ branchId: branchId || undefined, academicYearId: academicYearId || undefined }),
        academicStructureApi.getSections({
          branchId: branchId || undefined,
          academicYearId: academicYearId || undefined,
          departmentId: selectedDepartmentId || undefined,
        }),
        academicStructureApi.getSubjectOfferings({
          branchId: branchId || undefined,
          academicYearId: academicYearId || undefined,
          departmentId: selectedDepartmentId || undefined,
        }),
      ]);
      setBranches(branchData);
      setAcademicYears(academicYearData);
      setDepartments(departmentData.filter((department) => !department.isTemplate || department.tenantId));
      setPeriods(periodData);
      setSections(sectionData);
      setSubjects(subjectData);
      setOfferings(offeringData);
      if (!selectedBranchId && branchId) setSelectedBranchId(branchId);
      if (!selectedAcademicYearId && academicYearId) setSelectedAcademicYearId(academicYearId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load academic structure.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (lockedBranchId && selectedBranchId !== lockedBranchId) setSelectedBranchId(lockedBranchId);
  }, [lockedBranchId, selectedBranchId]);

  useEffect(() => {
    void load();
  }, [effectiveBranchId, selectedAcademicYearId, selectedDepartmentId]);

  useEffect(() => {
    if (selectedAcademicYearId && !academicYears.some((year) => year.id === selectedAcademicYearId)) {
      setSelectedAcademicYearId("");
      return;
    }
    if (!selectedAcademicYearId && academicYears.length > 0) {
      setSelectedAcademicYearId(academicYears.find((year) => year.isCurrent)?.id ?? academicYears[0].id);
    }
  }, [academicYears, selectedAcademicYearId]);

  useEffect(() => {
    if (selectedDepartmentId && !departments.some((department) => department.id === selectedDepartmentId)) {
      setSelectedDepartmentId("");
      return;
    }
    if (!selectedDepartmentId && departments.length > 0) setSelectedDepartmentId(departments[0].id);
  }, [departments, selectedDepartmentId]);

  useEffect(() => {
    if (selectedPeriodId && !periods.some((period) => period.id === selectedPeriodId)) {
      setSelectedPeriodId("");
      return;
    }
    if (!selectedPeriodId && periods.length > 0) setSelectedPeriodId(periods[0].id);
  }, [periods, selectedPeriodId]);

  const visibleSections = useMemo(
    () =>
      sections.filter(
        (section) =>
          (!selectedDepartmentId || section.departmentId === selectedDepartmentId) &&
          (!selectedPeriodId || section.academicPeriodId === selectedPeriodId),
      ),
    [sections, selectedDepartmentId, selectedPeriodId],
  );
  const visibleOfferings = useMemo(
    () =>
      offerings.filter(
        (offering) =>
          (!selectedDepartmentId || offering.departmentId === selectedDepartmentId) &&
          (!selectedPeriodId || offering.academicPeriodId === selectedPeriodId) &&
          (!selectedSectionId || offering.sectionId === selectedSectionId),
      ),
    [offerings, selectedDepartmentId, selectedPeriodId, selectedSectionId],
  );
  const filteredSubjects = useMemo(() => {
    const query = subjectSearch.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter((subject) => `${subject.code} ${subject.name}`.toLowerCase().includes(query));
  }, [subjects, subjectSearch]);

  useEffect(() => {
    if (selectedSectionId && !visibleSections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId("");
      return;
    }
    if (!selectedSectionId && visibleSections.length > 0) setSelectedSectionId(visibleSections[0].id);
  }, [selectedSectionId, visibleSections]);

  function openForm(mode: Exclude<FormMode, null>) {
    if (!canEditStructure) return;
    setFormError("");
    setFormMode(mode);
    if (mode === "academicYear") {
      const year = new Date().getFullYear();
      setAcademicYearForm({
        name: `${year}-${year + 1}`,
        startDate: `${year}-06-01`,
        endDate: `${year + 1}-05-31`,
        isCurrent: academicYears.length === 0,
      });
    }
    if (mode === "section") {
      setSectionForm({ academicPeriodId: selectedPeriodId || periods[0]?.id || "", label: "" });
      setEditingSectionId("");
      setEditingSectionLabel("");
    }
    if (mode === "offering") {
      setOfferingForm({
        sectionId: selectedSectionId,
        subjectId: "",
        subjectCategory: "THEORY",
        weeklyHours: "",
        internalMarks: "",
        externalMarks: "",
      });
    }
  }

  async function runSubmit(action: () => Promise<void>) {
    setSaving(true);
    setFormError("");
    try {
      await action();
      setFormMode(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save academic setup.");
    } finally {
      setSaving(false);
    }
  }

  async function submitAcademicYear(event: FormEvent) {
    event.preventDefault();
    await runSubmit(async () => {
      await academicStructureApi.createAcademicYear({
        name: academicYearForm.name,
        startDate: academicYearForm.startDate,
        endDate: academicYearForm.endDate,
        isCurrent: academicYearForm.isCurrent,
        status: "ACTIVE",
      });
    });
  }

  async function setCurrentAcademicYear(id: string) {
    await runSubmit(async () => {
      await academicStructureApi.setDefaultAcademicYear(id);
      setSelectedAcademicYearId(id);
    });
  }

  async function submitDepartment(event: FormEvent) {
    event.preventDefault();
    await runSubmit(async () => {
      await academicStructureApi.createDepartment({
        branchId: effectiveBranchId || null,
        academicYearId: selectedAcademicYearId,
        code: departmentForm.code,
        name: departmentForm.name,
        durationYears: 3,
      });
      setDepartmentForm({ code: "", name: "" });
    });
  }

  async function submitSection(event: FormEvent) {
    event.preventDefault();
    const periodId = sectionForm.academicPeriodId || selectedPeriodId;
    const period = periods.find((item) => item.id === periodId) ?? null;
    const rawLabel = sectionForm.label.trim();
    if (!effectiveBranchId || !selectedAcademicYearId || !selectedDepartmentId || !periodId || !selectedDepartment || !rawLabel) {
      setFormError("Select the academic year, department, academic period, and enter a section name.");
      return;
    }
    const sectionLabel = rawLabel.toUpperCase().replace(/\s+/g, "-");
    const name = `${selectedDepartment.code}-${sectionLabel}`;
    setSaving(true);
    setFormError("");
    try {
      await academicStructureApi.createSection({
        branchId: effectiveBranchId,
        academicYearId: selectedAcademicYearId,
        departmentId: selectedDepartmentId,
        academicPeriodId: periodId,
        name,
        capacity: null,
        metadata: {
          section_label: sectionLabel,
          academic_period_code: period?.code,
          generated_by: "academic_structure_section_manager",
        },
      });
      setSelectedPeriodId(periodId);
      setSectionForm((current) => ({ ...current, label: "" }));
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to add section.");
    } finally {
      setSaving(false);
    }
  }

  function labelFromSection(section: AcademicSection) {
    const prefix = selectedDepartment?.code ? `${selectedDepartment.code}-` : "";
    return prefix && section.name.startsWith(prefix) ? section.name.slice(prefix.length) : section.name;
  }

  async function saveSectionEdit(section: AcademicSection) {
    const rawLabel = editingSectionLabel.trim();
    if (!selectedDepartment || !rawLabel) {
      setFormError("Enter a section name.");
      return;
    }
    const sectionLabel = rawLabel.toUpperCase().replace(/\s+/g, "-");
    setSaving(true);
    setFormError("");
    try {
      await academicStructureApi.updateSection(section.id, {
        name: `${selectedDepartment.code}-${sectionLabel}`,
        metadata: {
          ...(section.metadata ?? {}),
          section_label: sectionLabel,
          updated_by: "academic_structure_section_manager",
        },
      });
      setEditingSectionId("");
      setEditingSectionLabel("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to update section.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSection(section: AcademicSection) {
    if (!window.confirm(`Delete section ${section.name}?`)) return;
    setSaving(true);
    setFormError("");
    try {
      await academicStructureApi.deleteSection(section.id);
      if (selectedSectionId === section.id) setSelectedSectionId("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to delete section.");
    } finally {
      setSaving(false);
    }
  }

  async function submitSubject(event: FormEvent) {
    event.preventDefault();
    await runSubmit(async () => {
      await academicStructureApi.createSubject(subjectForm);
      setSubjectForm({ code: "", name: "", subjectType: "THEORY" });
    });
  }

  async function submitOffering(event: FormEvent) {
    event.preventDefault();
    await runSubmit(async () => {
      const internalMarks = offeringForm.internalMarks ? Number(offeringForm.internalMarks) : null;
      const externalMarks = offeringForm.externalMarks ? Number(offeringForm.externalMarks) : null;
      await academicStructureApi.createSubjectOffering({
        sectionId: offeringForm.sectionId || selectedSectionId,
        subjectId: offeringForm.subjectId,
        subjectCategory: offeringForm.subjectCategory,
        weeklyHours: offeringForm.weeklyHours ? Number(offeringForm.weeklyHours) : null,
        internalMarks,
        externalMarks,
        totalMarks: internalMarks != null || externalMarks != null ? (internalMarks ?? 0) + (externalMarks ?? 0) : null,
        isMandatory: true,
      });
    });
  }

  async function deleteOffering(offering: SubjectOffering) {
    const label = offering.subjectCode ? `${offering.subjectCode} - ${offering.subjectName ?? ""}` : offering.subjectName ?? "this subject";
    if (!window.confirm(`Remove ${label} from ${offering.sectionName ?? "this section"}?`)) return;
    setSaving(true);
    setFormError("");
    try {
      await academicStructureApi.deleteSubjectOffering(offering.id);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to remove subject offering.");
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-teal-600">Polytechnic Foundation</p>
                <h1 className="mt-1 text-2xl font-black text-slate-950">Academic Structure</h1>
                <p className="mt-1 max-w-4xl text-sm text-slate-500">
                  Configure academic years, diploma departments, sections, and subject offerings through a guided setup flow.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canEditStructure && (
                <>
                  <TopButton icon={CalendarDays} label="Add Academic Year" tone="indigo" onClick={() => openForm("academicYear")} />
                  <TopButton icon={Building2} label="Add Department" tone="teal" onClick={() => openForm("department")} disabled={!selectedAcademicYear} />
                  <TopButton icon={BookOpen} label="Add Subject" tone="amber" onClick={() => openForm("subject")} />
                </>
              )}
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    setFormMode(null);
                    setIsEditing((current) => !current);
                  }}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black shadow-sm ${
                    isEditing
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                >
                  {isEditing ? <CheckCircle2 className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  {isEditing ? "Save & Lock Matrix" : "Edit Academic Matrix"}
                </button>
              )}
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        <SectionPanel
          title={`Academic Years & Active Session (${academicYears.length})`}
          icon={CalendarDays}
          action={
            canEditStructure ? (
              <button type="button" onClick={() => openForm("academicYear")} className={secondaryButtonCls}>
                <Plus className="h-4 w-4" />
                Add Academic Year
              </button>
            ) : null
          }
        >
          {academicYears.length === 0 ? (
            <EmptyState message="No academic years configured. Add the active academic year before creating departments." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {academicYears.map((year) => {
                const active = year.id === selectedAcademicYearId;
                return (
                  <button
                    key={year.id}
                    type="button"
                    onClick={() => setSelectedAcademicYearId(year.id)}
                    className={`rounded-md border p-4 text-left transition ${
                      active ? "border-indigo-400 bg-indigo-50 shadow-sm ring-1 ring-indigo-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-slate-950">{year.name}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          {year.startDate} to {year.endDate}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {year.isCurrent && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-black text-emerald-700">Active</span>}
                        {active && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                      </div>
                    </div>
                    {canEditStructure && !year.isCurrent && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          void setCurrentAcademicYear(year.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            void setCurrentAcademicYear(year.id);
                          }
                        }}
                        className="mt-4 inline-flex rounded-md bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-50"
                      >
                        Set active year
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </SectionPanel>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <SectionPanel
            title={`Departments (${departments.length})`}
            icon={Building2}
            action={
              canEditStructure ? (
                <button type="button" onClick={() => openForm("department")} disabled={!selectedAcademicYear} className="text-xs font-bold text-teal-700 disabled:cursor-not-allowed disabled:opacity-40">
                  Add
                </button>
              ) : null
            }
          >
            {!selectedAcademicYear ? (
              <EmptyState message="Add or select an academic year before configuring departments." />
            ) : departments.length === 0 ? (
              <EmptyState message={`No departments configured for ${selectedAcademicYear.name}.`} />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {departments.map((department) => {
                  const active = department.id === selectedDepartmentId;
                  return (
                    <div
                      key={department.id}
                      onClick={() => {
                        setSelectedDepartmentId(department.id);
                        setSelectedSectionId("");
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedDepartmentId(department.id);
                          setSelectedSectionId("");
                        }
                      }}
                      className={`w-full rounded-md border px-4 py-4 text-left transition ${
                        active ? "border-teal-400 bg-teal-50 shadow-sm ring-1 ring-teal-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-950">{codeName(department)}</p>
                          <p className="mt-1 text-xs text-slate-500">3 year diploma branch</p>
                        </div>
                      </div>
                      {canEditStructure && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedDepartmentId(department.id);
                            setSelectedSectionId("");
                            openForm("section");
                          }}
                          className="mt-3 rounded-md bg-slate-950 px-3 py-1.5 text-xs font-black text-white hover:bg-slate-800"
                        >
                          Sections
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionPanel>

          <SectionPanel
            title={`Subject Master (${subjects.length})`}
            icon={BookOpen}
            action={
              canEditStructure ? (
                <button type="button" onClick={() => openForm("subject")} className="text-xs font-bold text-teal-700">
                  Add
                </button>
              ) : null
            }
          >
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={subjectSearch}
                onChange={(event) => setSubjectSearch(event.target.value)}
                placeholder="Search subjects"
                className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            {filteredSubjects.length === 0 ? (
              <EmptyState message="No subjects found." />
            ) : (
              <div className="max-h-[430px] divide-y divide-slate-100 overflow-y-auto">
                {filteredSubjects.map((subject) => (
                  <div key={subject.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-950">{codeName(subject)}</p>
                      <p className="text-xs font-semibold uppercase text-slate-400">{subject.subjectType}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-black uppercase text-amber-700">Master</span>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        </div>

        <main className="space-y-5">
          <section className="rounded-lg bg-slate-950 px-5 py-5 text-white shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase text-teal-300">Catalog Workspace</p>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-black ${isEditing ? "bg-amber-400/15 text-amber-200" : "bg-slate-800 text-slate-300"}`}>
                    {isEditing ? "Editing Enabled" : "Read Only"}
                  </span>
                </div>
                <h2 className="mt-1 text-2xl font-black">{selectedDepartment ? codeName(selectedDepartment) : "Select a Department"}</h2>
                <p className="mt-1 text-sm text-slate-300">
                  {selectedAcademicYear
                    ? isEditing
                      ? `${selectedAcademicYear.name} is selected. You can now manage sections and subject offerings.`
                      : `${selectedAcademicYear.name} is selected. Click Edit Academic Matrix to modify structure.`
                    : "Create or select an academic year first."}
                </p>
              </div>
              {canEditStructure && (
                <div className="flex flex-wrap gap-2">
                  <TopButton icon={Layers} label="Manage Sections" tone="teal" onClick={() => openForm("section")} disabled={!selectedDepartment || !selectedAcademicYear || !effectiveBranchId} />
                  <TopButton icon={BookOpen} label="Assign Subject" tone="amber" onClick={() => openForm("offering")} disabled={!selectedSection} />
                </div>
              )}
            </div>
          </section>

          <SectionPanel title="Academic Periods & Sections" icon={Layers}>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {periods.map((period) => {
                const active = period.id === selectedPeriodId;
                return (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => {
                      setSelectedPeriodId(period.id);
                      setSelectedSectionId("");
                    }}
                    className={`shrink-0 rounded-md border px-4 py-2 text-sm font-bold ${
                      active ? "border-slate-950 bg-slate-950 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {periodLabel(period)}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-950">{periodLabel(selectedPeriod)}</h3>
                <p className="text-sm text-slate-500">
                  {selectedDepartment ? `${codeName(selectedDepartment)} | ${selectedAcademicYear?.name ?? "Academic year"}` : "Select a department to manage sections."}
                </p>
              </div>
              {canEditStructure && (
                <button type="button" onClick={() => openForm("section")} disabled={!selectedDepartment || !effectiveBranchId || !selectedAcademicYear} className={secondaryButtonCls}>
                  <Plus className="h-4 w-4" />
                  Manage Sections
                </button>
              )}
            </div>

            <div className="mt-4">
              {!selectedDepartment ? (
                <EmptyState message="Select a department first." />
              ) : visibleSections.length === 0 ? (
                <EmptyState message="No sections configured for this department and period." />
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {visibleSections.map((section) => {
                    const active = section.id === selectedSectionId;
                    const offeringCount = offerings.filter((offering) => offering.sectionId === section.id).length;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setSelectedSectionId(section.id)}
                        className={`rounded-md border p-4 text-left transition ${
                          active ? "border-teal-400 bg-teal-50 shadow-sm ring-1 ring-teal-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-black text-slate-950">{section.name}</p>
                            <p className="mt-1 truncate text-sm font-semibold text-slate-600">{section.name}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{offeringCount}</span>
                        </div>
                        <p className="mt-3 text-xs font-semibold text-slate-500">{periodLabel(selectedPeriod)}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </SectionPanel>

          <SectionPanel
            title={`Subject Offerings (${visibleOfferings.length})`}
            icon={BookOpen}
            action={
              canEditStructure ? (
                <button type="button" onClick={() => openForm("offering")} disabled={!selectedSection} className={secondaryButtonCls}>
                  <Plus className="h-4 w-4" />
                  Assign Subject
                </button>
              ) : null
            }
          >
            {!selectedSection ? (
              <EmptyState message="Select a section to view subject offerings." />
            ) : visibleOfferings.length === 0 ? (
              <EmptyState message="No subjects assigned to this section." />
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleOfferings.map((offering) => (
                  <div key={offering.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">
                        {offering.subjectCode} - {offering.subjectName}
                      </p>
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        {offering.subjectCategory} | {offering.totalMarks ? `${offering.totalMarks} marks` : "Marks not set"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                      <span>{offering.weeklyHours ?? "-"} hrs/week</span>
                      {canEditStructure && (
                        <button type="button" onClick={() => deleteOffering(offering)} className="text-rose-600 hover:text-rose-700">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        </main>
      </div>

      {formMode && (
        <SetupModal title={modalTitle(formMode)} onClose={() => setFormMode(null)}>
          {formError && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{formError}</div>}
          {formMode === "academicYear" && (
            <form onSubmit={submitAcademicYear} className="space-y-4">
              <Field label="Academic Year Name">
                <input value={academicYearForm.name} onChange={(event) => setAcademicYearForm({ ...academicYearForm, name: event.target.value })} placeholder="2026-2027" className={inputCls} required />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Start Date">
                  <input type="date" value={academicYearForm.startDate} onChange={(event) => setAcademicYearForm({ ...academicYearForm, startDate: event.target.value })} className={inputCls} required />
                </Field>
                <Field label="End Date">
                  <input type="date" value={academicYearForm.endDate} onChange={(event) => setAcademicYearForm({ ...academicYearForm, endDate: event.target.value })} className={inputCls} required />
                </Field>
              </div>
              <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={academicYearForm.isCurrent}
                  onChange={(event) => setAcademicYearForm({ ...academicYearForm, isCurrent: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Make this the active academic year
              </label>
              <ModalActions saving={saving} onCancel={() => setFormMode(null)} submitLabel="Add Academic Year" />
            </form>
          )}

          {formMode === "department" && (
            <form onSubmit={submitDepartment} className="space-y-4">
              <Field label="Department Code">
                <input value={departmentForm.code} onChange={(event) => setDepartmentForm({ ...departmentForm, code: event.target.value })} placeholder="CSE" className={inputCls} required />
              </Field>
              <Field label="Department Name">
                <input value={departmentForm.name} onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })} placeholder="Computer Engineering" className={inputCls} required />
              </Field>
              <div className="rounded-md border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800">
                Diploma duration is fixed at 3 years. Sections carry the scheme used for that academic year and period.
              </div>
              <ModalActions saving={saving} onCancel={() => setFormMode(null)} submitLabel="Add Department" />
            </form>
          )}

          {formMode === "section" && (
            <form onSubmit={submitSection} className="space-y-5">
              <div>
                <p className="text-sm font-bold text-slate-950">{selectedDepartment ? codeName(selectedDepartment) : "Select department"}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedAcademicYear?.name ?? "Academic year"} | {selectedBranch ? codeName(selectedBranch) : "Branch scope"}
                </p>
              </div>

              <div className="rounded-md border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold leading-relaxed text-teal-900">
                Add sections by entering only the section label, such as A, B, or C. Codes and display names are generated automatically for the selected academic period.
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {periods.map((period) => {
                  const periodSections = sections.filter(
                    (section) => section.departmentId === selectedDepartmentId && section.academicPeriodId === period.id,
                  );
                  return (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => setSectionForm((current) => ({ ...current, academicPeriodId: period.id }))}
                      className={`rounded-md border p-4 text-left transition ${
                        (sectionForm.academicPeriodId || selectedPeriodId) === period.id
                          ? "border-teal-400 bg-teal-50 ring-1 ring-teal-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-950">{periodLabel(period)}</p>
                          <p className="mt-1 text-xs font-semibold uppercase text-slate-400">{periodLabel(period)}</p>
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                          {periodSections.length}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {periodSections.length === 0 ? (
                          <span className="text-xs font-semibold text-slate-400">No sections</span>
                        ) : (
                          periodSections.map((section) => {
                            const editing = editingSectionId === section.id;
                            return (
                              <span key={section.id} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-black text-teal-700 ring-1 ring-teal-100">
                                {editing ? (
                                  <>
                                    <input
                                      value={editingSectionLabel}
                                      onChange={(event) => setEditingSectionLabel(event.target.value)}
                                      onClick={(event) => event.stopPropagation()}
                                      className="w-16 rounded border border-teal-200 px-1 py-0.5 text-xs outline-none focus:border-teal-500"
                                      autoFocus
                                    />
                                    <button type="button" onClick={(event) => { event.stopPropagation(); void saveSectionEdit(section); }} className="text-emerald-700">
                                      Save
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span>{section.name}</span>
                                    {canEditStructure && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setEditingSectionId(section.id);
                                            setEditingSectionLabel(labelFromSection(section));
                                          }}
                                          className="ml-1 text-slate-500 hover:text-slate-950"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            void deleteSection(section);
                                          }}
                                          className="text-rose-500 hover:text-rose-700"
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
                <Field label="Target Academic Period">
                  <select value={sectionForm.academicPeriodId || selectedPeriodId} onChange={(event) => setSectionForm({ ...sectionForm, academicPeriodId: event.target.value })} className={inputCls} required>
                    <option value="">Select academic period</option>
                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {periodLabel(period)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Section">
                  <input
                    value={sectionForm.label}
                    onChange={(event) => setSectionForm({ ...sectionForm, label: event.target.value })}
                    placeholder="A"
                    className={inputCls}
                    required
                    autoFocus
                  />
                </Field>
              </div>

              <ModalActions saving={saving} onCancel={() => setFormMode(null)} submitLabel="Add Section" />
            </form>
          )}

          {formMode === "subject" && (
            <form onSubmit={submitSubject} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Subject Code">
                  <input value={subjectForm.code} onChange={(event) => setSubjectForm({ ...subjectForm, code: event.target.value })} placeholder="ENG-MATH-I" className={inputCls} required />
                </Field>
                <Field label="Subject Type">
                  <select value={subjectForm.subjectType} onChange={(event) => setSubjectForm({ ...subjectForm, subjectType: event.target.value })} className={inputCls}>
                    {subjectCategories.map((category) => (
                      <option key={category} value={category}>
                        {category.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Subject Name">
                <input value={subjectForm.name} onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })} placeholder="Engineering Mathematics I" className={inputCls} required />
              </Field>
              <ModalActions saving={saving} onCancel={() => setFormMode(null)} submitLabel="Add Subject" />
            </form>
          )}

          {formMode === "offering" && (
            <form onSubmit={submitOffering} className="space-y-4">
              <Field label="Section">
                <select value={offeringForm.sectionId || selectedSectionId} onChange={(event) => setOfferingForm({ ...offeringForm, sectionId: event.target.value })} className={inputCls} required>
                  <option value="">Select section</option>
                  {visibleSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Subject">
                  <select value={offeringForm.subjectId} onChange={(event) => setOfferingForm({ ...offeringForm, subjectId: event.target.value })} className={inputCls} required>
                    <option value="">Select subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {codeName(subject)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Offering Type">
                  <select value={offeringForm.subjectCategory} onChange={(event) => setOfferingForm({ ...offeringForm, subjectCategory: event.target.value })} className={inputCls}>
                    {subjectCategories.map((category) => (
                      <option key={category} value={category}>
                        {category.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Weekly Hours">
                <input type="number" min="0" step="0.5" value={offeringForm.weeklyHours} onChange={(event) => setOfferingForm({ ...offeringForm, weeklyHours: event.target.value })} placeholder="Optional" className={inputCls} />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Internal Marks">
                  <input type="number" min="0" value={offeringForm.internalMarks} onChange={(event) => setOfferingForm({ ...offeringForm, internalMarks: event.target.value })} placeholder="Optional" className={inputCls} />
                </Field>
                <Field label="External Marks">
                  <input type="number" min="0" value={offeringForm.externalMarks} onChange={(event) => setOfferingForm({ ...offeringForm, externalMarks: event.target.value })} placeholder="Optional" className={inputCls} />
                </Field>
              </div>
              <ModalActions saving={saving} onCancel={() => setFormMode(null)} submitLabel="Assign Subject" />
            </form>
          )}
        </SetupModal>
      )}
    </div>
  );
}

function TopButton({
  icon: Icon,
  label,
  tone,
  onClick,
  disabled,
}: {
  icon: typeof CalendarDays;
  label: string;
  tone: "indigo" | "teal" | "amber";
  onClick: () => void;
  disabled?: boolean;
}) {
  const toneClass =
    tone === "indigo"
      ? "bg-indigo-500 hover:bg-indigo-600"
      : tone === "teal"
        ? "bg-teal-500 hover:bg-teal-600"
        : "bg-amber-500 hover:bg-amber-600";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function SectionPanel({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof Building2;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-teal-600" />
          <h2 className="truncate text-sm font-bold text-slate-950">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-semibold text-slate-400">
      {message}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function SetupModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-lg bg-white shadow-2xl sm:rounded-lg">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="text-base font-black text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ saving, onCancel, submitLabel }: { saving: boolean; onCancel: () => void; submitLabel: string }) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
      <button type="button" onClick={onCancel} className={secondaryButtonCls} disabled={saving}>
        Cancel
      </button>
      <button type="submit" className={primaryButtonCls} disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

function modalTitle(mode: Exclude<FormMode, null>) {
  const titles: Record<Exclude<FormMode, null>, string> = {
    academicYear: "Add Academic Year",
    department: "Add Department",
    section: "Manage Sections",
    subject: "Add Subject",
    offering: "Assign Subject Offering",
  };
  return titles[mode];
}
