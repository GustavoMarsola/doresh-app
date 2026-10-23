import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/layout";
import { StudyEditor } from "@/pages/StudyEditor";
import { StudyView } from "@/pages/StudyView";
import { ReadBible } from "@/pages/ReadBible";
import { Library } from "@/pages/Library";
import { ReadingPlans } from "@/pages/ReadingPlans";
import { ReadingPlan } from "@/pages/ReadingPlan";
import { ReadingPlanDay } from "@/pages/ReadingPlanDay";
import { PlanGenerator } from "@/pages/PlanGenerator";
import { Login } from "@/pages/Login";
import { Register } from '@/pages/Register';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { Dashboard } from "@/pages/Dashboard";
import { Profile} from "@/pages/Profile"
import { Ruach } from "@/pages/Ruach"
import { ChatProvider } from "@/hooks/ChatContext"; 
import NotFound from "./pages/NotFound";
import { FEATURES } from "@/lib/features";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="doresh:theme">
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrar" element={<Register />} /> 
          <Route path="/recuperar" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
          <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<ChatProvider> <Layout><Dashboard /></Layout> </ChatProvider>} />
              <Route path="/ler" element={<ChatProvider> <Layout fullBleed><ReadBible /></Layout> </ChatProvider>} />
              <Route path="/planos" element={<ChatProvider> <Layout><ReadingPlans /></Layout> </ChatProvider>} />
              <Route path="/planos/novo" element={<ChatProvider> <Layout><PlanGenerator /></Layout> </ChatProvider>} />
              <Route path="/planos/:id" element={<ChatProvider> <Layout><ReadingPlan /></Layout> </ChatProvider>} />
              <Route path="/planos/:id/dia/:day" element={<ChatProvider> <Layout><ReadingPlanDay /></Layout> </ChatProvider>} />
              <Route path="/estudos" element={<ChatProvider> <Layout><Library /></Layout> </ChatProvider>} />
              <Route path="/estudos/novo" element={<ChatProvider> <Layout showAssistant={false}><StudyEditor /></Layout> </ChatProvider>} />
              <Route path="/estudos/:id" element={<ChatProvider> <Layout><StudyView /></Layout> </ChatProvider>} />
              <Route path="/estudos/:id/editar" element={<ChatProvider> <Layout showAssistant={false}><StudyEditor /></Layout> </ChatProvider>} />
              <Route path="/criar" element={<Navigate to="/estudos/novo" replace />} />
              <Route path="/assistente" element={FEATURES.ruach ? <ChatProvider> <Layout fullBleed showAssistant={false}><Ruach /></Layout> </ChatProvider> : <Navigate to="/home" replace />} />
              <Route path="/perfil" element={<ChatProvider> <Layout showAssistant={false}><Profile /></Layout> </ChatProvider>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
