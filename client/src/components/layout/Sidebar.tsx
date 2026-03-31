import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  Users,
  History,
  Building2,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rfps', icon: FileText, label: 'RFPs' },
  { to: '/rfps/new', icon: FilePlus, label: 'New RFP' },
  { to: '/competitors', icon: Users, label: 'Competitors' },
  { to: '/historical', icon: History, label: 'Historical Bids' },
  { to: '/company-profile', icon: Building2, label: 'Company Profile' },
];

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold">RFP Proposal AI</h1>
        <p className="text-gray-400 text-sm mt-1">Proposal Generator</p>
      </div>

      <nav className="flex-1 px-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
