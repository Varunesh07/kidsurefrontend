import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, MapPin, Search, Activity, Bookmark, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const active = location.pathname;

  const navItems = [
    { id: '/home', label: 'Nearby', Icon: MapPin },
    { id: '/search', label: 'Search', Icon: Search },
    { id: '/symptoms', label: 'Symptoms', Icon: Activity },
    { id: '/saved', label: 'Saved', Icon: Bookmark },
  ];

  if (user?.role === 'superadmin' || user?.role === 'hospital_admin') {
    navItems.push({ id: '/admin', label: 'Admin Dashboard', Icon: ShieldAlert });
  }

  // fallback while loading user
  if (!user) return null;

  const roleLabel = user.role === 'superadmin' ? 'Administrator' : user.role === 'hospital_admin' ? 'Hospital Admin' : 'Parent';

  return (
    <aside className="w-[230px] fixed top-0 left-0 h-screen bg-white border-r border-l3 flex-col z-40 hidden md:flex">
      <div className="px-5 py-[22px] border-b border-l3 flex items-center gap-[10px]">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-teal flex items-center justify-center flex-shrink-0 shadow-sm">
          <Stethoscope size={17} color="white" />
        </div>
        <span className="font-serif text-[19px] font-bold text-ink">
          Kid<span className="text-teal">Sure</span>
        </span>
      </div>

      <nav className="flex-1 px-[10px] py-[14px] overflow-y-auto">
        <p className="text-[10px] font-semibold text-faint uppercase tracking-[0.12em] px-3 pb-2">
          Navigation
        </p>
        {navItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => navigate(id)}
            className={`flex items-center gap-[10px] w-full px-[14px] py-[10px] rounded-[10px] text-[13px] font-medium mb-[2px] transition-all
              ${active === id || active.startsWith(id + '/')
                ? 'bg-green-bg text-teal font-semibold shadow-sm'
                : 'text-mid hover:bg-l1 hover:text-ink'
              }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="border-t border-l3 px-4 py-[14px]">
        <div className="flex items-center gap-[10px] mb-3">
          <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-teal-darker to-teal flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-[13px] font-semibold text-ink truncate">{user.name}</p>
            <p className="text-[10px] text-faint truncate">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-[6px] w-full justify-center px-4 py-[9px] text-[11px] font-semibold shadow-sm text-red-dark bg-red-bg border border-red-bdr hover:opacity-80 rounded-lg transition-opacity"
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
