import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { queryClient } from "../../../app/query/queryClient";
import { getStoredAccessToken, storeAccessAssignmentId, storeAccessToken, getStoredStudentAccessToken, storeStudentAccessToken } from "../../../api/client/apiClient";
import { dashboardApi } from "../../dashboard/api/dashboardApi";
import { fetchCurrentUser, loginWithPassword, selectAccessContext } from "../api/authClient";
import { portalDefinitions } from "../constants/portals";
import type {
  AccessContextSummary,
  ActiveContext,
  AuthContextValue,
  AuthenticatedUser,
  LoginCredentials,
  PortalKey
} from "../types/authContext.types";

const AuthContext = createContext<AuthContextValue | null>(null);

function contextMatchesPortal(context: AccessContextSummary, portal: PortalKey): boolean {
  return portalDefinitions[portal].expectedRoles.includes(context.role.code);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getStoredAccessToken() != null || getStoredStudentAccessToken() != null);
  const [loading, setLoading] = useState(true);
  const [contextResolved, setContextResolved] = useState(false);
  const [appUser, setAppUser] = useState<AuthenticatedUser | null>(null);
  const [availableContexts, setAvailableContexts] = useState<AccessContextSummary[]>([]);
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null);

  const applyCurrentUser = useCallback((response: Awaited<ReturnType<typeof fetchCurrentUser>>) => {
    setAppUser(response.user);
    setAvailableContexts(response.available_contexts);
    setActiveContext(response.active_context);
    storeAccessAssignmentId(response.active_context?.assignment_id ?? null);
    setContextResolved(true);
  }, []);

  const refreshApplicationContext = useCallback(async () => {
    const response = await fetchCurrentUser();
    applyCurrentUser(response);
  }, [applyCurrentUser]);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      if (!mounted) return;
      if (getStoredAccessToken() != null || getStoredStudentAccessToken() != null) {
        try {
          await refreshApplicationContext();
          setIsAuthenticated(true);
        } catch {
          storeAccessToken(null);
          storeStudentAccessToken(null);
          setAppUser(null);
          setAvailableContexts([]);
          setActiveContext(null);
          storeAccessAssignmentId(null);
          setIsAuthenticated(false);
          setContextResolved(true);
        }
      } else {
        setContextResolved(true);
      }
      setLoading(false);
    }
    void restoreSession();
    return () => {
      mounted = false;
    };
  }, [refreshApplicationContext]);

  const login = useCallback(
    async (credentials: LoginCredentials, portal: PortalKey) => {
      setContextResolved(false);
      const response = await loginWithPassword(credentials.email, credentials.password, portal);
      if (portal === "student") {
        storeStudentAccessToken(response.access_token);
        setIsAuthenticated(true);
        
        // For student portal, we assume the response format is different or we just mock a context
        const mockContext: ActiveContext = {
          assignment_id: "student-assignment",
          tenant_id: null,
          branch_id: null,
          role_codes: ["STUDENT"],
          permissions: [],
          enabled_modules: [],
          scope_type: "STUDENT"
        };
        const studentData = (response as any).student;
        const mockUser: AuthenticatedUser = {
          id: studentData?.id || "student-id",
          display_name: studentData?.name || studentData?.fullName || "Student",
          email: credentials.email,
          status: "ACTIVE",
          account_category: "STUDENT"
        };
        const simulatedResponse = {
          user: mockUser,
          available_contexts: [{
            assignment_id: "student-assignment",
            tenant: null,
            branch: null,
            role: { code: "STUDENT", label: "Student" },
            scope_type: "STUDENT",
            enabled_modules: [],
            permissions: []
          }],
          active_context: mockContext
        };
        applyCurrentUser(simulatedResponse);
        return mockContext;
      }

      storeAccessToken(response.access_token);
      setIsAuthenticated(true);
      
      const matchingContexts = response.available_contexts.filter((context) =>
        contextMatchesPortal(context, portal)
      );
      if (matchingContexts.length === 0) {
        storeAccessToken(null);
        storeAccessAssignmentId(null);
        setIsAuthenticated(false);
        setAppUser(null);
        setAvailableContexts([]);
        setActiveContext(null);
        setContextResolved(true);
        throw new Error(`This account does not have access to the ${portalDefinitions[portal].label} portal.`);
      }
      if (matchingContexts.length === 1) {
        const selected = await selectAccessContext(matchingContexts[0].assignment_id);
        applyCurrentUser(selected);
        return selected.active_context;
      }
      applyCurrentUser(response);
      return response.active_context;
    },
    [applyCurrentUser]
  );

  const logout = useCallback(async () => {
      storeAccessToken(null);
      storeStudentAccessToken(null);
      setIsAuthenticated(false);
      setAppUser(null);
      setAvailableContexts([]);
      setActiveContext(null);
      storeAccessAssignmentId(null);
      setContextResolved(true);
      queryClient.clear();
      dashboardApi.clearDashboardCache();
    }, []);

  const selectContext = useCallback(
    async (assignmentId: string) => {
      setContextResolved(false);
      storeAccessAssignmentId(assignmentId);
      const response = await selectAccessContext(assignmentId);
      applyCurrentUser(response);
      queryClient.clear();
      dashboardApi.clearDashboardCache();
    },
    [applyCurrentUser]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      loading,
      contextResolved,
      appUser,
      availableContexts,
      activeContext,
      login,
      logout,
      refreshApplicationContext,
      selectContext,
      hasPermission: (permissionKey: string) => activeContext?.permissions.includes(permissionKey) ?? false,
      hasAnyPermission: (permissionKeys: string[]) =>
        permissionKeys.some((permissionKey) => activeContext?.permissions.includes(permissionKey)),
      hasModule: (moduleCode: string) => activeContext?.enabled_modules.includes(moduleCode) ?? false
    }),
    [
      isAuthenticated,
      loading,
      contextResolved,
      appUser,
      availableContexts,
      activeContext,
      login,
      logout,
      refreshApplicationContext,
      selectContext
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context == null) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
