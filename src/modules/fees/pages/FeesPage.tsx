import { FormEvent, useEffect, useMemo, useState } from "react";
import { CreditCard, FileText, IndianRupee, Loader2, Plus, ReceiptText, WalletCards } from "lucide-react";
import { feesApi } from "../api/feesApi";
import type { FeeAccountListItem, FeeEnrollmentOption, FeeLedgerResponse } from "../types";
import { useAuth } from "../../authentication/providers/AuthProvider";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const buttonCls =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60";

function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

function contextLabel(item: FeeAccountListItem | FeeEnrollmentOption) {
  return [
    item.academic_year,
    item.department_code,
    item.academic_period_code,
    item.section_name,
  ]
    .filter(Boolean)
    .join(" / ");
}

function FinanceMetric({ label, value, tone }: { label: string; value: string; tone: "slate" | "emerald" | "rose" }) {
  const tones = {
    slate: "text-white",
    emerald: "text-emerald-200",
    rose: "text-rose-200",
  };
  return (
    <div className="rounded-md bg-white/10 px-3 py-2 ring-1 ring-white/10">
      <p className={`text-sm font-black ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase text-slate-300">{label}</p>
    </div>
  );
}

export function FeesPage() {
  const auth = useAuth();
  const canAssignFees = auth.hasPermission("fee.basic_assign");
  const canRecordPayment = auth.hasPermission("fee.payment_record");

  const [accounts, setAccounts] = useState<FeeAccountListItem[]>([]);
  const [options, setOptions] = useState<FeeEnrollmentOption[]>([]);
  const [ledger, setLedger] = useState<FeeLedgerResponse | null>(null);
  const [paymentAccount, setPaymentAccount] = useState<FeeAccountListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const hodDepartmentMatch = auth.activeContext?.role_codes.includes("HOD") && auth.appUser?.email
    ? auth.appUser.email.match(/^hod\.([a-z0-9_]+)@/)
    : null;
  const hodDepartment = hodDepartmentMatch ? hodDepartmentMatch[1].toUpperCase() : null;

  const allowedAccounts = useMemo(() => {
    if (!hodDepartment) return accounts;
    return accounts.filter(a => a.department_code === hodDepartment || a.department_name?.toUpperCase().includes(hodDepartment));
  }, [accounts, hodDepartment]);

  const totals = useMemo(
    () =>
      allowedAccounts.reduce(
        (acc, account) => ({
          total: acc.total + Number(account.total_amount),
          paid: acc.paid + Number(account.paid_amount),
          balance: acc.balance + Number(account.balance_amount),
        }),
        { total: 0, paid: 0, balance: 0 }
      ),
    [allowedAccounts]
  );

  const filteredAccounts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allowedAccounts;
    return allowedAccounts.filter((account) =>
      [
        account.student_name,
        account.admission_number,
        account.fee_structure_name,
        account.academic_year,
        account.department_code,
        account.academic_period_code,
        account.section_name,
        account.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [allowedAccounts, query]);

  const [accountForm, setAccountForm] = useState({
    enrollmentId: "",
    feeStructureName: "Annual Fee",
    totalAmount: "",
    scholarshipAmount: "0",
    concessionAmount: "0",
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMode: "UPI" as const,
    receiptDate: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
  });

  async function loadData() {
    setError(null);
    const [accountData, optionData] = await Promise.all([
      feesApi.listAccounts(),
      canAssignFees ? feesApi.listSetupOptions() : Promise.resolve([] as FeeEnrollmentOption[]),
    ]);
    
    setAccounts(accountData);
    
    // Filter options for HOD as well
    const allowedOptions = hodDepartment 
      ? optionData.filter(o => o.department_code === hodDepartment || o.department_name?.toUpperCase().includes(hodDepartment))
      : optionData;
    setOptions(allowedOptions);
    
    setAccountForm((prev) => ({ ...prev, enrollmentId: prev.enrollmentId || allowedOptions[0]?.enrollment_id || "" }));
  }

  useEffect(() => {
    setLoading(true);
    loadData()
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load fee data."))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAssignFees) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const selected = options.find((option) => option.enrollment_id === accountForm.enrollmentId);
    try {
      await feesApi.createAccount({
        enrollment_id: accountForm.enrollmentId,
        academic_year_id: selected?.academic_year_id ?? null,
        fee_structure_name: accountForm.feeStructureName,
        assigned_fee_amount: accountForm.totalAmount,
        scholarship_amount: accountForm.scholarshipAmount || "0",
        concession_amount: accountForm.concessionAmount || "0",
      });
      setSuccess("Fee account created.");
      setAccountForm((prev) => ({ ...prev, totalAmount: "" }));
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fee account.");
    } finally {
      setSaving(false);
    }
  }

  async function openLedger(account: FeeAccountListItem) {
    setError(null);
    setLedger(await feesApi.getLedger(account.id));
  }

  function openPayment(account: FeeAccountListItem) {
    if (!canRecordPayment) return;
    setPaymentAccount(account);
    setPaymentForm((prev) => ({ ...prev, amount: account.balance_amount }));
  }

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentAccount) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await feesApi.postPayment(paymentAccount.id, {
        amount: paymentForm.amount,
        payment_mode: paymentForm.paymentMode,
        receipt_date: paymentForm.receiptDate,
        external_reference: paymentForm.reference || null,
        notes: paymentForm.notes || null,
      });
      setSuccess(`Payment posted. Receipt ${response.receipt_number}.`);
      setPaymentAccount(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <IndianRupee className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-emerald-600">Polytechnic Finance</p>
              <h1 className="mt-1 text-2xl font-black text-slate-950">Fees</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                Manage fee accounts, payment receipts, and balances from active Polytechnic enrollments.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-lg bg-slate-950 px-5 py-5 text-white shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-emerald-300">Fee Workspace</p>
              <h2 className="mt-1 text-2xl font-black">Accounts and Receipts</h2>
              <p className="mt-1 text-sm text-slate-300">
                Totals are read from fee accounts: total, paid, and balance amounts.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[420px]">
              <FinanceMetric label="Total" value={money(totals.total)} tone="slate" />
              <FinanceMetric label="Paid" value={money(totals.paid)} tone="emerald" />
              <FinanceMetric label="Balance" value={money(totals.balance)} tone="rose" />
            </div>
          </div>
        </section>

        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

        {canAssignFees ? (
          <form onSubmit={handleCreateAccount} className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-700" />
                <h2 className="text-sm font-black uppercase text-slate-900">Create Fee Account</h2>
              </div>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{options.length} pending enrollments</span>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-5">
              <select className={inputCls} required value={accountForm.enrollmentId} onChange={(e) => setAccountForm({ ...accountForm, enrollmentId: e.target.value })}>
                <option value="">Enrollment</option>
                {options.map((option) => (
                  <option key={option.enrollment_id} value={option.enrollment_id}>
                    {option.student_name} · {contextLabel(option)}
                  </option>
                ))}
              </select>
              <input className={inputCls} value={accountForm.feeStructureName} onChange={(e) => setAccountForm({ ...accountForm, feeStructureName: e.target.value })} placeholder="Fee structure" />
              <input className={inputCls} required type="number" min="0" step="0.01" value={accountForm.totalAmount} onChange={(e) => setAccountForm({ ...accountForm, totalAmount: e.target.value })} placeholder="Total amount" />
              <input className={inputCls} type="number" min="0" step="0.01" value={accountForm.scholarshipAmount} onChange={(e) => setAccountForm({ ...accountForm, scholarshipAmount: e.target.value })} placeholder="Scholarship" />
              <input className={inputCls} type="number" min="0" step="0.01" value={accountForm.concessionAmount} onChange={(e) => setAccountForm({ ...accountForm, concessionAmount: e.target.value })} placeholder="Concession" />
              <button className={`${buttonCls} bg-emerald-600 hover:bg-emerald-700 md:col-span-5`} disabled={saving || !options.length}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
                Create Account
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Your role can view fee accounts. Creating accounts requires fee.basic_assign permission.
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-sm font-bold uppercase text-slate-800">Fee Accounts</h2>
            <input className={`${inputCls} md:max-w-sm`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student, department, section or status" />
          </div>
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading fee accounts...</div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No fee accounts found.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Context</th>
                  <th className="px-4 py-3">Fee Structure</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{account.student_name}</p>
                      <p className="text-xs text-slate-500">{account.admission_number || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{contextLabel(account) || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{account.fee_structure_name}</td>
                    <td className="px-4 py-3 text-right font-mono">{money(account.total_amount)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">{money(account.paid_amount)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">{money(account.balance_amount)}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{account.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openLedger(account)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          <FileText className="h-3 w-3" /> Ledger
                        </button>
                        {canRecordPayment && (
                          <button type="button" onClick={() => openPayment(account)} disabled={Number(account.balance_amount) <= 0} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                            <CreditCard className="h-3 w-3" /> Payment
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

        {ledger && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-800"><ReceiptText className="h-4 w-4" /> Ledger</h2>
              <button type="button" onClick={() => setLedger(null)} className="text-sm font-semibold text-slate-500 hover:text-slate-900">Close</button>
            </div>
            <div className="divide-y divide-slate-100">
              {ledger.entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.entry_type}</p>
                    <p className="text-xs text-slate-500">{entry.payment_mode || "-"} · {entry.reference_number || "-"}</p>
                  </div>
                  <p className="font-mono font-bold text-slate-950">{money(entry.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {paymentAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <form onSubmit={handlePayment} className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
              <h2 className="text-lg font-bold text-slate-950">Record Payment</h2>
              <p className="mt-1 text-sm text-slate-600">{paymentAccount.student_name} · Balance {money(paymentAccount.balance_amount)}</p>
              <div className="mt-4 grid gap-3">
                <input className={inputCls} required type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                <select className={inputCls} value={paymentForm.paymentMode} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value as typeof paymentForm.paymentMode })}>
                  {["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"].map((mode) => <option key={mode} value={mode}>{mode.replaceAll("_", " ")}</option>)}
                </select>
                <input className={inputCls} type="date" value={paymentForm.receiptDate} onChange={(e) => setPaymentForm({ ...paymentForm, receiptDate: e.target.value })} />
                <input className={inputCls} value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="Reference" />
                <textarea className={inputCls} value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Notes" />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setPaymentAccount(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                <button className={buttonCls} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Post Payment</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
