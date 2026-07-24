import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/page-header';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { useAuth } from '../contexts/auth-context';
import { useHub } from '../contexts/hub-context';
import { ROLE_LABELS } from '../lib/constants';
import { cn, departmentLabel, initialsFor } from '../lib/utils';
import type { UserRole } from '../lib/types';
import type { ReactNode } from 'react';

const ROLE_BADGE: Record<UserRole, string> = {
  admin:
    'border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/40 dark:bg-sky-950 dark:text-sky-200',
  manager:
    'border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-500/40 dark:bg-violet-950 dark:text-violet-200',
  employee:
    'border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-[#1b1b20] dark:text-zinc-300',
};

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { departments } = useHub();
  const navigate = useNavigate();

  if (!user) return null;

  const isAthenas = user.email.endsWith('@athenas.local');
  const athenasLogin = isAthenas
    ? user.email.replace('@athenas.local', '').toUpperCase()
    : null;

  return (
    <div className="space-y-10">
      <PageHeader
        title={
          <>
            Meu <span className="text-sky-600 dark:text-sky-400">perfil</span>
          </>
        }
        description="Suas informações de conta e acesso no Automation HUB."
      />

      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-12">
        {/* Avatar + nome */}
        <div className="flex shrink-0 flex-col items-center gap-4 sm:items-start">
          <Avatar className="h-[4.5rem] w-[4.5rem] border-4 border-white bg-sky-100 text-sky-700 shadow dark:border-[#18181b] dark:bg-sky-500/20 dark:text-sky-200">
            <AvatarFallback className="text-2xl font-semibold tracking-tight">
              {initialsFor(user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="text-center sm:text-left">
            <div className="text-lg font-semibold leading-snug text-slate-950 dark:text-white">
              {user.name}
            </div>
            <Badge
              className={cn('mt-1.5 text-xs', ROLE_BADGE[user.role])}
            >
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
        </div>

        {/* Info rows */}
        <dl className="flex-1 divide-y divide-slate-100 dark:divide-white/[0.06]">
          <InfoRow label="Acesso">
            {isAthenas ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-medium text-slate-950 dark:text-white">
                  {athenasLogin}
                </span>
                <Badge className="border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-300">
                  Athenas
                </Badge>
              </div>
            ) : (
              <span className="text-sm text-slate-950 dark:text-white">
                {user.email}
              </span>
            )}
          </InfoRow>

          <InfoRow label="Função">
            <span className="text-sm text-slate-950 dark:text-white">
              {ROLE_LABELS[user.role]}
            </span>
          </InfoRow>

          <InfoRow label="Departamentos">
            {user.departments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.departments.map((d) => (
                  <span
                    key={d}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-[#1b1b20] dark:text-zinc-300"
                  >
                    {departmentLabel(d, departments)}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-400 dark:text-zinc-500">
                Nenhum departamento atribuído
              </span>
            )}
          </InfoRow>
        </dl>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button
          variant="outline"
          className="gap-2 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:border-rose-500/40 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
          onClick={async () => {
            await logout();
            void navigate('/');
          }}
        >
          <LogOut className="h-4 w-4" />
          Sair da conta
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 py-4 sm:flex-row sm:items-baseline sm:gap-8">
      <dt className="w-32 shrink-0 text-sm font-medium text-slate-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
