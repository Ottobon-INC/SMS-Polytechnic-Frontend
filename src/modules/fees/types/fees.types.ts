export interface FeeAccountListItem {
  id: string;
  tenant_id: string;
  branch_id: string;
  student_id: string;
  enrollment_id: string;
  academic_year_id: string;
  fee_structure_name: string;
  admission_number: string | null;
  student_name: string;
  branch_name: string | null;
  academic_year: string | null;
  department_code?: string | null;
  department_name?: string | null;
  academic_period_code?: string | null;
  academic_period_name?: string | null;
  section_name?: string | null;
  section_code?: string | null;
  total_amount: string;
  paid_amount: string;
  balance_amount: string;
  status: string;
}

export interface FeeEnrollmentOption {
  enrollment_id: string;
  student_id: string;
  branch_id: string;
  academic_year_id: string;
  admission_number: string | null;
  student_name: string;
  branch_name: string | null;
  academic_year: string;
  department_code?: string | null;
  department_name?: string | null;
  academic_period_code?: string | null;
  academic_period_name?: string | null;
  section_name?: string | null;
  section_code?: string | null;
}

export interface FeeAccountCreatePayload {
  enrollment_id: string;
  academic_year_id?: string | null;
  fee_structure_name: string;
  assigned_fee_amount: string;
  scholarship_amount: string;
  concession_amount: string;
}

export interface FeePaymentCreatePayload {
  amount: string;
  payment_mode: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "CARD" | "OTHER";
  receipt_date: string;
  external_reference?: string | null;
  payment_period_label?: string | null;
  installment_number?: number | null;
  notes?: string | null;
}

export interface FeePaymentPostResponse {
  fee_account: FeeAccountListItem;
  ledger_entry_id: string;
  receipt_number: string;
}

export interface FeeLedgerEntryItem {
  id: string;
  fee_account_id: string;
  entry_type: string;
  amount: string;
  payment_mode: string | null;
  reference_number: string | null;
  posted_by_user_id: string | null;
  posted_by_name: string | null;
  metadata: Record<string, unknown>;
  posted_at: string;
  created_at: string;
}

export interface FeeLedgerResponse {
  fee_account: FeeAccountListItem;
  entries: FeeLedgerEntryItem[];
}
