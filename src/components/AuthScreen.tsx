import { ReactNode, useEffect, useState } from 'react';
import { loginWithGoogle, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ensureUserProfile } from '../services/firestore';
import { motion } from 'motion/react';

export default function AuthScreen({ children }: { children: ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      ensureUserProfile(user);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-container"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-error mb-4">Erro de Autenticação</h2>
        <p className="text-on-surface-variant mb-6">{error.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary-container text-[#131313] rounded-full font-bold"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-start pt-16 p-6 relative overflow-hidden font-sans">
        {/* Abstract Gradient Background at Bottom */}
        <div className="absolute top-0 right-0 w-full h-1/2 opacity-20 pointer-events-none">
          <div className="absolute -top-64 -right-64 w-[600px] h-[600px] bg-primary-container blur-[150px] rounded-full"></div>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-12 z-10">
          <span className="material-symbols-outlined text-primary-container text-[32px]">monitoring</span>
          <span className="text-3xl font-headline font-black text-white tracking-tight">PulseOS</span>
        </div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[440px] bg-surface-container/60 backdrop-blur-2xl rounded-[32px] p-10 shadow-2xl border border-white/5 z-10"
        >
          <div className="space-y-2 mb-10">
            <h1 className="text-3xl font-headline font-bold text-white">Bem-vindo</h1>
            <p className="text-on-surface-variant text-sm">Insira suas credenciais para acessar seu santuário.</p>
          </div>

          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-4">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@dominio.com"
                className="w-full bg-surface-container-lowest border border-white/5 rounded-full py-4 px-6 text-white placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-primary-container transition-all outline-none"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-4">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Senha</label>
                <button className="text-[10px] font-bold text-primary-container hover:underline">Esqueceu a senha?</button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-lowest border border-white/5 rounded-full py-4 px-6 text-white placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-primary-container transition-all outline-none"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button className="w-full py-4 bg-primary-container text-[#131313] font-black tracking-widest uppercase text-[12px] rounded-full shadow-[0_12px_24px_rgba(0,180,82,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 border border-primary-container/20">
              Entrar
            </button>

            {/* Separator */}
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ou continue com</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={loginWithGoogle}
                className="flex items-center justify-center gap-3 py-4 bg-surface-container-lowest border border-white/5 rounded-full hover:bg-surface-container-high transition-all active:scale-95 text-[#B9CBB9]"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                <span className="text-xs font-bold text-white">Google</span>
              </button>
              <button className="flex items-center justify-center gap-3 py-4 bg-surface-container-lowest border border-white/5 rounded-full hover:bg-surface-container-high transition-all active:scale-95 opacity-50 cursor-not-allowed">
                <span className="material-symbols-outlined text-white text-[20px]">apple</span>
                <span className="text-xs font-bold text-white">Apple</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-12 z-10">
          <p className="text-on-surface-variant text-sm">
            Não tem uma conta? <button className="text-white font-bold hover:underline">Cadastre-se</button>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
