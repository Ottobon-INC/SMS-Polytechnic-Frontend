import { ManualAddStudentForm } from "../components/ManualAddStudentForm";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";

export function ManualAddStudentPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-[#f6f8fb] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <button
            onClick={() => navigate("/imports")}
            className="mb-5 flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Student Import Center
          </button>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 ring-1 ring-teal-100">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-teal-600">Single Student Enrollment</p>
              <h1 className="mt-1 text-2xl font-black text-slate-950">Manual Add Student</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                Create one student, attach guardian details, and place the student into the selected section.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-lg bg-slate-950 px-5 py-5 text-white shadow-sm">
          <p className="text-xs font-bold uppercase text-teal-300">Placement Flow</p>
          <h2 className="mt-1 text-2xl font-black">Academic Year → Department → Year/Semester → Section</h2>
          <p className="mt-1 text-sm text-slate-300">
            Required dropdowns are loaded from the active Polytechnic academic setup.
          </p>
        </section>

        <ManualAddStudentForm />
      </div>
    </div>
  );
}
