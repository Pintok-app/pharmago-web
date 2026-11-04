import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearAuth, getAuth } from '../../store/authStore'

const NAV = [
  { to: '/admin/dashboard',   label: 'Заказы' },
  { to: '/admin/pharmacies',  label: 'Аптеки' },
  { to: '/admin/banners',     label: 'Баннеры' },
  { to: '/admin/drivers',     label: 'Водители' },
  { to: '/admin/pharmacists', label: 'Фармацевты' },
  { to: '/admin/settings',    label: 'Настройки' },
]

export function AdminLayout() {
  const nav = useNavigate()
  const user = getAuth().user
  const [open, setOpen] = useState(false)

  function logout() {
    clearAuth()
    nav('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#16a273] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span className="font-semibold text-gray-900">PharmaGo</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Администратор</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
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
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Выйти
          </button>
        </div>
      </aside>

      {/* Right side */}
      <div className="flex-1 md:ml-56 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="text-gray-600 hover:text-gray-900 text-xl leading-none"
            aria-label="Открыть меню"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#16a273] rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-sm text-gray-900">PharmaGo</span>
            <span className="text-xs text-gray-400">Администратор</span>
          </div>
        </div>

        <main className="p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
