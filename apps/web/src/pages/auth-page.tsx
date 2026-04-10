import { Activity, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Field } from '../components/field';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';
import { useAuth } from '../contexts/auth-context';
import { DEPARTMENT_OPTIONS } from '../lib/constants';
import type { Department } from '../lib/types';

export function AuthPage() {
  const { user, bootstrapping, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    departments: [] as Department[],
  });

  const canSubmitRegister = useMemo(
    () => form.departments.length > 0,
    [form.departments.length],
  );

  if (!bootstrapping && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 dark:bg-[#09090b] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="order-2 hidden rounded-[32px] border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-none dark:border-[#1c2538] dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 lg:block">
          <CardContent className="flex h-full flex-col justify-between gap-10 p-8 sm:p-10">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Automation HUB</div>
                  <div className="text-sm text-slate-300">
                    Plataforma interna da Controller
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Badge
                  className="w-fit border border-white/10 bg-white/10 text-white hover:bg-white/10"
                  variant="default"
                >
                  Operação centralizada
                </Badge>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Execute automações com histórico, logs reais e controle de fila.
                </h1>
                <p className="max-w-2xl text-base text-slate-300">
                  Um portal único para disparar robôs, acompanhar conflitos de
                  execução e distribuir resultados com auditoria.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FeatureCard
                icon={<Activity className="h-5 w-5" />}
                title="Monitoramento"
                description="Acompanhe progresso, logs e etapas da execução em tempo real."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Governança"
                description="Controle concorrência, conflitos e recursos compartilhados."
              />
              <FeatureCard
                icon={<LockKeyhole className="h-5 w-5" />}
                title="Auditoria"
                description="Registre quem executou, quando rodou e quais arquivos foram gerados."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="order-1 rounded-[28px] border-slate-300 bg-white dark:border-[#1c2538] dark:bg-[#070d1a] lg:rounded-[32px]">
          <CardHeader className="space-y-4 p-5 pb-0 sm:p-6 sm:pb-0">
            <div className="space-y-2">
              <CardTitle className="text-3xl">
                {mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
              </CardTitle>
              <CardDescription>
                {mode === 'login'
                  ? 'Use sua conta para acessar o catálogo e iniciar execuções.'
                  : 'Cadastre um usuário da empresa. Novas contas entram como funcionário até um admin promover.'}
              </CardDescription>
            </div>

            <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-[#0d1424]">
              <button
                type="button"
                className={[
                  'flex-1 rounded-xl px-4 py-2 text-sm font-medium transition',
                  mode === 'login'
                    ? 'bg-white text-slate-950 shadow-sm dark:bg-[#1a2437] dark:text-white'
                    : 'text-slate-500 dark:text-slate-400',
                ].join(' ')}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={[
                  'flex-1 rounded-xl px-4 py-2 text-sm font-medium transition',
                  mode === 'register'
                    ? 'bg-white text-slate-950 shadow-sm dark:bg-[#1a2437] dark:text-white'
                    : 'text-slate-500 dark:text-slate-400',
                ].join(' ')}
                onClick={() => setMode('register')}
              >
                Cadastro
              </button>
            </div>
          </CardHeader>

          <CardContent className="grid gap-5 p-5 sm:p-6">
            {mode === 'register' ? (
              <Field label="Nome">
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </Field>
            ) : null}

            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </Field>

            <Field label="Senha">
              <Input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
            </Field>

            {mode === 'register' ? (
              <Field
                label="Departamentos"
                hint="Selecione um ou mais departamentos da Controller."
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  {DEPARTMENT_OPTIONS.map((department) => {
                    const active = form.departments.includes(department.value);

                    return (
                      <button
                        key={department.value}
                        type="button"
                        className={[
                          'rounded-2xl border px-4 py-3 text-left text-sm transition',
                          active
                            ? 'border-sky-400 bg-sky-50 text-slate-950 dark:border-sky-500/40 dark:bg-[#111a2a] dark:text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#25324a] dark:bg-[#070d1a] dark:text-slate-200 dark:hover:bg-[#0d1424]',
                        ].join(' ')}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            departments: current.departments.includes(
                              department.value,
                            )
                              ? current.departments.filter(
                                  (item) => item !== department.value,
                                )
                              : [...current.departments, department.value],
                          }))
                        }
                      >
                        {department.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            ) : null}

            <Button
              className="w-full"
              disabled={mode === 'register' && !canSubmitRegister}
              onClick={async () => {
                try {
                  setError(null);
                  if (mode === 'login') {
                    await login({ email: form.email, password: form.password });
                  } else {
                    await register({
                      name: form.name,
                      email: form.email,
                      password: form.password,
                      departments: form.departments,
                    });
                  }
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'Não foi possível concluir a ação.',
                  );
                }
              }}
            >
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>

            {error ? <p className="text-sm text-rose-500">{error}</p> : null}

            <Separator />

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ao entrar, suas execuções passam a registrar automaticamente nome,
              email, cargo e histórico da conta.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
        {icon}
      </div>
      <div className="space-y-2">
        <div className="font-medium">{title}</div>
        <p className="text-sm text-slate-300">{description}</p>
      </div>
    </div>
  );
}
