import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin Pages
import { AdminLayout } from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Employees from "./pages/admin/Employees";
import NewEmployee from "./pages/admin/NewEmployee";
import Departments from "./pages/admin/Departments";
import Attendance from "./pages/admin/Attendance";
import Salaries from "./pages/admin/Salaries";
import Leave from "./pages/admin/Leave";
import Permissions from "./pages/admin/Permissions";
import Settings from "./pages/admin/Settings";

// Employee Pages
import EmployeeDashboard from "./pages/employee/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="employees/new" element={<NewEmployee />} />
              <Route path="departments" element={<Departments />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="salaries" element={<Salaries />} />
              <Route path="leave" element={<Leave />} />
              <Route path="permissions" element={<Permissions />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Employee routes */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
