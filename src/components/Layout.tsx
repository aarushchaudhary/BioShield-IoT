import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-cyan-400 w-8 h-8" />
            <span className="font-bold text-xl tracking-tighter">BIO<span className="text-cyan-400">SHIELD</span></span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{user?.email}</span>
              <span className="px-2 py-1 rounded bg-cyan-900/30 text-cyan-400 text-xs font-mono uppercase">
                {user?.role}
              </span>
            </div>
            <button onClick={logout} className="hover:text-red-400 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
};
