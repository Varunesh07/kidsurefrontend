import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function MobileTopBar() {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  return (
    <header className="flex md:hidden sticky top-0 z-20 bg-white border-b border-l3 px-4 py-[13px] items-center justify-between shadow-sm">
      <span className="font-serif text-[18px] font-bold text-ink">
        Kid<span className="text-teal">Sure</span>
      </span>
      <div className="flex items-center gap-4">
        <button onClick={logout} className="text-faint hover:text-mid">
          <LogOut size={16} />
        </button>
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-teal-darker to-teal flex items-center justify-center text-[12px] font-bold text-white">
          {user.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
