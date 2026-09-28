import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "../utils/zodResolver";
import { manualAddSchema, ManualAddStudentFormData } from "../schemas/manualAddSchema";
import { useImportsApi } from "../hooks/useImportsApi";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  User,
  Users,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../authentication/providers/AuthProvider";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    // Strip raw technical traces
    const msg = error.message;
    if (msg.includes("duplicate") || msg.includes("already exists")) {
      return "A student with this admission number already exists in the selected scope.";
    }
    if (msg.includes("Unauthorized") || msg.includes("403")) {
      return "You do not have permission to add a student to this branch.";
    }
    return msg;
  }
  return fallback;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER: "Father",
  MOTHER: "Mother",
  LEGAL_GUARDIAN: "Legal Guardian",
  RELATIVE: "Relative",
  SPONSOR: "Sponsor",
  OTHER: "Other",
};

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

function formatDepartmentLabel(department?: { code?: string; name?: string; displayLabel?: string | null }): string {
  if (!department) {
    return "";
  }
  if (department.displayLabel) {
    return department.displayLabel;
  }
  if (department.code && department.name) {
    if (department.name.startsWith(`${department.code} -`)) {
      return department.name;
    }
    return `${department.code} - ${department.name}`;
  }
  return department.code || department.name || "";
}

function cleanManualPayload(data: ManualAddStudentFormData): ManualAddStudentFormData {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value === "" ? null : value])
  ) as ManualAddStudentFormData;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SectionCardProps {
  step: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ step, icon, title, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {step}
        </span>
        <div className="text-slate-400">{icon}</div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, required, error, children, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed hover:border-slate-300 shadow-sm";

function SelectField({
  value,
  onChange,
  disabled,
  loading,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`${inputCls} appearance-none pr-9`}
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

interface SuccessData {
  studentNumber: string;
  // Form data we already have
  formData: ManualAddStudentFormData;
  // Resolved names from loaded options
  branchName?: string;
  academicYearName?: string;
  academicPeriodName?: string;
  departmentName?: string;
  sectionName?: string;
}

function SuccessScreen({
  data,
  onAddAnother,
}: {
  data: SuccessData;
  onAddAnother: () => void;
}) {
  const navigate = useNavigate();
  const { formData } = data;

  return (
    <div className="space-y-4">
      {/* Success header */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-emerald-900">Student Added Successfully</h2>
          <p className="text-sm text-emerald-700 mt-0.5">
            The student has been enrolled and a guardian record has been created.
          </p>
        </div>
      </div>

      {/* Student */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
          <User className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student</h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryField label="Full Name" value={formData.student_name} />
          <SummaryField label="Student Number" value={data.studentNumber} highlight />
          <SummaryField label="Admission Number" value={formData.admission_number} />
          <SummaryField label="Date of Birth" value={formData.date_of_birth} />
          <SummaryField label="Gender" value={GENDER_LABELS[formData.gender] ?? formData.gender} />
          <SummaryField label="Admission Date" value={formData.admission_date} />
        </div>
      </div>

      {/* Academic Placement */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
          <GraduationCap className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Placement</h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.branchName && <SummaryField label="Branch" value={data.branchName} />}
          {data.academicYearName && <SummaryField label="Academic Year" value={data.academicYearName} />}
          {data.departmentName && <SummaryField label="Department" value={data.departmentName} />}
          {data.academicPeriodName && <SummaryField label="Year/Semester" value={data.academicPeriodName} />}
          {data.sectionName && <SummaryField label="Section" value={data.sectionName} />}
        </div>
      </div>

      {/* Guardian */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
          <Users className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Guardian</h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryField label="Name" value={formData.guardian_name} />
          <SummaryField
            label="Relationship"
            value={RELATIONSHIP_LABELS[formData.relationship_type] ?? formData.relationship_type}
          />
          <SummaryField label="Phone" value={formData.guardian_phone} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onAddAnother}
          className="flex-1 sm:flex-none px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          Add Another Student
        </button>
        <button
          onClick={() => navigate("/imports")}
          className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all"
        >
          Back to Student Import
        </button>
      </div>
    </div>
  );
}

function SummaryField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-emerald-700" : "text-slate-900"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function ManualAddStudentForm() {
  const auth = useAuth();
  const { useBranches, useAcademicYears, useAcademicPeriods, useDepartments, useSections, useManualAddStudent } =
    useImportsApi();

  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ManualAddStudentFormData>({
    resolver: zodResolver(manualAddSchema),
    defaultValues: {
      student_name: "",
      date_of_birth: "",
      gender: "MALE",
      admission_number: "",
      branch_id: "",
      academic_year_id: "",
      department_id: "",
      academic_period_id: "",
      section_id: "",
      guardian_name: "",
      guardian_phone: "",
      relationship_type: "FATHER",
      admission_date: "",
    },
  });

  const branchId = watch("branch_id");
  const academicYearId = watch("academic_year_id");
  const departmentId = watch("department_id");
  const academicPeriodId = watch("academic_period_id");

  const { data: branches, isLoading: loadingBranches } = useBranches();
  const { data: academicYears, isLoading: loadingYears } = useAcademicYears();
  const { data: academicPeriods, isLoading: loadingPeriods } = useAcademicPeriods();
  const { data: departmentsRaw, isLoading: loadingDepartments } = useDepartments(branchId, academicYearId);
  const { data: sections, isLoading: loadingSections } = useSections(branchId, academicYearId, departmentId, academicPeriodId);

  const hodDepartmentMatch = auth.activeContext?.role_codes.includes("HOD") && auth.appUser?.email
    ? auth.appUser.email.match(/^hod\.([a-z0-9_]+)@/)
    : null;
  const hodDepartment = hodDepartmentMatch ? hodDepartmentMatch[1].toUpperCase() : null;

  const departments = useMemo(() => {
    if (!departmentsRaw) return [];
    if (!hodDepartment) return departmentsRaw;
    return departmentsRaw.filter(d => d.code === hodDepartment || formatDepartmentLabel(d).toUpperCase().includes(hodDepartment));
  }, [departmentsRaw, hodDepartment]);

  // Auto-select branch if only one
  useEffect(() => {
    if (branches && branches.length === 1 && !branchId) {
      reset({ ...watch(), branch_id: branches[0].id });
    }
  }, [branches, branchId, reset, watch]);

  // Auto-select department if only one (useful for HODs)
  useEffect(() => {
    if (departments && departments.length === 1 && !departmentId) {
      setValue("department_id", departments[0].id);
    }
  }, [departments, departmentId, setValue]);

  // Cascade resets — preserve existing logic exactly
  useEffect(() => {
    if (branchId) {
      setValue("academic_period_id", "");
      setValue("section_id", "");
    }
  }, [branchId, setValue]);

  useEffect(() => {
    if (academicYearId) {
      setValue("academic_period_id", "");
      setValue("section_id", "");
    }
  }, [academicYearId, setValue]);

  useEffect(() => {
    if (departmentId) {
      setValue("academic_period_id", "");
      setValue("section_id", "");
    }
  }, [departmentId, setValue]);

  useEffect(() => {
    if (academicPeriodId) {
      setValue("section_id", "");
    }
  }, [academicPeriodId, setValue]);

  const manualAddMutation = useManualAddStudent();

  const onSubmit = (data: ManualAddStudentFormData) => {
    setSubmitError("");
    manualAddMutation.mutate(cleanManualPayload(data), {
      onSuccess: (response) => {
        // Resolve display names from already-loaded options
        const branchName = branches?.find((b) => b.id === data.branch_id)?.name;
        const academicYearName = academicYears?.find((y) => y.id === data.academic_year_id)?.name;
        const departmentName = formatDepartmentLabel(
          departments?.find((d) => d.id === data.department_id)
        );
        const academicPeriodName = academicPeriods?.find((p) => p.id === data.academic_period_id)?.name;
        const sectionName = sections?.find((s) => s.id === data.section_id)?.name;

        setSuccessData({
          studentNumber: response.student_code ?? data.admission_number,
          formData: data,
          branchName,
          academicYearName,
          academicPeriodName,
          departmentName,
          sectionName,
        });
      },
      onError: (error: unknown) => {
        setSubmitError(getErrorMessage(error, "Failed to add student. Please try again."));
      },
    });
  };

  const handleAddAnother = () => {
    setSuccessData(null);
    setSubmitError("");
    // Preserve branch only if single-branch (staff efficiency)
    const currentBranch = branches && branches.length === 1 ? branches[0].id : "";
    reset({
      student_name: "",
      date_of_birth: "",
      gender: "MALE",
      admission_number: "",
      branch_id: currentBranch,
      academic_year_id: "",
      department_id: "",
      academic_period_id: "",
      section_id: "",
      guardian_name: "",
      guardian_phone: "",
      relationship_type: "FATHER",
      admission_date: "",
    });
  };

  if (successData) {
    return <SuccessScreen data={successData} onAddAnother={handleAddAnother} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Unable to Create Student</p>
            <p className="text-sm text-red-700 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Step 1 — Academic Placement */}
      <SectionCard step={1} icon={<GraduationCap className="w-4 h-4" />} title="Academic Placement">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Branch" required error={errors.branch_id?.message}>
            <SelectField
              value={branchId}
              onChange={(v) => setValue("branch_id", v)}
              disabled={branches?.length === 1}
              loading={loadingBranches}
            >
              <option value="">Select Branch</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </SelectField>
            {branches?.length === 1 && (
              <input type="hidden" {...register("branch_id")} />
            )}
          </Field>

          <Field label="Academic Year" required error={errors.academic_year_id?.message}>
            <SelectField
              value={academicYearId}
              onChange={(v) => setValue("academic_year_id", v)}
              loading={loadingYears}
            >
              <option value="">Select Academic Year</option>
              {academicYears?.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </SelectField>
          </Field>

          <Field label="Department" required error={errors.department_id?.message}>
            <SelectField
              value={departmentId}
              onChange={(v) => setValue("department_id", v)}
              disabled={departments?.length === 1}
              loading={loadingDepartments}
            >
              <option value="">Select Department</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {formatDepartmentLabel(d)}
                </option>
              ))}
            </SelectField>
          </Field>

          <Field label="Year/Semester" required error={errors.academic_period_id?.message}>
            <SelectField
              value={academicPeriodId}
              onChange={(v) => setValue("academic_period_id", v)}
              disabled={false}
              loading={loadingPeriods}
            >
              <option value="">Select Year/Semester</option>
              {academicPeriods?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </SelectField>
          </Field>

          <Field label="Section" required error={errors.section_id?.message}>
            <SelectField
              value={watch("section_id")}
              onChange={(v) => setValue("section_id", v)}
              disabled={!branchId || !academicYearId || !departmentId || !academicPeriodId}
              loading={loadingSections}
            >
              <option value="">
                {!branchId || !academicYearId || !departmentId || !academicPeriodId
                  ? "Complete academic placement first"
                  : "Select Section"}
              </option>
              {sections?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
          </Field>
        </div>
      </SectionCard>

      {/* Step 2 — Student Information */}
      <SectionCard step={2} icon={<User className="w-4 h-4" />} title="Student Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Student Name" required error={errors.student_name?.message}>
            <div className="sm:col-span-2">
              <input
                type="text"
                {...register("student_name")}
                placeholder="Full legal name"
                className={inputCls}
              />
            </div>
          </Field>

          <Field label="Admission Number" required error={errors.admission_number?.message}>
            <input
              type="text"
              {...register("admission_number")}
              placeholder="e.g. ADM-2026-001"
              className={inputCls}
            />
          </Field>

          <Field label="Date of Birth" required error={errors.date_of_birth?.message}>
            <input
              type="date"
              {...register("date_of_birth")}
              max={new Date().toISOString().split("T")[0]}
              className={inputCls}
            />
          </Field>

          <Field label="Gender" required error={errors.gender?.message}>
            <SelectField
              value={watch("gender")}
              onChange={(v) => setValue("gender", v as "MALE" | "FEMALE" | "OTHER")}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </SelectField>
          </Field>

          <Field label="Admission Date" required error={errors.admission_date?.message}>
            <input
              type="date"
              {...register("admission_date")}
              className={inputCls}
            />
          </Field>

        </div>
      </SectionCard>

      {/* Step 3 — Guardian Information */}
      <SectionCard step={3} icon={<Users className="w-4 h-4" />} title="Guardian Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Guardian Name" required error={errors.guardian_name?.message}>
            <input
              type="text"
              {...register("guardian_name")}
              placeholder="Full name"
              className={inputCls}
            />
          </Field>

          <Field label="Relationship" required error={errors.relationship_type?.message}>
            <SelectField
              value={watch("relationship_type")}
              onChange={(v) =>
                setValue(
                  "relationship_type",
                  v as "FATHER" | "MOTHER" | "LEGAL_GUARDIAN" | "RELATIVE" | "SPONSOR" | "OTHER"
                )
              }
            >
              {Object.entries(RELATIONSHIP_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </SelectField>
          </Field>

          <Field label="Phone Number" required error={errors.guardian_phone?.message}>
            <input
              type="tel"
              {...register("guardian_phone")}
              placeholder="Enter guardian phone number"
              className={inputCls}
            />
          </Field>

        </div>
      </SectionCard>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2.5 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Student…
            </>
          ) : (
            "Create Student"
          )}
        </button>
      </div>
    </form>
  );
}
