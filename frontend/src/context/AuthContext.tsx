import { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'ADMIN' | 'VENDEDOR';

interface AuthContextProps {
  role: Role;
  isAdmin: boolean;
  toggleRole: () => void; // Un botón mágico para que pruebes ambos roles
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Por defecto iniciamos como ADMIN. En producción esto vendrá del Login de Supabase
  const [role, setRole] = useState<Role>('ADMIN');

  const toggleRole = () => setRole(prev => prev === 'ADMIN' ? 'VENDEDOR' : 'ADMIN');
  const isAdmin = role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ role, isAdmin, toggleRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};