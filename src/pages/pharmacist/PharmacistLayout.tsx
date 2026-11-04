import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearAuth, getAuth } from '../../store/authStore'

const NAV = [
  { to: '/pharmacist/orders',  label: 'Заказы' },
  { to: '/pharmacist/active',  label: 'В доставке' },
  { to: '/pharmacist/history', label: 'История' },
]

export function PharmacistLayout() {
  const nav = useNavigate()
  const user = getAuth().user

  function logout() {
    clearAuth()
    nav('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Top row: logo + user/logout */}
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#16a273] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-gray-900">PharmaGo</span>
            <span className="text-xs text-gray-400 ml-1">Фармацевт</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#16a273] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden md:block text-sm text-gray-600 max-w-[120px] truncate">
              {user?.name}
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Выход
            </button>
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="md:hidden flex overflow-x-auto px-4 pb-2 gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#16a273] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
