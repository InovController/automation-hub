import {
  Bell,
  BarChart3,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PlayCircle,
  CalendarDays,
  Search,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { useHub } from '../contexts/hub-context';
import { useTheme } from '../contexts/theme-context';
import { ROLE_LABELS } from '../lib/constants';
import { cn, initialsFor } from '../lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';

export function AppShell() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { search, setSearch } = useHub();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const navGroups = [
    {
      label: 'Geral',
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/robots', label: 'Robôs', icon: PlayCircle },
        { to: '/history', label: 'Histórico', icon: Bell },
        { to: '/time-savings', label: 'Tempo ganho', icon: BarChart3 },
        { to: '/schedules', label: 'Agendamentos', icon: CalendarDays },
      ],
    },
    ...(user?.role === 'admin'
      ? [
          {
            label: 'Administração',
            items: [
              { to: '/settings', label: 'Configurações', icon: Settings },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#09090b] dark:text-white">
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Fechar menu"
          />
          <aside className="relative h-full w-[280px] overflow-y-auto border-r border-slate-200 bg-white text-slate-900 shadow-xl dark:border-[#27272a] dark:bg-[#111113] dark:text-white">
            <div className="flex items-center px-5 py-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-[#1f1f23] dark:text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">Automation HUB</div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-300">Controller</div>
                </div>
              </div>
            </div>
            <div className="px-5">
              <Separator className="dark:bg-white/10" />
            </div>
            <nav className="space-y-8 px-4 py-6">
              {navGroups.map((group) => (
                <div key={group.label} className="space-y-2">
                  <div className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {group.label}
                  </div>
                  <div className="space-y-1">
                    {group.items.map(({ to, label, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        onClick={() => setMobileNavOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                            isActive
                              ? 'bg-slate-100 text-slate-950 dark:bg-[#1b1b20] dark:text-white'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-zinc-300 dark:hover:bg-[#18181b] dark:hover:text-white',
                          )
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      <div
        className={cn(
          'min-h-screen transition-[padding] duration-200',
          sidebarCollapsed ? 'lg:pl-[88px]' : 'lg:pl-[272px]',
        )}
      >
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 hidden overflow-x-hidden overflow-y-auto overscroll-y-contain border-r border-slate-200 bg-white text-slate-900 transition-[width] duration-200 dark:border-[#27272a] dark:bg-[#111113] dark:text-white lg:flex lg:flex-col',
            sidebarCollapsed ? 'w-[88px]' : 'w-[272px]',
          )}
        >
          <div
            className={cn(
              'flex items-center px-5 py-5',
              sidebarCollapsed ? 'justify-center' : 'justify-start',
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-[#1f1f23] dark:text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              {!sidebarCollapsed ? (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    Automation HUB
                  </div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-300">
                    Controller
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className={cn(sidebarCollapsed ? 'px-3' : 'px-5')}>
            <Separator className="dark:bg-white/10" />
          </div>

          <nav className={cn('flex-1 space-y-8 py-6', sidebarCollapsed ? 'px-3' : 'px-4')}>
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                {!sidebarCollapsed ? (
                  <div className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {group.label}
                  </div>
                ) : null}

                <div className="space-y-1">
                  {group.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'flex rounded-xl text-sm font-medium transition',
                          sidebarCollapsed
                            ? 'justify-center px-0 py-3'
                            : 'items-center gap-3 px-3 py-2.5',
                          isActive
                            ? 'bg-slate-100 text-slate-950 dark:bg-[#1b1b20] dark:text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-zinc-300 dark:hover:bg-[#18181b] dark:hover:text-white',
                        )
                      }
                      title={sidebarCollapsed ? label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed ? label : null}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className={cn('relative mt-auto py-4', sidebarCollapsed ? 'px-3' : 'px-4')}>
            <button
              type="button"
              className={cn(
                'flex w-full rounded-2xl text-left transition hover:bg-slate-100 dark:hover:bg-[#18181b]',
                sidebarCollapsed
                  ? 'justify-center px-0 py-3'
                  : 'items-center gap-3 px-3 py-3',
              )}
              onClick={() => setProfileOpen((current) => !current)}
              title={sidebarCollapsed ? user?.name ?? 'Usuário' : undefined}
            >
              <Avatar className="h-11 w-11 border-slate-200 bg-sky-100 text-sky-700 dark:border-white/10 dark:bg-sky-500/20 dark:text-white">
                <AvatarFallback>
                  {initialsFor(user?.name ?? 'Automation HUB')}
                </AvatarFallback>
              </Avatar>

              {!sidebarCollapsed ? (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {user?.name ?? 'Usuário'}
                    </div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {ROLE_LABELS[user?.role ?? 'employee']} · {user?.email ?? ''}
                    </div>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-slate-400" />
                </>
              ) : null}
            </button>

            {profileOpen ? (
              <div
                className={cn(
                  'absolute z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-[#2b2b31] dark:bg-[#111113]',
                  sidebarCollapsed
                    ? 'bottom-4 left-[calc(100%+0.5rem)] w-56'
                    : 'bottom-[calc(100%-0.25rem)] left-4 right-4',
                )}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-[#18181b]"
                  onClick={async () => {
                    await logout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-[#27272a] dark:bg-[#09090b]/95">
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex w-full max-w-xl items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white p-0 text-slate-700 hover:bg-slate-100 dark:border-[#2b2b31] dark:bg-[#111113] dark:text-zinc-200 dark:hover:bg-[#18181b] dark:hover:text-white"
                  onClick={() => {
                    if (window.matchMedia('(min-width: 1024px)').matches) {
                      setSidebarCollapsed((current) => !current);
                    } else {
                      setMobileNavOpen((current) => !current);
                    }
                  }}
                >
                  <Menu className="h-4 w-4" />
                </Button>

                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 pl-10 dark:border-[#2b2b31] dark:bg-[#111113] dark:text-zinc-100"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-xl border border-slate-200 bg-white p-0 text-slate-700 hover:bg-slate-100 dark:border-[#2b2b31] dark:bg-[#111113] dark:text-zinc-200 dark:hover:bg-[#18181b] dark:hover:text-white"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
