import { Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { DEPARTMENT_OPTIONS, ROLE_LABELS } from '../lib/constants';
import { api } from '../lib/api';
import type {
  Department,
  ManagedUser,
  Robot,
  RobotInputExample,
  RobotSchemaField,
  RobotSchemaFileInput,
  UserRole,
} from '../lib/types';
import { departmentLabel, userFileName } from '../lib/utils';

type Draft = {
  id?: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  category: string;
  icon: string;
  isActive: boolean;
  version: string;
  maxConcurrency: string;
  manualSecondsPerUnit: string;
  unitLabel: string;
  unitMetricKey: string;
  conflictKeys: string;
  command: string;
  workingDirectory: string;
  allowedDepartments: Department[];
  documentationUrl: string;
  documentationLabel: string;
  supportLabel: string;
  supportValue: string;
  dataPolicy: string;
  fields: RobotSchemaField[];
  fileInputs: RobotSchemaFileInput[];
};

export function SettingsPage() {
  const { user } = useAuth();
  const { hub, notify, refreshHub, search } = useHub();
  const robots = hub?.robots ?? [];
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [activeTab, setActiveTab] = useState<'robots' | 'users'>('robots');
  const [exampleFile, setExampleFile] = useState<File | null>(null);
  const [exampleInputName, setExampleInputName] = useState('');
  const [exampleTitle, setExampleTitle] = useState('');
  const [exampleDescription, setExampleDescription] = useState('');

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedRobotId && !isCreatingNew && robots[0]) {
      setSelectedRobotId(robots[0].id);
    }
  }, [isCreatingNew, robots, selectedRobotId]);

  useEffect(() => {
    const robot = robots.find((item) => item.id === selectedRobotId);
    setDraft(robot ? mapRobotToDraft(robot) : emptyDraft());
  }, [robots, selectedRobotId]);

  useEffect(() => {
    setExampleFile(null);
    setExampleInputName('');
    setExampleTitle('');
    setExampleDescription('');
  }, [selectedRobotId]);

  useEffect(() => {
    if (selectedRobotId) {
      setIsCreatingNew(false);
    }
  }, [selectedRobotId]);

  const selectedRobot = useMemo(
    () => robots.find((robot) => robot.id === selectedRobotId) ?? null,
    [robots, selectedRobotId],
  );
  const searchTerm = search.trim().toLowerCase();
  const filteredRobots = useMemo(
    () =>
      robots.filter((robot) => {
        if (!searchTerm) return true;
        return (
          robot.name.toLowerCase().includes(searchTerm) ||
          (robot.category ?? '').toLowerCase().includes(searchTerm) ||
          (robot.summary ?? '').toLowerCase().includes(searchTerm)
        );
      }),
    [robots, searchTerm],
  );
  const filteredUsers = useMemo(
    () =>
      users.filter((managedUser) => {
        if (!searchTerm) return true;
        return (
          managedUser.name.toLowerCase().includes(searchTerm) ||
          managedUser.email.toLowerCase().includes(searchTerm) ||
          ROLE_LABELS[managedUser.role].toLowerCase().includes(searchTerm) ||
          managedUser.departments.some((department) =>
            departmentLabel(department).toLowerCase().includes(searchTerm),
          )
        );
      }),
    [searchTerm, users],
  );

  async function loadUsers() {
    try {
      const data = await api<ManagedUser[]>('/users');
      setUsers(data);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Não foi possível carregar os usuários.');
    }
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Administração"
        title={
          <>
            Governança do{' '}
            <span className="text-sky-600 dark:text-sky-400">hub</span>
          </>
        }
        description="Gerencie robôs, departamentos e perfis de acesso da Controller em um único lugar."
        badge={<PageHeaderBadge>{robots.length} automações cadastradas</PageHeaderBadge>}
        actions={
          activeTab === 'robots' ? (
            <>
              {draft.id ? (
                <Button
                  variant="danger"
                  onClick={async () => {
                    const confirmed = window.confirm(`Deseja excluir a automação "${draft.name}"?`);
                    if (!confirmed || !draft.id) return;

                    try {
                      await api(`/robots/${draft.id}`, { method: 'DELETE' });
                      await refreshHub();
                      setIsCreatingNew(false);
                      setSelectedRobotId(null);
                      notify('Automação excluída com sucesso.');
                    } catch (error) {
                      notify(error instanceof Error ? error.message : 'Não foi possível excluir a automação.');
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              ) : null}

              <Button
                onClick={() => {
                  setIsCreatingNew(true);
                  setSelectedRobotId(null);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova automação
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-3">
        <Button variant={activeTab === 'robots' ? 'default' : 'outline'} onClick={() => setActiveTab('robots')}>
          Automações
        </Button>
        <Button variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')}>
          Contas
        </Button>
      </div>

      {activeTab === 'robots' ? (
        <div className="grid gap-6 xl:grid-cols-[340px_1fr] xl:items-start">
          <Card className="h-fit rounded-3xl">
            <CardHeader>
              <CardTitle>Workspace das automações</CardTitle>
              <CardDescription>Selecione um robô para editar ou crie um novo cadastro.</CardDescription>
            </CardHeader>
            <CardContent className="grid max-h-[62vh] gap-2.5 overflow-y-auto">
              {filteredRobots.map((robot) => (
                <button
                  key={robot.id}
                  type="button"
                  className={[
                    'grid gap-1.5 rounded-2xl border px-4 py-3 text-left transition',
                    robot.id === selectedRobot?.id
                      ? 'border-sky-300 bg-sky-50 text-slate-950 shadow-sm dark:border-[#2b2b31] dark:bg-[#151518] dark:text-white'
                      : 'border-slate-300 bg-white hover:bg-slate-50 dark:border-[#2b2b31] dark:bg-[#111113] dark:hover:bg-[#18181b]',
                  ].join(' ')}
                  onClick={() => {
                    setIsCreatingNew(false);
                    setSelectedRobotId(robot.id);
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="truncate">{robot.name}</strong>
                    <Badge variant={robot.isActive ? 'success' : 'muted'}>
                      {robot.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <span className="text-sm opacity-80">{robot.category || 'Sem categoria'}</span>
                </button>
              ))}
              {filteredRobots.length === 0 ? (
                <p className="px-1 text-sm text-slate-500 dark:text-slate-400">
                  Nenhuma automação encontrada para a busca atual.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {renderRobotsTab({
            draft,
            selectedRobot,
            setDraft,
            refreshHub,
            notify,
            setSelectedRobotId,
            exampleFile,
            setExampleFile,
            exampleInputName,
            setExampleInputName,
            exampleTitle,
            setExampleTitle,
            exampleDescription,
            setExampleDescription,
          })}
        </div>
      ) : (
        renderUsersTab({ users: filteredUsers, setUsers, notify, loadUsers })
      )}
    </div>
  );
}

function DepartmentPicker({
  selected,
  onToggle,
}: {
  selected: Department[];
  onToggle: (department: Department) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {DEPARTMENT_OPTIONS.map((department) => {
        const active = selected.includes(department.value);

        return (
          <button
            key={department.value}
            type="button"
            className={[
              'rounded-2xl border px-4 py-3 text-left text-sm transition',
              active
                ? 'border-sky-300 bg-sky-50 text-slate-950 dark:border-[#2b2b31] dark:bg-[#151518] dark:text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#2b2b31] dark:bg-[#111113] dark:text-slate-200 dark:hover:bg-[#18181b]',
            ].join(' ')}
            onClick={() => onToggle(department.value)}
          >
            {department.label}
          </button>
        );
      })}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="grid gap-5">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {children}
      <Separator />
    </div>
  );
}

function BuilderSection({
  title,
  description,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <Button variant="outline" onClick={onAdd}>
          Adicionar
        </Button>
      </div>
      <div className="grid gap-4">{children}</div>
      <Separator />
    </div>
  );
}

function renderRobotsTab({
  draft,
  selectedRobot,
  setDraft,
  refreshHub,
  notify,
  setSelectedRobotId,
  exampleFile,
  setExampleFile,
  exampleInputName,
  setExampleInputName,
  exampleTitle,
  setExampleTitle,
  exampleDescription,
  setExampleDescription,
}: {
  draft: Draft;
  selectedRobot: Robot | null;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  refreshHub: () => Promise<void>;
  notify: (message: string) => void;
  setSelectedRobotId: (value: string | null) => void;
  exampleFile: File | null;
  setExampleFile: React.Dispatch<React.SetStateAction<File | null>>;
  exampleInputName: string;
  setExampleInputName: React.Dispatch<React.SetStateAction<string>>;
  exampleTitle: string;
  setExampleTitle: React.Dispatch<React.SetStateAction<string>>;
  exampleDescription: string;
  setExampleDescription: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Badge className="border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/35 dark:bg-slate-800 dark:text-slate-200">
          {draft.name || 'Nova automação'}
        </Badge>
        <Badge className="border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-950 dark:text-indigo-200">
          Concorrência: {draft.maxConcurrency || '1'}
        </Badge>
        <Badge className="border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/40 dark:bg-sky-950 dark:text-sky-200">
          Pasta: {draft.workingDirectory || 'Não definida'}
        </Badge>
        <Badge className="border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/35 dark:bg-slate-800 dark:text-slate-200">
          Acesso: {draft.allowedDepartments.length > 0 ? `${draft.allowedDepartments.length} dept.` : 'Todos'}
        </Badge>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>{draft.id ? 'Editar automação' : 'Nova automação'}</CardTitle>
          <CardDescription>Preencha os dados abaixo para publicar a automação no hub.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8">
          <Section title="Identidade" description="Como essa automação aparece no catálogo.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome">
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </Field>
              <Field label="Slug">
                <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
              </Field>
              <Field label="Categoria">
                <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
              </Field>
              <Field label="Ícone">
                <select
                  className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100 dark:focus:ring-sky-900/35"
                  value={draft.icon}
                  onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                >
                  {['bot', 'bank', 'receipt', 'chart'].map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Versão">
                <Input value={draft.version} onChange={(e) => setDraft({ ...draft, version: e.target.value })} />
              </Field>
              <Field className="md:col-span-2" label="Resumo">
                <Input value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
              </Field>
              <Field className="md:col-span-2" label="Descrição">
                <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </Field>
            </div>
          </Section>

          <Section title="Acesso e orquestração" description="Quem pode ver o robô e como o runner deve tratá-lo.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Concorrência máxima" hint="Quantas execuções desse robô podem rodar ao mesmo tempo.">
                <Input type="number" min="1" value={draft.maxConcurrency} onChange={(e) => setDraft({ ...draft, maxConcurrency: e.target.value })} />
              </Field>
              <Field label="Grupos de conflito" hint="Tags separadas por vírgula para impedir robôs diferentes de rodarem juntos.">
                <Input value={draft.conflictKeys} onChange={(e) => setDraft({ ...draft, conflictKeys: e.target.value })} placeholder="Ex: sefaz, conta-fiscal" />
              </Field>
              <Field className="md:col-span-2" label="Departamentos com acesso" hint="Se nada for marcado, a automação ficará visível para toda a empresa.">
                <DepartmentPicker
                  selected={draft.allowedDepartments}
                  onToggle={(department) =>
                    setDraft((current) => ({
                      ...current,
                      allowedDepartments: current.allowedDepartments.includes(department)
                        ? current.allowedDepartments.filter((item) => item !== department)
                        : [...current.allowedDepartments, department],
                    }))
                  }
                />
              </Field>
              <Field className="md:col-span-2" label="Comando de execução">
                <Input value={draft.command} onChange={(e) => setDraft({ ...draft, command: e.target.value })} />
              </Field>
              <Field className="md:col-span-2" label="Pasta de execução">
                <Input value={draft.workingDirectory} onChange={(e) => setDraft({ ...draft, workingDirectory: e.target.value })} />
              </Field>
              <Field label="Status">
                <select
                  className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100 dark:focus:ring-sky-900/35"
                  value={String(draft.isActive)}
                  onChange={(e) => setDraft({ ...draft, isActive: e.target.value === 'true' })}
                >
                  <option value="true">Ativa</option>
                  <option value="false">Inativa</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section
            title="Métrica de tempo ganho"
            description="Defina quanto tempo o processo manual levaria para calcular automaticamente a economia."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tempo manual por unidade (segundos)">
                <Input
                  type="number"
                  min="0"
                  value={draft.manualSecondsPerUnit}
                  onChange={(event) =>
                    setDraft({ ...draft, manualSecondsPerUnit: event.target.value })
                  }
                />
              </Field>
              <Field label="Nome da unidade">
                <Input
                  value={draft.unitLabel}
                  placeholder="Ex: empresa, nota, cliente"
                  onChange={(event) => setDraft({ ...draft, unitLabel: event.target.value })}
                />
              </Field>
              <Field className="md:col-span-2" label="Chave da métrica no robô">
                <Input
                  value={draft.unitMetricKey}
                  placeholder="Ex: itens_processados (AH_METRIC|itens_processados|100)"
                  onChange={(event) =>
                    setDraft({ ...draft, unitMetricKey: event.target.value })
                  }
                />
              </Field>
            </div>
          </Section>

          <Section title="Recursos e suporte" description="Informações complementares exibidas para o usuário final.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Label da documentação">
                <Input value={draft.documentationLabel} onChange={(e) => setDraft({ ...draft, documentationLabel: e.target.value })} />
              </Field>
              <Field className="md:col-span-2" label="Link da documentação">
                <Input value={draft.documentationUrl} onChange={(e) => setDraft({ ...draft, documentationUrl: e.target.value })} />
              </Field>
              <Field label="Label do suporte">
                <Input value={draft.supportLabel} onChange={(e) => setDraft({ ...draft, supportLabel: e.target.value })} />
              </Field>
              <Field label="Contato do suporte">
                <Input value={draft.supportValue} onChange={(e) => setDraft({ ...draft, supportValue: e.target.value })} />
              </Field>
              <Field className="md:col-span-2" label="Política de dados">
                <Textarea value={draft.dataPolicy} onChange={(e) => setDraft({ ...draft, dataPolicy: e.target.value })} />
              </Field>
            </div>
          </Section>

          <BuilderSection
            title="Campos do formulário"
            description="Monte os parâmetros que o usuário deverá preencher antes de executar o robô."
            onAdd={() =>
              setDraft((current) => ({
                ...current,
                fields: [
                  ...current.fields,
                  { name: '', label: '', type: 'text', required: false, placeholder: '', options: [], defaultValue: '' },
                ],
              }))
            }
          >
            {draft.fields.map((field, index) => (
              <FieldBuilderRow
                key={`field-${index}`}
                field={field}
                onChange={(next) =>
                  setDraft((current) => ({
                    ...current,
                    fields: current.fields.map((item, itemIndex) => (itemIndex === index ? next : item)),
                  }))
                }
                onRemove={() =>
                  setDraft((current) => ({
                    ...current,
                    fields: current.fields.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
              />
            ))}
          </BuilderSection>

          <BuilderSection
            title="Uploads de arquivo"
            description="Configure arquivos obrigatórios ou opcionais enviados pelo usuário."
            onAdd={() =>
              setDraft((current) => ({
                ...current,
                fileInputs: [
                  ...current.fileInputs,
                  { name: '', label: '', accept: '', multiple: false, required: false, helperText: '' },
                ],
              }))
            }
          >
            {draft.fileInputs.map((fileInput, index) => (
              <FileInputBuilderRow
                key={`file-${index}`}
                fileInput={fileInput}
                onChange={(next) =>
                  setDraft((current) => ({
                    ...current,
                    fileInputs: current.fileInputs.map((item, itemIndex) => (itemIndex === index ? next : item)),
                  }))
                }
                onRemove={() =>
                  setDraft((current) => ({
                    ...current,
                    fileInputs: current.fileInputs.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
              />
            ))}
          </BuilderSection>

          <Section
            title="Modelos de entrada"
            description="Anexe arquivos-exemplo e instruções para o usuário preencher os uploads corretamente."
          >
            {draft.id ? (
              <div className="grid gap-4 rounded-3xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Arquivo modelo">
                    <Input
                      type="file"
                      onChange={(event) => setExampleFile(event.target.files?.[0] ?? null)}
                    />
                  </Field>
                  <Field label="Relacionado ao upload">
                    <select
                      className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100 dark:focus:ring-sky-900/35"
                      value={exampleInputName}
                      onChange={(event) => setExampleInputName(event.target.value)}
                    >
                      <option value="">Geral (vale para qualquer upload)</option>
                      {draft.fileInputs.map((fileInput) => (
                        <option key={fileInput.name} value={fileInput.name}>
                          {fileInput.label || fileInput.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Título">
                    <Input
                      value={exampleTitle}
                      placeholder="Ex: Planilha de notas fiscais"
                      onChange={(event) => setExampleTitle(event.target.value)}
                    />
                  </Field>
                  <Field className="md:col-span-2" label="Instruções">
                    <Textarea
                      value={exampleDescription}
                      placeholder="Ex: Deve conter as colunas CNPJ, UF e Valor."
                      onChange={(event) => setExampleDescription(event.target.value)}
                    />
                  </Field>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!draft.id) return;
                      if (!exampleFile) {
                        notify('Selecione um arquivo modelo para enviar.');
                        return;
                      }

                      try {
                        const formData = new FormData();
                        formData.append('file', exampleFile);
                        if (exampleInputName) formData.append('fileInputName', exampleInputName);
                        if (exampleTitle.trim()) formData.append('title', exampleTitle.trim());
                        if (exampleDescription.trim()) {
                          formData.append('description', exampleDescription.trim());
                        }

                        await api(`/robots/${draft.id}/examples`, {
                          method: 'POST',
                          body: formData,
                        });
                        await refreshHub();
                        setExampleFile(null);
                        setExampleInputName('');
                        setExampleTitle('');
                        setExampleDescription('');
                        notify('Modelo de entrada enviado.');
                      } catch (error) {
                        notify(error instanceof Error ? error.message : 'Não foi possível enviar o modelo.');
                      }
                    }}
                  >
                    Enviar modelo
                  </Button>
                </div>

                <div className="grid gap-3">
                  {(selectedRobot?.inputExamples ?? []).length > 0 ? (
                    selectedRobot?.inputExamples?.map((example) => (
                      <InputExampleRow
                        key={example.id}
                        example={example}
                        onDelete={async () => {
                          if (!draft.id) return;
                          try {
                            await api(`/robots/${draft.id}/examples/${example.id}`, {
                              method: 'DELETE',
                            });
                            await refreshHub();
                            notify('Modelo removido.');
                          } catch (error) {
                            notify(error instanceof Error ? error.message : 'Não foi possível remover o modelo.');
                          }
                        }}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Nenhum modelo anexado.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Salve a automação primeiro para anexar modelos de arquivo.
              </p>
            )}
          </Section>

          <div className="flex justify-end">
            <Button
              onClick={async () => {
                try {
                  const saved = await api<Robot>('/robots', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: draft.id,
                      slug: draft.slug,
                      name: draft.name,
                      summary: draft.summary,
                      description: draft.description,
                      category: draft.category,
                      icon: draft.icon,
                      isActive: draft.isActive,
                      version: draft.version,
                      maxConcurrency: draft.maxConcurrency,
                      manualSecondsPerUnit: draft.manualSecondsPerUnit,
                      unitLabel: draft.unitLabel,
                      unitMetricKey: draft.unitMetricKey,
                      conflictKeys: draft.conflictKeys,
                      command: draft.command,
                      workingDirectory: draft.workingDirectory,
                      allowedDepartments: draft.allowedDepartments,
                      documentationUrl: draft.documentationUrl,
                      documentationLabel: draft.documentationLabel,
                      supportLabel: draft.supportLabel,
                      supportValue: draft.supportValue,
                      dataPolicy: draft.dataPolicy,
                      schema: { fields: draft.fields, fileInputs: draft.fileInputs },
                    }),
                  });
                  await refreshHub();
                  setSelectedRobotId(saved.id);
                  notify('Automação salva com sucesso.');
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Não foi possível salvar a automação.');
                }
              }}
            >
              Salvar automação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function renderUsersTab({
  users,
  setUsers,
  notify,
  loadUsers,
}: {
  users: ManagedUser[];
  setUsers: React.Dispatch<React.SetStateAction<ManagedUser[]>>;
  notify: (message: string) => void;
  loadUsers: () => Promise<void>;
}) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Hierarquias e departamentos
        </CardTitle>
        <CardDescription>Todo novo cadastro nasce como funcionário. Aqui o admin promove, desativa e ajusta departamentos.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {users.map((managedUser) => (
          <div key={managedUser.id} className="grid gap-4 rounded-3xl border border-slate-300 p-5 dark:border-[#2b2b31]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="font-medium">{managedUser.name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{managedUser.email}</div>
                <div className="flex flex-wrap gap-2">
                  {managedUser.departments.map((department) => (
                    <Badge key={department} variant="muted">
                      {departmentLabel(department)}
                    </Badge>
                  ))}
                </div>
              </div>
              <Badge variant={managedUser.isActive ? 'success' : 'muted'}>
                {managedUser.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Hierarquia">
                <select
                  className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100 dark:focus:ring-sky-900/35"
                  value={managedUser.role}
                  onChange={(event) =>
                    setUsers((current) =>
                      current.map((item) =>
                        item.id === managedUser.id
                          ? { ...item, role: event.target.value as UserRole }
                          : item,
                      ),
                    )
                  }
                >
                  {(['admin', 'manager', 'employee'] as UserRole[]).map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100 dark:focus:ring-sky-900/35"
                  value={String(managedUser.isActive)}
                  onChange={(event) =>
                    setUsers((current) =>
                      current.map((item) =>
                        item.id === managedUser.id
                          ? { ...item, isActive: event.target.value === 'true' }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </Field>
              <Field className="md:col-span-2" label="Departamentos">
                <DepartmentPicker
                  selected={managedUser.departments}
                  onToggle={(department) =>
                    setUsers((current) =>
                      current.map((item) =>
                        item.id === managedUser.id
                          ? {
                              ...item,
                              departments: item.departments.includes(department)
                                ? item.departments.filter((entry) => entry !== department)
                                : [...item.departments, department],
                            }
                          : item,
                      ),
                    )
                  }
                />
              </Field>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await api(`/users/${managedUser.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        role: managedUser.role,
                        departments: managedUser.departments,
                        isActive: managedUser.isActive,
                      }),
                    });
                    notify(`Acesso de ${managedUser.name} atualizado.`);
                    await loadUsers();
                  } catch (error) {
                    notify(error instanceof Error ? error.message : 'Não foi possível atualizar o usuário.');
                  }
                }}
              >
                Salvar acesso
              </Button>
            </div>
          </div>
        ))}
        {users.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhuma conta encontrada para a busca atual.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InputExampleRow({
  example,
  onDelete,
}: {
  example: RobotInputExample;
  onDelete: () => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-800">
      <div className="min-w-0 space-y-1">
        <div className="truncate text-sm font-medium">
          {example.title || userFileName(example.downloadName || example.filename)}
        </div>
        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
          {example.fileInputName ? `Upload: ${example.fileInputName}` : 'Modelo geral'}
        </div>
        {example.description ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{example.description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <a
            href={example.downloadUrl}
            download={userFileName(example.downloadName || example.filename)}
          >
            Baixar
          </a>
        </Button>
        <Button variant="danger" onClick={() => void onDelete()}>
          Remover
        </Button>
      </div>
    </div>
  );
}

function FieldBuilderRow({ field, onChange, onRemove }: { field: RobotSchemaField; onChange: (value: RobotSchemaField) => void; onRemove: () => void }) {
  return (
    <div className="grid gap-4 rounded-3xl border border-slate-200 p-5 dark:border-slate-800">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome interno">
          <Input value={field.name} onChange={(e) => onChange({ ...field, name: e.target.value })} />
        </Field>
        <Field label="Label">
          <Input value={field.label} onChange={(e) => onChange({ ...field, label: e.target.value })} />
        </Field>
        <Field label="Tipo">
          <select
            className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-[#2b2b31] dark:bg-[#0f0f10] dark:text-zinc-100 dark:focus:ring-sky-900/35"
            value={field.type}
            onChange={(e) => onChange({ ...field, type: e.target.value })}
          >
            {['text', 'date', 'select', 'radio', 'textarea', 'checkbox'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Valor padrão">
          <Input value={field.defaultValue || ''} onChange={(e) => onChange({ ...field, defaultValue: e.target.value })} />
        </Field>
        <Field className="md:col-span-2" label="Placeholder">
          <Input value={field.placeholder || ''} onChange={(e) => onChange({ ...field, placeholder: e.target.value })} />
        </Field>
        <Field className="md:col-span-2" label="Opções">
          <Input
            value={(field.options || []).join(', ')}
            onChange={(e) =>
              onChange({
                ...field,
                options: e.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(field.required)} onChange={(e) => onChange({ ...field, required: e.target.checked })} />
          Obrigatório
        </label>
        <Button variant="danger" onClick={onRemove}>
          Remover campo
        </Button>
      </div>
    </div>
  );
}

function FileInputBuilderRow({ fileInput, onChange, onRemove }: { fileInput: RobotSchemaFileInput; onChange: (value: RobotSchemaFileInput) => void; onRemove: () => void }) {
  return (
    <div className="grid gap-4 rounded-3xl border border-slate-200 p-5 dark:border-slate-800">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome interno">
          <Input value={fileInput.name} onChange={(e) => onChange({ ...fileInput, name: e.target.value })} />
        </Field>
        <Field label="Label">
          <Input value={fileInput.label} onChange={(e) => onChange({ ...fileInput, label: e.target.value })} />
        </Field>
        <Field className="md:col-span-2" label="Tipos aceitos">
          <Input value={fileInput.accept || ''} onChange={(e) => onChange({ ...fileInput, accept: e.target.value })} />
        </Field>
        <Field className="md:col-span-2" label="Texto de ajuda">
          <Input value={fileInput.helperText || ''} onChange={(e) => onChange({ ...fileInput, helperText: e.target.value })} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={Boolean(fileInput.multiple)} onChange={(e) => onChange({ ...fileInput, multiple: e.target.checked })} />
            Permitir múltiplos arquivos
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={Boolean(fileInput.required)} onChange={(e) => onChange({ ...fileInput, required: e.target.checked })} />
            Obrigatório
          </label>
        </div>
        <Button variant="danger" onClick={onRemove}>
          Remover upload
        </Button>
      </div>
    </div>
  );
}

function emptyDraft(): Draft {
  return {
    slug: '',
    name: '',
    summary: '',
    description: '',
    category: '',
    icon: 'bot',
    isActive: true,
    version: '1.0.0',
    maxConcurrency: '1',
    manualSecondsPerUnit: '0',
    unitLabel: 'item',
    unitMetricKey: 'itens_processados',
    conflictKeys: '',
    command: '',
    workingDirectory: '',
    allowedDepartments: [],
    documentationUrl: '',
    documentationLabel: 'Documentação',
    supportLabel: 'Suporte',
    supportValue: '',
    dataPolicy: '',
    fields: [],
    fileInputs: [],
  };
}

function mapRobotToDraft(robot: Robot): Draft {
  return {
    id: robot.id,
    slug: robot.slug ?? '',
    name: robot.name ?? '',
    summary: robot.summary ?? '',
    description: robot.description ?? '',
    category: robot.category ?? '',
    icon: robot.icon ?? 'bot',
    isActive: Boolean(robot.isActive),
    version: robot.version ?? '1.0.0',
    maxConcurrency: robot.maxConcurrency?.toString() ?? '1',
    manualSecondsPerUnit: robot.manualSecondsPerUnit?.toString() ?? '0',
    unitLabel: robot.unitLabel ?? 'item',
    unitMetricKey: robot.unitMetricKey ?? 'itens_processados',
    conflictKeys: robot.conflictKeys ?? '',
    command: robot.command ?? '',
    workingDirectory: robot.workingDirectory ?? '',
    allowedDepartments: robot.allowedDepartments ?? [],
    documentationUrl: robot.documentationUrl ?? '',
    documentationLabel: robot.documentationLabel ?? 'Documentação',
    supportLabel: robot.supportLabel ?? 'Suporte',
    supportValue: robot.supportValue ?? '',
    dataPolicy: robot.dataPolicy ?? '',
    fields: Array.isArray(robot.schema?.fields) ? robot.schema.fields : [],
    fileInputs: Array.isArray(robot.schema?.fileInputs) ? robot.schema.fileInputs : [],
  };
}
