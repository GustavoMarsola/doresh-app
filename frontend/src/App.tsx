import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/layout";
import { CreateSermon } from "@/pages/CreateSermon";
import { ReadBible } from "@/pages/ReadBible";
import { Library } from "@/pages/Library";
import { Login } from "@/pages/Login";
import { Register } from '@/pages/Register';
import { LandingPage } from "@/pages/LandingPage";
import { Dashboard } from "@/pages/Dashboard";
import { Profile} from "@/pages/Profile"
import { Ruach } from "@/pages/Ruach"
import { ChatProvider } from "@/hooks/ChatContext"; 
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrar" element={<Register />} /> 
          <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<ChatProvider> <Layout><Dashboard /></Layout> </ChatProvider>} />
              <Route path="/criar" element={<ChatProvider> <Layout><CreateSermon /></Layout> </ChatProvider>} />
              <Route path="/ler" element={<ChatProvider> <Layout><ReadBible /></Layout> </ChatProvider>} />
              <Route path="/estudos" element={<ChatProvider> <Layout><Library /></Layout> </ChatProvider>} />
              <Route path="/assistente" element={<ChatProvider> <Layout showAssistant={false}><Ruach /></Layout> </ChatProvider>} />
              <Route path="/perfil" element={<ChatProvider> <Layout showAssistant={false}><Profile /></Layout> </ChatProvider>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
