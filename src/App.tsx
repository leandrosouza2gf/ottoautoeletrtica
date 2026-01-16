import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Veiculos from "./pages/Veiculos";
import Colaboradores from "./pages/Colaboradores";
import Fornecedores from "./pages/Fornecedores";
import Pecas from "./pages/Pecas";
import OrdensServico from "./pages/OrdensServico";
import Financeiro from "./pages/Financeiro";
import Comissoes from "./pages/Comissoes";
import Usuarios from "./pages/Usuarios";
import NotFound from "./pages/NotFound";
import StatusOS from "./pages/StatusOS";

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
            <Route path="/auth" element={<Auth />} />
            <Route path="/status-os" element={<StatusOS />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <Clientes />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/veiculos"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Veiculos />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/colaboradores"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <Colaboradores />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fornecedores"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <Fornecedores />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pecas"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <Pecas />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ordens-servico"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <OrdensServico />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/financeiro"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <Financeiro />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissoes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <Comissoes />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <Usuarios />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
