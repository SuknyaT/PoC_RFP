import { useAuthStore } from '../../store/authStore';

export default function Header() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.role}</p>
        </div>
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
