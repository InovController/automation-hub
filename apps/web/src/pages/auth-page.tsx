import { AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ControllerLogo } from '../components/controller-logo';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Field } from '../components/field';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/auth-context';

export function AuthPage() {
  const { user, bootstrapping, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ login: '', password: '' });

  if (!bootstrapping && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16 dark:bg-[#09090b] sm:px-6 sm:py-20 lg:px-8">
      <div className="grid w-full min-w-0 max-w-[70rem] grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">

        {/* Identidade compacta — visível apenas quando o painel hero está oculto (abaixo de lg) */}
        <div className="flex min-w-0 items-center gap-3 motion-safe:animate-fade-up lg:hidden">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-zinc-950">
            <ControllerLogo className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight text-slate-950 dark:text-white">
              Automation HUB
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400">Controller</div>
          </div>
        </div>

        {/* Card de login — coluna esquerda */}
        <Card className="flex min-w-0 flex-col justify-center rounded-[28px] border-slate-300 bg-white shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)] motion-safe:animate-fade-up dark:border-[#3f3f46] dark:bg-[#18181b] dark:shadow-[0_24px_70px_-28px_rgba(0,0,0,0.6)] lg:rounded-[32px]">
          <CardHeader className="space-y-1.5 p-7 pb-0 sm:p-9 sm:pb-0">
            <CardTitle className="text-3xl">Entrar na conta</CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-zinc-400">
              Use seu login e senha do Athenas para acessar os robôs do seu departamento.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-7 sm:p-9">
            <form
              className="grid grid-cols-1 gap-5"
              onSubmit={async (event) => {
                event.preventDefault();
                if (isSubmitting) return;
                setIsSubmitting(true);
                setError(null);
                try {
                  await login({ login: form.login, password: form.password });
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'Não foi possível concluir o login.',
                  );
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <Field label="Usuário Athenas">
                <Input
                  type="text"
                  autoComplete="username"
                  placeholder="Ex: JOAO.SILVA"
                  autoFocus
                  required
                  value={form.login}
                  onChange={(event) =>
                    setForm({ ...form, login: event.target.value })
                  }
                />
              </Field>

              <Field label="Senha">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    className="pr-11"
                    value={form.password}
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {error ? (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-100 px-3.5 py-2.5 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-950 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full transition-transform active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Painel hero — coluna direita, só em desktop */}
        <Card
          className="relative hidden min-w-0 flex-col overflow-hidden rounded-[32px] border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-[0_30px_90px_-30px_rgba(2,6,23,0.45)] motion-safe:animate-fade-up dark:border-[#3f3f46] dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-950 dark:shadow-[0_30px_90px_-30px_rgba(0,0,0,0.7)] lg:flex"
          style={{ animationDelay: '90ms' }}
        >
          {/* Textura sutil + brilho ambiente — quebram a chapa sólida do gradiente escuro */}
          <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.06] mix-blend-overlay" />
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl motion-safe:animate-drift" />

          <CardContent className="relative flex flex-1 flex-col justify-between gap-10 p-9 sm:p-11">

            {/* Identidade */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <ControllerLogo className="h-8 w-8" />
              </div>
              <div>
                <div className="text-base font-semibold leading-tight">Automation HUB</div>
                <div className="text-sm text-slate-400">Controller</div>
              </div>
            </div>

            {/* Contexto + headline */}
            <div className="space-y-5">
              <p className="max-w-sm text-base leading-relaxed text-slate-300 [text-wrap:pretty]">
                Portal interno onde <strong className="text-white">funcionários</strong> disparam robôs,{' '}
                <strong className="text-white">gestores</strong> acompanham execuções por departamento e a{' '}
                <strong className="text-white">diretoria</strong> consulta o ganho de tempo gerado pelas automações.
              </p>

              <h1 className="text-3xl font-semibold tracking-tight [text-wrap:balance] sm:text-4xl">
                Logs reais,{' '}
                <span className="text-sky-400">histórico completo</span>{' '}
                e controle de fila.
              </h1>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
