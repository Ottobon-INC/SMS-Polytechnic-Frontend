import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpenCheck, IndianRupee, UploadCloud, UserPlus, Lightbulb, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../authentication/providers/AuthProvider";

export function StudentImportCenter() {
  const navigate = useNavigate();
  const auth = useAuth();
  const canUpload = auth.hasPermission("import.upload");
  const canViewFees = auth.hasPermission("fee.view");

  return (
    <div className="min-h-full bg-[#f6f8fb] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 ring-1 ring-teal-100">
              <BookOpenCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-teal-600">Student Operations</p>
              <h1 className="mt-1 text-2xl font-black text-slate-950">Student Onboarding</h1>
              <p className="mt-1 max-w-4xl text-sm text-slate-500">
                Add one student manually or import student records using the Polytechnic template.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-lg bg-slate-950 px-5 py-5 text-white shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-teal-300">Onboarding Workspace</p>
              <h2 className="mt-1 text-2xl font-black">Create and Validate Student Records</h2>
              <p className="mt-1 text-sm text-slate-300">
                Academic placement follows Branch, Academic Year, Department, Year/Semester, and Section.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-teal-500/15 px-3 py-2 text-xs font-black uppercase text-teal-100 ring-1 ring-teal-300/20">
                Department Based
              </span>
              <span className="rounded-md bg-amber-500/15 px-3 py-2 text-xs font-black uppercase text-amber-100 ring-1 ring-amber-300/20">
                Scheme Snapshot
              </span>
            </div>
          </div>
        </section>

        {!canUpload && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Your role can view imports, but student onboarding actions require import.upload permission.
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ActionCard
            icon={<UserPlus className="h-5 w-5" />}
            title="Manual Add Student"
            description="Enroll one student with academic placement, contact details, and guardian information."
            action="Add Student"
            color="slate"
            disabled={!canUpload}
            onClick={() => navigate("/imports/manual")}
          />
          <ActionCard
            icon={<UploadCloud className="h-5 w-5" />}
            title="Student Template Import"
            description="Upload multiple students through the approved Excel template and validation preview."
            action="Import Students"
            color="emerald"
            disabled={!canUpload}
            onClick={() => navigate("/imports/template")}
          />
          <ActionCard
            icon={<IndianRupee className="h-5 w-5" />}
            title="Fee Data Import"
            description="Prepare fee accounts for active enrollments using the bulk fee setup workflow."
            action="Import Fees"
            color="teal"
            disabled={!canUpload || !canViewFees}
            onClick={() => navigate("/imports/fees")}
          />
        </section>

        <section className="grid grid-cols-1 gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-12">
          <div className="md:col-span-8">
            <h3 className="mb-4 text-sm font-black uppercase text-slate-950">Recommended Flow</h3>
            <div className="grid gap-3">
              <GuideStep n="01" title="Confirm academic setup" text="Academic year, departments, Year/Semester values, and sections should exist before onboarding students." />
              <GuideStep n="02" title="Choose manual or template import" text="Use manual add for one student. Use the Excel template for bulk admissions or large corrections." />
              <GuideStep n="03" title="Validate before records are created" text="Template uploads create a preview first. Student records are saved only after the validated import is committed." />
            </div>
          </div>

          <div className="md:col-span-4">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase text-slate-950">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Before You Import
            </h3>
            <ul className="space-y-3">
              {[
                "Keep admission numbers unique",
                "Use Academic Year and Department Code",
                "Use Year/Semester",
                "Do not modify template headers",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-sm font-medium leading-tight text-slate-600">{tip}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs font-semibold leading-relaxed text-blue-800">
                The current Polytechnic template uses Admission Number, Student Name, placement, and guardian contact fields only.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  action,
  color,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  color: "slate" | "emerald" | "teal";
  disabled?: boolean;
  onClick: () => void;
}) {
  const colorClasses = {
    slate: "bg-slate-950 text-white group-hover:bg-slate-800",
    emerald: "bg-emerald-600 text-white group-hover:bg-emerald-700",
    teal: "bg-teal-600 text-white group-hover:bg-teal-700",
  };
  const actionClasses = {
    slate: "text-slate-950",
    emerald: "text-emerald-700",
    teal: "text-teal-700",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-md transition ${colorClasses[color]}`}>
        {icon}
      </div>
      <h2 className="text-base font-black text-slate-950">{title}</h2>
      <p className="mt-2 min-h-[60px] text-sm leading-relaxed text-slate-500">{description}</p>
      <div className={`mt-5 flex items-center gap-1.5 text-sm font-black transition-all group-hover:gap-2.5 ${actionClasses[color]}`}>
        {action}
        <ArrowRight className="h-4 w-4" />
      </div>
    </button>
  );
}

function GuideStep({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="flex gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <span className="mt-0.5 text-3xl font-black text-slate-200">{n}</span>
      <div>
        <h4 className="text-sm font-black text-slate-950">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p>
      </div>
    </div>
  );
}
