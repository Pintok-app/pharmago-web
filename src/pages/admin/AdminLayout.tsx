import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearAuth, getAuth } from '../../store/authStore'

const NAV = [
  { to: '/admin/dashboard',    label: 'Заказы' },
  { to: '/admin/pharmacies',   label: 'Аптеки' },
  { to: '/admin/banners',      label: 'Баннеры' },
  { to: '/admin/drivers',      label: 'Водители' },
  { to: '/admin/pharmacists',  label: 'Фармацевты' },
  { to: '/admin/settings',     label: 'Настройки' },
]

export function AdminLayout() {
  const nav = useNavigate()
  const user = getAuth().user

  function logout() {
    clearAuth()
    nav('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#16a273] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-gray-900">PharmaGo</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Администратор</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#dcf8ea] text-[#16a273]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 truncate mb-2">{user?.name}</p>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Выйти
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-56 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
