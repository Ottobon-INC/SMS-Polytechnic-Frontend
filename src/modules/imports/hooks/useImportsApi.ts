import { useQuery, useMutation } from "@tanstack/react-query";
import { importsApi, ManualAddStudentRequest } from "../api/importsApi";

export const useImportsApi = () => {
  return {
    useBranches: () =>
      useQuery({
        queryKey: ["imports", "branches"],
        queryFn: () => importsApi.getBranches()
      }),

    useAcademicYears: () =>
      useQuery({
        queryKey: ["imports", "academicYears"],
        queryFn: () => importsApi.getAcademicYears()
      }),

    useAcademicPeriods: () =>
      useQuery({
        queryKey: ["imports", "academicPeriods"],
        queryFn: () => importsApi.getAcademicPeriods()
      }),

    useDepartments: (branchId?: string, academicYearId?: string) =>
      useQuery({
        queryKey: ["imports", "departments", branchId, academicYearId],
        queryFn: () => importsApi.getDepartments(branchId, academicYearId),
        enabled: !!branchId
      }),

    useSections: (branchId?: string, academicYearId?: string, departmentId?: string, academicPeriodId?: string) =>
      useQuery({
        queryKey: ["imports", "sections", branchId, academicYearId, departmentId, academicPeriodId],
        queryFn: () => importsApi.getSections({ branchId, academicYearId, departmentId, academicPeriodId }),
        enabled: !!branchId && !!academicYearId && !!departmentId && !!academicPeriodId
      }),

    useManualAddStudent: () =>
      useMutation({
        mutationFn: (payload: ManualAddStudentRequest) => importsApi.manualAddStudent(payload)
      }),

    useActivatePortal: () =>
      useMutation({
        mutationFn: (guardianId: string) => importsApi.activatePortal(guardianId)
      })
  };
};
