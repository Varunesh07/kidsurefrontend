import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Search, Activity, Bookmark, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const active = location.pathname;

  if (!user) return null;

  const navItems = [
    { id: '/home', label: 'Nearby', Icon: MapPin },
    { id: '/search', label: 'Search', Icon: Search },
    { id: '/symptoms', label: 'Check', Icon: Activity },
    { id: '/saved', label: 'Saved', Icon: Bookmark },
  ];

  if (user.role === 'superadmin') {
    navItems.push({ id: '/admin', label: 'Admin', Icon: ShieldAlert });
  }

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-l3 z-30 pb-safe">
      <div className="flex w-full px-1 relative">
        {navItems.map(({ id, label, Icon }) => {
          const isActive = active === id || active.startsWith(id + '/');
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`flex-1 flex flex-col items-center justify-center pt-[10px] pb-3 text-[10px] font-medium gap-[3px] transition-colors relative
                ${isActive ? 'text-teal' : 'text-faint'}`}
            >
              {isActive && (
                <span className="absolute top-0 w-[24px] h-[3px] rounded-b-full bg-teal shadow-[0_2px_4px_rgba(31,178,156,0.3)]" />
              )}
              <Icon size={18} className="mb-[2px]" />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  );
}
