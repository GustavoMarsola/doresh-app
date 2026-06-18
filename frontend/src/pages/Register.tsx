import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, User, Fingerprint, Mail, Lock } from 'lucide-react';
import { toast } from "sonner";

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail]                     = React.useState('');
  const [password, setPassword]               = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [username, setUsername]               = React.useState('');
  const [cpfCnpj, setCpfCnpj]                 = React.useState('');

  const [showPassword, setShowPassword]               = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);  
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    
    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
    const documentType = cleanCpfCnpj.length === 11 ? 'CPF' : 'CNPJ';
    
    if (!(cleanCpfCnpj.length === 11 || cleanCpfCnpj.length === 14)) {
      toast.error('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_HOST}/user/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key":    import.meta.env.VITE_API_KEY || "",
        },
        body: JSON.stringify({
          email,
          password,
          username,
          document_number: cleanCpfCnpj,
          document_type:   documentType,
        }),
      });

      if (response.status === 201) {
        toast.success("Conta criada com sucesso! Realize o login.");
        navigate("/login");
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || "Erro ao criar conta.");
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[550px]"
      >
        {/* Header simplificado fora do card para dar leveza */}
        <div className="flex flex-col items-center mb-8 space-y-2">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-2">
            <Logo size="lg" className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Comece sua jornada</h1>
          <p className="text-slate-500 text-sm">Preencha os dados para criar sua conta no Doresh</p>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
          <CardContent className="pt-8">
            <form onSubmit={handleRegister} className="space-y-6">
              
              {/* Grid para Nome e Documento - Ocupa menos espaço vertical */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 font-medium ml-1">Nome de Usuário</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="username"
                      placeholder="Nome completo"
                      className="pl-10 h-11 border-slate-200 bg-slate-50/30 focus:bg-white transition-all"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj" className="text-slate-700 font-medium ml-1">CPF ou CNPJ</Label>
                  <div className="relative group">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="cpfCnpj"
                      placeholder="Somente números"
                      className="pl-10 h-11 border-slate-200 bg-slate-50/30 focus:bg-white transition-all"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Email ocupa a largura total */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium ml-1">Email Profissional</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemplo@email.com"
                    className="pl-10 h-11 border-slate-200 bg-slate-50/30 focus:bg-white transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Grid para Senhas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium ml-1">Senha</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11 border-slate-200 bg-slate-50/30 focus:bg-white transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700 font-medium ml-1">Confirmar</Label>
                  <div className="relative group">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`h-11 border-slate-200 bg-slate-50/30 focus:bg-white transition-all ${
                        confirmPassword ? (passwordsMatch ? 'border-green-200 ring-1 ring-green-100' : 'border-red-200 ring-1 ring-red-100') : ''
                      }`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      {confirmPassword && (
                        passwordsMatch ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all font-medium mt-2"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar minha conta"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Já faz parte da comunidade?{' '}
                <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4">
                  Fazer Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};