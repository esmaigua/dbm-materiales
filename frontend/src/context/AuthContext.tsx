import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

type Role = 'ADMIN' | 'VENDEDOR';

interface AuthContextProps {
  user: User | null;
  role: Role;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Revisar si ya hay una sesión activa al abrir la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Escuchar en tiempo real cuando alguien entra o sale
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Mientras verifica la identidad, mostramos un pequeño texto
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-display text-slate-500">Verificando seguridad...</div>;
  }

  // Asignación de rol: Si el correo tiene la palabra "admin", es ADMIN. Si no, VENDEDOR.
  const role: Role = user?.email?.toLowerCase().includes('admin') ? 'ADMIN' : 'VENDEDOR';
  const isAdmin = role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};