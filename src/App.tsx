import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Veiculos from "./pages/Veiculos";
import Colaboradores from "./pages/Colaboradores";
import Fornecedores from "./pages/Fornecedores";
import Pecas from "./pages/Pecas";
import OrdensServico from "./pages/OrdensServico";
import Financeiro from "./pages/Financeiro";
import Comissoes from "./pages/Comissoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/veiculos" element={<Veiculos />} />
            <Route path="/colaboradores" element={<Colaboradores />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/pecas" element={<Pecas />} />
            <Route path="/ordens-servico" element={<OrdensServico />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/comissoes" element={<Comissoes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
