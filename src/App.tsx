import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";

// Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin Pages
import { FlowHRLayout } from "./components/layout/FlowHRLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Employees from "./pages/admin/Employees";
import EditEmployee from "./pages/admin/EditEmployee";
import NewEmployee from "./pages/admin/NewEmployee";
import Departments from "./pages/admin/Departments";
import Attendance from "./pages/admin/Attendance";
import Salaries from "./pages/admin/Salaries";
import Leave from "./pages/admin/Leave";
import Permissions from "./pages/admin/Permissions";
import Settings from "./pages/admin/Settings";
import Recruitment from "./pages/admin/Recruitment";

// Employee Pages
import { EmployeeLayoutNew } from "./components/layout/EmployeeLayoutNew";
import EmployeeDashboard from "./pages/employee/DashboardFinal";
import AttendanceSystem from "./pages/employee/Attendance";
import TasksPage from "./pages/employee/Tasks";
import TeamPage from "./pages/employee/Team";
import SalaryPage from "./pages/employee/Salary";
import NotificationsPage from "./pages/employee/Notifications";
import ChatPage from "./pages/employee/Chat";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <FlowHRLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="employees/new" element={<NewEmployee />} />
              <Route path="employees/:id/edit" element={<EditEmployee />} />
              <Route path="departments" element={<Departments />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="salaries" element={<Salaries />} />
              <Route path="leave" element={<Leave />} />
              <Route path="permissions" element={<Permissions />} />
              <Route path="settings" element={<Settings />} />
              <Route path="recruitment" element={<Recruitment />} />
            </Route>

            {/* Employee routes */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeLayoutNew />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="attendance" element={<AttendanceSystem />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="salary" element={<SalaryPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="chat" element={<ChatPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
