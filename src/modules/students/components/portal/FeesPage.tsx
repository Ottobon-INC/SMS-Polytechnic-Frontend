import { Banknote, CheckCircle2, AlertCircle, CalendarClock, Download } from "lucide-react";

export function FeesPage() {
  // Mock data for fees since the backend endpoint isn't ready
  const feeSummary = {
    totalAssigned: 45000,
    totalPaid: 15000,
    totalDue: 30000,
  };
  
  const feeInstallments = [
    { id: 1, label: "Tuition Fee - Term 1", amount: 15000, dueDate: "2024-07-15", status: "PAID", paidDate: "2024-07-10" },
    { id: 2, label: "Tuition Fee - Term 2", amount: 15000, dueDate: "2024-11-15", status: "PENDING", paidDate: null },
    { id: 3, label: "Laboratory & Library Fee", amount: 15000, dueDate: "2024-12-15", status: "PENDING", paidDate: null },
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="sp-module-hero">
        <h1 className="sp-module-title">
          <Banknote className="h-6 w-6 text-teal-400" />
          Fees & Payments
        </h1>
        <p className="sp-module-desc">
          View your assigned fees, track payment history, and monitor outstanding dues.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="sp-card p-5 border-l-4 border-l-slate-400">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Total Assigned</p>
          <p className="mt-2 text-2xl font-black text-slate-100">{formatCurrency(feeSummary.totalAssigned)}</p>
          <p className="mt-1 text-xs text-slate-400">For Academic Year 2024-25</p>
        </div>
        <div className="sp-card p-5 border-l-4 border-l-emerald-500">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-500">Total Paid</p>
          <p className="mt-2 text-2xl font-black text-slate-100">{formatCurrency(feeSummary.totalPaid)}</p>
          <p className="mt-1 text-xs text-slate-400">Receipts generated</p>
        </div>
        <div className="sp-card p-5 border-l-4 border-l-rose-500 bg-rose-950/20">
          <p className="text-sm font-bold uppercase tracking-wider text-rose-400">Total Due</p>
          <p className="mt-2 text-2xl font-black text-rose-300">{formatCurrency(feeSummary.totalDue)}</p>
          <p className="mt-1 text-xs text-rose-400/80">Payable before deadlines</p>
        </div>
      </div>

      {/* Installments Table */}
      <div className="sp-card overflow-hidden">
        <div className="border-b border-slate-700 bg-slate-800/50 px-5 py-4">
          <h2 className="text-base font-bold text-slate-100">Fee Installments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="sp-table w-full min-w-[700px]">
            <thead>
              <tr>
                <th>Fee Head</th>
                <th className="text-right">Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {feeInstallments.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="font-semibold text-slate-200 py-3">{inst.label}</td>
                  <td className="text-right font-black text-slate-100 py-3">{formatCurrency(inst.amount)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {new Date(inst.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </td>
                  <td className="py-3">
                    {inst.status === "PAID" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Paid on {inst.paidDate}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-xs font-bold text-rose-400">
                        <AlertCircle className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="text-right py-3 pr-4">
                    {inst.status === "PAID" ? (
                      <button className="text-teal-400 hover:text-teal-300 transition-colors" title="Download Receipt">
                        <Download className="h-5 w-5 ml-auto" />
                      </button>
                    ) : (
                      <button className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-500 transition-colors">
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
