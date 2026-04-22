import { Trash2, Upload, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Field } from '../components/field';
import { PageHeader, PageHeaderBadge } from '../components/page-header';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/auth-context';
import { useHub } from '../contexts/hub-context';
import { WEEKDAY_OPTIONS } from '../lib/constants';
import { api } from '../lib/api';
import type { Department, ManagedUser, RobotSchemaField, ScheduledTask } from '../lib/types';
import { departmentLabel, formatDate } from '../lib/utils';
import { DEPARTMENT_OPTIONS } from '../lib/constants';

type Draft = {
  id?: string;
  name: string;
  robotId: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  timeOfDay: string;
  startDate: string;
  dayOfWeek: string;
  dayOfMonth: string;
  notes: string;
  isActive: boolean;
  parameters: Record<string, string | boolean>;
  recipientScope: 'none' | 'all' | 'departments' | 'specific';
  recipientDepartments: Department[];
  recipientUserIds: string[];
};

export function SchedulesPage() {
  const { user } = useAuth();
  const { hub, notify } = useHub();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [templateFiles, setTemplateFiles] = useState<Record<string, File[]>>({});
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [allUsers, setAllUsers] = useState<ManagedUser[]>([]);

  const robots = useMemo(() => hub?.robots ?? [], [hub?.robots]);
  const selectedRobot = robots.find((robot) => robot.id === draft.robotId) ?? null;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  useEffect(() => {
    void loadTasks();
    if (user?.role === 'admin') {
      void api<ManagedUser[]>('/users').then(setAllUsers).catch(() => {});
    }
  }, [user?.role]);

  useEffect(() => {
    if (!selectedTaskId && tasks[0] && !isCreatingNew) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId, isCreatingNew]);

  useEffect(() => {
    if (!selectedTask) {
      setDraft({
        ...emptyDraft(),
        robotId: robots[0]?.id ?? '',
      });
      setTemplateFiles({});
      return;
    }

    const scope = selectedTask.recipientScope ?? 'specific';
    setDraft({
      id: selectedTask.id,
      name: selectedTask.name,
      robotId: selectedTask.robotId,
      frequency: selectedTask.frequency,
      timeOfDay: selectedTask.timeOfDay,
      startDate: toDateInputValue(selectedTask.startDate || selectedTask.nextRunAt),
      dayOfWeek:
        selectedTask.dayOfWeek === null || selectedTask.dayOfWeek === undefined
          ? ''
          : String(selectedTask.dayOfWeek),
      dayOfMonth:
        selectedTask.dayOfMonth === null || selectedTask.dayOfMonth === undefined
          ? ''
          : String(selectedTask.dayOfMonth),
      notes: selectedTask.notes ?? '',
      isActive: selectedTask.isActive,
      parameters: normalizeParameters(selectedTask.parameters ?? {}),
      recipientScope: scope === 'specific' && (selectedTask.recipientUserIds ?? []).length === 0 ? 'none' : scope as Draft['recipientScope'],
      recipientDepartments: (selectedTask.recipientDepartments ?? []) as Department[],
      recipientUserIds: selectedTask.recipientUserIds ?? [],
    });
    setTemplateFiles({});
  }, [selectedTask, robots]);

  async function loadTasks() {
    try {
      const data = await api<ScheduledTask[]>('/scheduled-tasks');
      setTasks(data);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Não foi possível carregar os agendamentos.');
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Agenda"
        title={
          <>
            Agendamentos{' '}
            <span className="text-sky-600 dark:text-sky-400">automáticos</span>
          </>
        }
        description="Programe robôs para rodar em horários fixos. O hub cria execuções reais usando a mesma fila e auditoria."
        badge={<PageHeaderBadge>{tasks.length} agendamentos</PageHeaderBadge>}
        actions={
          <Button
            onClick={() => {
              setSelectedTaskId(null);
              setIsCreatingNew(true);
              setDraft((current) => ({
                ...emptyDraft(),
                robotId:
                  current.robotId && robots.some((robot) => robot.id === current.robotId)
                    ? current.robotId
                    : robots[0]?.id || '',
              }));
              setTemplateFiles({});
            }}
          >
            Novo agendamento
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[340px_1fr] xl:items-start">
        <Card className="h-fit rounded-3xl">
          <CardHeader>
            <CardTitle>Agendamentos criados</CardTitle>
            <CardDescription>
              {user?.role === 'admin'
                ? 'Visão completa do ambiente.'
                : user?.role === 'manager'
                  ? 'Você vê os seus agendamentos e os do seu departamento.'
                  : 'Você vê apenas os seus agendamentos.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid max-h-[62vh] gap-2.5 overflow-y-auto">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className={[
                  'grid gap-1.5 rounded-2xl border px-4 py-3 text-left transition',
                  task.id === selectedTaskId
                    ? 'border-sky-300 bg-sky-50 text-slate-950 shadow-sm dark:border-[#2b2b31] dark:bg-[#151518] dark:text-white'
                    : 'border-slate-300 bg-white hover:bg-slate-50 dark:border-[#2b2b31] dark:bg-[#111113] dark:hover:bg-[#18181b]',
                ].join(' ')}
                onClick={() => {
                  setSelectedTaskId(task.id);
                  setIsCreatingNew(false);
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="truncate">{task.name}</strong>
                  <Badge variant={task.isActive ? 'success' : 'muted'}>
                    {task.isActive ? 'Ativo' : 'Pausado'}
                  </Badge>
                </div>
                <span className="text-sm opacity-80">{task.robot.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Próxima execução: {formatDate(task.nextRunAt)}
                </span>
                <CountdownLabel task={task} />
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Badge className="border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/35 dark:bg-slate-800 dark:text-slate-200">
              Robô: {selectedRobot?.name ?? 'Selecione'}
            </Badge>
            <Badge className="border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-950 dark:text-indigo-200">
              Frequência: {frequencyLabel(draft.frequency)}
            </Badge>
            <Badge className="border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/40 dark:bg-sky-950 dark:text-sky-200">
              Horário: {draft.timeOfDay || '--:--'}
            </Badge>
            <Badge variant={draft.isActive ? 'success' : 'muted'}>
              {draft.isActive ? 'Ativo' : 'Pausado'}
            </Badge>
          </div>

          <Card className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{draft.id ? 'Editar agendamento' : 'Novo agendamento'}</CardTitle>
                <Badge
                  className={
                    draft.id
                      ? 'border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-950 dark:text-indigo-200'
                      : undefined
                  }
                  variant={draft.id ? 'muted' : 'success'}
                >
                  {draft.id ? 'Modo edição' : 'Modo novo'}
                </Badge>
              </div>
              <CardDescription>
                Agora você pode salvar arquivos base no agendamento para robôs que exigem upload.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome do agendamento">
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </Field>
                <Field label="Automação">
                  <select
                    className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100 dark:focus:ring-sky-900/35"
                    value={draft.robotId}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        robotId: e.target.value,
                        parameters: {},
                      })
                    }
                  >
                    {robots.map((robot) => (
                      <option key={robot.id} value={robot.id}>
                        {robot.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Frequência">
                  <select
                    className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100 dark:focus:ring-sky-900/35"
                    value={draft.frequency}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        frequency: e.target.value as Draft['frequency'],
                      })
                    }
                  >
                    <option value="once">Uma vez</option>
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </Field>
                <Field label="Horário">
                  <Input type="time" value={draft.timeOfDay} onChange={(e) => setDraft({ ...draft, timeOfDay: e.target.value })} />
                </Field>
                <Field label="Dia da primeira execução">
                  <Input
                    type="date"
                    min={todayDateInputValue()}
                    value={draft.startDate}
                    onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                  />
                </Field>
                {draft.frequency === 'weekly' ? (
                  <Field label="Dia da semana">
                    <select
                      className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100 dark:focus:ring-sky-900/35"
                      value={draft.dayOfWeek}
                      onChange={(e) => setDraft({ ...draft, dayOfWeek: e.target.value })}
                    >
                      <option value="">Selecione</option>
                      {WEEKDAY_OPTIONS.map((option) => (
                        <option key={option.value} value={String(option.value)}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}
                {draft.frequency === 'monthly' ? (
                  <Field label="Dia do mês">
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={draft.dayOfMonth}
                      onChange={(e) => setDraft({ ...draft, dayOfMonth: e.target.value })}
                    />
                  </Field>
                ) : null}
                <Field className="md:col-span-2" label="Observações">
                  <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                </Field>
              </div>

              <Separator />

              <div className="grid gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Parâmetros do robô</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Esses valores serão usados automaticamente a cada execução agendada.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {(selectedRobot?.schema?.fields ?? []).map((field) => (
                    <FieldRenderer
                      key={field.name}
                      field={field}
                      value={draft.parameters[field.name]}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          parameters: { ...current.parameters, [field.name]: value },
                        }))
                      }
                    />
                  ))}
                </div>
              </div>

              {(selectedRobot?.schema?.fileInputs ?? []).length > 0 ? (
                <div className="grid gap-4">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <h3 className="text-lg font-semibold">Arquivos base do agendamento</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Os arquivos enviados aqui ficam vinculados ao agendamento e serão usados automaticamente.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {(selectedRobot?.schema?.fileInputs ?? []).map((fileInput) => (
                      <Field key={fileInput.name} label={fileInput.label} hint={fileInput.helperText}>
                        <Input
                          type="file"
                          multiple={fileInput.multiple}
                          accept={fileInput.accept}
                          onChange={(e) =>
                            setTemplateFiles((current) => ({
                              ...current,
                              [fileInput.name]: Array.from(e.target.files ?? []),
                            }))
                          }
                        />
                      </Field>
                    ))}
                  </div>
                  {selectedTask?.templateFiles && selectedTask.templateFiles.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      Arquivos atualmente salvos: {selectedTask.templateFiles.join(', ')}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {user?.role === 'admin' ? (
                <>
                  <Separator />
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <h3 className="text-lg font-semibold">Destinatários do resultado</h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Quem receberá notificação com os arquivos gerados a cada execução.
                    </p>
                    <Field label="Escopo">
                      <select
                        className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100 dark:focus:ring-sky-900/35"
                        value={draft.recipientScope}
                        onChange={(e) =>
                          setDraft({ ...draft, recipientScope: e.target.value as Draft['recipientScope'], recipientDepartments: [], recipientUserIds: [] })
                        }
                      >
                        <option value="none">Somente o criador (sem notificações)</option>
                        <option value="all">Todos os usuários ativos</option>
                        <option value="departments">Por departamento</option>
                        <option value="specific">Usuários específicos</option>
                      </select>
                    </Field>

                    {draft.recipientScope === 'departments' ? (
                      <div className="grid gap-2">
                        <p className="text-sm font-medium">Selecione os departamentos</p>
                        <div className="flex flex-wrap gap-2">
                          {DEPARTMENT_OPTIONS.map((dept) => {
                            const checked = draft.recipientDepartments.includes(dept.value as Department);
                            return (
                              <label
                                key={dept.value}
                                className={[
                                  'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition',
                                  checked
                                    ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-300'
                                    : 'border-slate-200 bg-white text-slate-700 dark:border-[#2b2b31] dark:bg-[#111113] dark:text-zinc-300',
                                ].join(' ')}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={checked}
                                  onChange={(e) => {
                                    const val = dept.value as Department;
                                    setDraft((cur) => ({
                                      ...cur,
                                      recipientDepartments: e.target.checked
                                        ? [...cur.recipientDepartments, val]
                                        : cur.recipientDepartments.filter((d) => d !== val),
                                    }));
                                  }}
                                />
                                {dept.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {draft.recipientScope === 'specific' ? (
                      <div className="grid gap-2">
                        <p className="text-sm font-medium">Selecione os usuários</p>
                        <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 dark:border-[#2b2b31]">
                          {allUsers.filter((u) => u.isActive).map((u) => {
                            const checked = draft.recipientUserIds.includes(u.id);
                            return (
                              <label
                                key={u.id}
                                className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50 dark:border-[#2b2b31] dark:hover:bg-[#18181b]"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setDraft((cur) => ({
                                      ...cur,
                                      recipientUserIds: e.target.checked
                                        ? [...cur.recipientUserIds, u.id]
                                        : cur.recipientUserIds.filter((id) => id !== u.id),
                                    }));
                                  }}
                                />
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">{u.name}</div>
                                  <div className="truncate text-xs text-slate-400">{u.email}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}

              <div className="flex flex-wrap justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  />
                  Agendamento ativo
                </label>

                <div className="flex gap-3">
                  {draft.id ? (
                    deleteConfirm ? (
                      <>
                        <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
                          Cancelar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={async () => {
                            if (!draft.id) return;
                            try {
                              await api(`/scheduled-tasks/${draft.id}`, { method: 'DELETE' });
                              notify('Agendamento excluído.');
                              setDeleteConfirm(false);
                              setSelectedTaskId(null);
                              await loadTasks();
                            } catch (error) {
                              notify(error instanceof Error ? error.message : 'Não foi possível excluir o agendamento.');
                              setDeleteConfirm(false);
                            }
                          }}
                        >
                          Confirmar exclusão
                        </Button>
                      </>
                    ) : (
                      <Button variant="danger" onClick={() => setDeleteConfirm(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    )
                  ) : null}

                  <Button
                    onClick={async () => {
                      try {
                        if (!draft.name.trim()) {
                          notify('Informe um nome para o agendamento.');
                          return;
                        }
                        if (!draft.robotId) {
                          notify('Selecione uma automação.');
                          return;
                        }
                        if (!draft.startDate) {
                          notify('Selecione um dia para iniciar o agendamento.');
                          return;
                        }

                        const now = new Date();
                        const chosen = new Date(`${draft.startDate}T${draft.timeOfDay || '00:00'}:00`);
                        if (Number.isNaN(chosen.getTime())) {
                          notify('Data ou horário inválido.');
                          return;
                        }
                        if (chosen <= now) {
                          notify('Escolha uma data/hora futura para o agendamento.');
                          return;
                        }

                        const formData = new FormData();
                        if (draft.id) formData.append('id', draft.id);
                        formData.append('name', draft.name);
                        formData.append('robotId', draft.robotId);
                        formData.append('frequency', draft.frequency);
                        formData.append('timeOfDay', draft.timeOfDay);
                        formData.append('startDate', draft.startDate);
                        formData.append(
                          'dayOfWeek',
                          draft.frequency === 'weekly' ? String(Number(draft.dayOfWeek)) : '',
                        );
                        formData.append(
                          'dayOfMonth',
                          draft.frequency === 'monthly' ? String(Number(draft.dayOfMonth)) : '',
                        );
                        formData.append('notes', draft.notes);
                        formData.append('isActive', String(draft.isActive));
                        formData.append('parameters', JSON.stringify(draft.parameters));

                        if (user?.role === 'admin') {
                          const apiScope = draft.recipientScope === 'none' ? 'specific' : draft.recipientScope;
                          formData.append('recipientScope', apiScope);
                          formData.append('recipientDepartments', JSON.stringify(
                            draft.recipientScope === 'departments' ? draft.recipientDepartments : [],
                          ));
                          formData.append('recipientUserIds', JSON.stringify(
                            draft.recipientScope === 'specific' ? draft.recipientUserIds : [],
                          ));
                        }

                        Object.values(templateFiles).forEach((files) => {
                          files.forEach((file) => formData.append('templateFiles', file));
                        });

                        await api('/scheduled-tasks', {
                          method: 'POST',
                          body: formData,
                        });
                        notify('Agendamento salvo com sucesso.');
                        setTemplateFiles({});
                        setIsCreatingNew(false);
                        await loadTasks();
                      } catch (error) {
                        notify(error instanceof Error ? error.message : 'Não foi possível salvar o agendamento.');
                      }
                    }}
                  >
                    Salvar agendamento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedTask ? (
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Resumo do agendamento</CardTitle>
                <CardDescription>Visão rápida da próxima execução e do histórico recente.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <InfoRow label="Solicitante" value={`${selectedTask.user.name} (${selectedTask.user.email})`} />
                <InfoRow label="Departamentos" value={selectedTask.user.departments.map(departmentLabel).join(', ')} />
                <InfoRow label="Próxima execução" value={formatDate(selectedTask.nextRunAt)} />
                <InfoRow label="Última execução" value={selectedTask.lastRunAt ? formatDate(selectedTask.lastRunAt) : 'Ainda não executou'} />
                <InfoRow label="Último erro" value={selectedTask.lastError || 'Nenhum'} />
                {selectedTask.lastExecutionId ? (
                  <Button asChild variant="outline" size="sm" className="justify-center">
                    <Link to={`/executions/${selectedTask.lastExecutionId}`}>Abrir última execução</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: RobotSchemaField;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}) {
  const className =
    field.type === 'textarea' || field.type === 'radio' || field.type === 'checkbox'
      ? 'md:col-span-2'
      : '';

  if (field.type === 'textarea') {
    return (
      <Field className={className} label={field.label}>
        <Textarea value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      </Field>
    );
  }

  if (field.type === 'select') {
    return (
      <Field label={field.label}>
        <select
          className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100 dark:focus:ring-sky-900/35"
          value={String(value ?? field.defaultValue ?? field.options?.[0] ?? '')}
          onChange={(e) => onChange(e.target.value)}
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
              <input
                type="radio"
                name={field.name}
                checked={String(value ?? field.defaultValue ?? '') === option}
                onChange={() => onChange(option)}
              />
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
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          Ativar
        </label>
      </Field>
    );
  }

  return (
    <Field label={field.label}>
      <Input
        type={field.type || 'text'}
        value={String(value ?? field.defaultValue ?? '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    </Field>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-800">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="max-w-[70%] text-right text-sm font-medium leading-relaxed">{value}</span>
    </div>
  );
}

function CountdownLabel({ task }: { task: ScheduledTask }) {
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span className="text-xs text-slate-500 dark:text-slate-400">
      {countdownLabel(task, nowTick)}
    </span>
  );
}

function emptyDraft(): Draft {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return {
    name: '',
    robotId: '',
    frequency: 'once',
    timeOfDay: '09:00',
    startDate: `${yyyy}-${mm}-${dd}`,
    dayOfWeek: '1',
    dayOfMonth: '1',
    notes: '',
    isActive: true,
    parameters: {},
    recipientScope: 'none',
    recipientDepartments: [],
    recipientUserIds: [],
  };
}

function toDateInputValue(value?: string | null) {
  if (!value) return emptyDraft().startDate;
  const date = new Date(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function todayDateInputValue() {
  return emptyDraft().startDate;
}

function countdownLabel(task: ScheduledTask, nowTick: number) {
  if (!task.isActive) {
    if (task.frequency === 'once') {
      if (task.lastExecutionStatus === 'canceled') return 'Última execução cancelada';
      if (task.lastExecutionStatus === 'error') return 'Última execução com erro';
      if (task.lastExecutionStatus === 'success') return 'Execução concluída';
      if (task.lastExecutionStatus === 'running') return 'Execução em andamento';
      if (task.lastExecutionStatus === 'queued') return 'Execução em fila';
      return 'Agendamento finalizado';
    }
    return 'Agendamento pausado';
  }

  const diff = new Date(task.nextRunAt).getTime() - nowTick;
  if (diff <= 0) {
    return 'Executando em instantes';
  }

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (days > 0) {
    return `Falta ${days}d ${hours}h`;
  }

  return `Falta ${hours}h ${minutes}m ${seconds}s`;
}

function normalizeParameters(value: Record<string, unknown>) {
  return Object.entries(value).reduce<Record<string, string | boolean>>(
    (acc, [key, item]) => {
      if (typeof item === 'boolean') {
        acc[key] = item;
      } else if (item != null) {
        acc[key] = String(item);
      }
      return acc;
    },
    {},
  );
}

function frequencyLabel(value: Draft['frequency']) {
  return {
    once: 'Uma vez',
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
  }[value];
}
