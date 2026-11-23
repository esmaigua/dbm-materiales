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
  const [role, setRole] = useState<Role>('VENDEDOR');
  const [loading, setLoading] = useState(true);

  // Trae el rol real desde la tabla user_roles de Supabase. Si el usuario
  // no tiene una fila ahí todavía, por seguridad se le trata como VENDEDOR
  // (nunca se asume admin por defecto).
  const loadRole = async (currentUser: User | null) => {
    if (!currentUser) {
      setRole('VENDEDOR');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      if (error) {
        console.error('Error cargando el rol del usuario:', error);
      }
      setRole(data?.role === 'ADMIN' ? 'ADMIN' : 'VENDEDOR');
    } catch (error) {
      console.error('Error cargando el rol del usuario:', error);
      setRole('VENDEDOR');
    }
  };

  useEffect(() => {
    // 1. Revisar si ya hay una sesión activa al abrir la página
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      await loadRole(session?.user ?? null);
      setLoading(false);
    });

    // 2. Escuchar en tiempo real cuando alguien entra o sale
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      loadRole(session?.user ?? null);
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