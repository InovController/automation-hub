import { BookOpen, FileDown, FileText, FolderOpen, LifeBuoy, Play, Shield } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppIcon } from '../components/app-icon';
import { Field } from '../components/field';
import { PageHeader } from '../components/page-header';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/auth-context';
import { useHub } from '../contexts/hub-context';
import { api, downloadFile } from '../lib/api';
import type { Robot, RobotInputExample, RobotSchemaField, RobotSchemaFileInput } from '../lib/types';
import { userFileName } from '../lib/utils';

export function RobotDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify, refreshHub } = useHub();
  const [robot, setRobot] = useState<Robot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;
      try {
        const data = await api<Robot>(`/robots/${id}`);
        if (!cancelled) setRobot(data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar a automação.');
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loadError) return <p className="text-sm text-rose-500">{loadError}</p>;
  if (!robot) return <p className="text-sm text-slate-500">Carregando automação...</p>;

  const fields = robot.schema?.fields ?? [];
  const fileInputs = robot.schema?.fileInputs ?? [];
  const inputExamples = robot.inputExamples ?? [];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Automação"
        title={robot.name}
        description={robot.description || robot.summary || 'Automação pronta para execução no hub.'}
        badge={
          <Badge variant={robot.isActive ? 'success' : 'muted'}>
            {robot.isActive ? 'Pronto para executar' : 'Em manutenção'}
          </Badge>
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/history">Ver histórico</Link>
          </Button>
        }
      />

      <Card className="rounded-3xl">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <AppIcon icon={robot.icon} className="h-16 w-16 rounded-3xl" />
            <div className="space-y-1">
              <div className="text-sm text-slate-500 dark:text-slate-400">Versão {robot.version}</div>
              <div className="text-2xl font-semibold tracking-tight">{robot.name}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{robot.category || 'Categoria geral'}</div>
            </div>
          </div>
          <div className="grid gap-2 text-sm text-slate-500 dark:text-slate-400 sm:grid-cols-2">
            <SummaryPill icon={<Play className="h-4 w-4" />} label={`Concorrência ${robot.maxConcurrency ?? 1}`} />
            <SummaryPill icon={<FolderOpen className="h-4 w-4" />} label={fileInputs.length > 0 ? 'Aceita arquivos' : 'Sem upload'} />
            <SummaryPill icon={<Shield className="h-4 w-4" />} label={robot.conflictKeys || 'Sem conflitos'} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Parâmetros de execução</CardTitle>
            <CardDescription>Configure os campos abaixo para iniciar o processo com rastreabilidade.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-5 md:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault();
                if (isSubmitting) return;
                setIsSubmitting(true);
                const form = event.currentTarget;
                const formData = new FormData();
                const payload: Record<string, unknown> = {};

                formData.append('robotId', robot.id);
                formData.append('notes', (form.elements.namedItem('notes') as HTMLTextAreaElement).value);
                formData.append('priority', '0');

                for (const field of fields) {
                  const element = form.elements.namedItem(field.name);
                  if (field.type === 'checkbox' && element instanceof HTMLInputElement) {
                    payload[field.name] = element.checked;
                  } else if (
                    element instanceof HTMLInputElement ||
                    element instanceof HTMLTextAreaElement ||
                    element instanceof HTMLSelectElement
                  ) {
                    payload[field.name] = element.value;
                  }
                }

                formData.append('parameters', JSON.stringify(payload));

                for (const fileInput of fileInputs) {
                  const input = form.elements.namedItem(fileInput.name);
                  if (!(input instanceof HTMLInputElement) || !input.files) continue;
                  Array.from(input.files).forEach((file) => formData.append(fileInput.name, file));
                }

                try {
                  const execution = await api<{ id: string }>('/executions', {
                    method: 'POST',
                    body: formData,
                  });
                  notify('Execução criada com sucesso.');
                  await refreshHub();
                  navigate(`/executions/${execution.id}`);
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Não foi possível criar a execução.');
                  setIsSubmitting(false);
                }
              }}
            >
              <Field className="md:col-span-2" label="Conta responsável">
                <Input disabled value={user ? `${user.name} (${user.email})` : ''} />
              </Field>

              {fields.map((field) => (
                <FieldRenderer key={field.name} field={field} />
              ))}

              {fileInputs.map((fileInput) => (
                <FileInputRenderer
                  key={fileInput.name}
                  fileInput={fileInput}
                  examples={inputExamples.filter(
                    (item) => !item.fileInputName || item.fileInputName === fileInput.name,
                  )}
                />
              ))}

              <Field className="md:col-span-2" label="Observações internas">
                <Textarea name="notes" placeholder="Adicione qualquer contexto para esta execução..." />
              </Field>

              <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
                <Button type="reset" variant="outline" disabled={isSubmitting}>
                  Limpar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Executar robô'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Resumo operacional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <InfoRow label="Categoria" value={robot.category || 'Geral'} />
              <InfoRow label="Uploads configurados" value={fileInputs.length > 0 ? `${fileInputs.length} campo(s)` : 'Nenhum'} />
              <InfoRow label="Concorrência máxima" value={String(robot.maxConcurrency ?? 1)} />
              <InfoRow label="Conflitos compartilhados" value={robot.conflictKeys || 'Nenhum'} />
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Recursos do robô</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <ResourceItem
                icon={<BookOpen className="h-4 w-4" />}
                label={robot.documentationLabel || 'Documentação'}
                value={robot.documentationUrl || 'Não configurado'}
              />
              <Separator />
              <ResourceItem
                icon={<LifeBuoy className="h-4 w-4" />}
                label={robot.supportLabel || 'Suporte'}
                value={robot.supportValue || 'Não configurado'}
              />
              <Separator />
              <ResourceItem
                icon={<FileText className="h-4 w-4" />}
                label="Política de dados"
                value={robot.dataPolicy || 'Uso interno apenas.'}
              />
              {inputExamples.length > 0 ? (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Modelos de entrada</div>
                    {inputExamples.map((example) => (
                      <button
                        key={example.id}
                        onClick={() => void downloadFile(example.downloadUrl, userFileName(example.downloadName || example.filename))}
                        className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 px-3 py-2 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/70"
                      >
                        <FileDown className="mt-0.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <div className="min-w-0 text-left">
                          <div className="truncate text-sm">
                            {example.title || userFileName(example.downloadName || example.filename)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {example.fileInputName ? `Para: ${example.fileInputName}` : 'Modelo geral'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/80">
      <span className="text-slate-500 dark:text-slate-400">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ResourceItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-xl border border-slate-200 p-2 text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-medium">{label}</div>
        <div className="break-words text-sm text-slate-500 dark:text-slate-400">{value}</div>
      </div>
    </div>
  );
}

function FieldRenderer({ field }: { field: RobotSchemaField }) {
  const className = field.type === 'textarea' || field.type === 'radio' || field.type === 'checkbox' ? 'md:col-span-2' : '';

  if (field.type === 'textarea') {
    return (
      <Field className={className} label={field.label}>
        <Textarea name={field.name} placeholder={field.placeholder} />
      </Field>
    );
  }

  if (field.type === 'select') {
    return (
      <Field label={field.label}>
        <select
          name={field.name}
          className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100 dark:focus:ring-sky-900/35"
          defaultValue={field.defaultValue ?? field.options?.[0] ?? ''}
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (field.type === 'radio') {
    return (
      <Field className={className} label={field.label}>
        <div className="flex flex-wrap gap-3">
          {(field.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
              <input type="radio" name={field.name} value={option} defaultChecked={option === field.defaultValue} />
              {option}
            </label>
          ))}
        </div>
      </Field>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <Field className={className} label={field.label}>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
          <input type="checkbox" name={field.name} />
          Ativar
        </label>
      </Field>
    );
  }

  return (
    <Field label={field.label}>
      <Input name={field.name} type={field.type || 'text'} placeholder={field.placeholder} required={field.required} />
    </Field>
  );
}

function FileInputRenderer({
  fileInput,
  examples,
}: {
  fileInput: RobotSchemaFileInput;
  examples: RobotInputExample[];
}) {
  return (
    <Field className="md:col-span-2" label={fileInput.label} hint={fileInput.helperText}>
      <div className="grid gap-2">
        <Input
          name={fileInput.name}
          type="file"
          multiple={fileInput.multiple}
          accept={fileInput.accept}
          required={fileInput.required}
        />
        {examples.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
            <div className="mb-2 font-medium">Modelos disponíveis para este upload:</div>
            <div className="flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example.id}
                  onClick={() => void downloadFile(example.downloadUrl, userFileName(example.downloadName || example.filename))}
                  className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-white dark:border-slate-700 dark:hover:bg-slate-900"
                >
                  {example.title || userFileName(example.downloadName || example.filename)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Field>
  );
}
