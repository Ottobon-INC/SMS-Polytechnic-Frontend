import { z } from "zod";

export const manualAddSchema = z.object({
  // Academic Placement
  branch_id: z.string().min(1, "Branch is required"),
  academic_year_id: z.string().min(1, "Academic Year is required"),
  department_id: z.string().min(1, "Department is required"),
  academic_period_id: z.string().min(1, "Academic Period is required"),
  section_id: z.string().min(1, "Section is required"),
  entry_type: z.enum(["REGULAR", "LATERAL_ENTRY", "TRANSFER", "READMISSION"], { required_error: "Entry Type is required" }),
  
  // Student Details
  student_name: z.string().min(1, "Student name is required").max(200),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Gender is required" }),
  admission_number: z.string().min(1, "Admission number is required").max(60),
  diploma_registration_number: z.string().max(120).optional().nullable(),
  student_phone: z.string().max(30).optional().nullable(),
  student_email: z.string().email("Invalid email").optional().or(z.literal("")).transform(e => e === "" ? null : e),
  admission_date: z.string().optional().nullable(),
  roll_number: z.string().max(60).optional().nullable(),
  
  // Guardian Details
  guardian_name: z.string().min(1, "Guardian name is required").max(200),
  guardian_phone: z.string().min(1, "Guardian phone is required").regex(/^\+?[0-9\-\s]+$/, "Invalid phone number"),
  guardian_email: z.string().email("Invalid email").optional().or(z.literal("")).transform(e => e === "" ? null : e),
  relationship_type: z.enum(["FATHER", "MOTHER", "LEGAL_GUARDIAN", "RELATIVE", "SPONSOR", "OTHER"], { required_error: "Relationship is required" })
});

export type ManualAddStudentFormData = z.infer<typeof manualAddSchema>;
