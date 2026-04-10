export type UserRole = 'admin' | 'manager' | 'employee';

export type Department =
  | 'pessoal'
  | 'fiscal'
  | 'contabil'
  | 'tecnologia'
  | 'inovacao'
  | 'legalizacao'
  | 'certificacao'
  | 'auditoria'
  | 'rh';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departments: Department[];
};

export type ManagedUser = User & {
  isActive: boolean;
  createdAt: string;
};

export type SessionResponse = {
  token: string;
  user: User;
};

export type RobotSchemaField = {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
};

export type RobotSchemaFileInput = {
  name: string;
  label: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  helperText?: string;
};

export type RobotSchema = {
  fields: RobotSchemaField[];
  fileInputs: RobotSchemaFileInput[];
};

export type RobotInputExample = {
  id: string;
  robotId: string;
  fileInputName?: string | null;
  title?: string | null;
  description?: string | null;
  filename: string;
  storagePath: string;
  downloadName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  createdAt: string;
  downloadUrl: string;
};

export type ExecutionFile = {
  id: string;
  kind: string;
  filename: string;
  originalName?: string | null;
  downloadName?: string | null;
  storagePath: string;
  downloadUrl: string;
  createdAt: string;
};

export type ExecutionLog = {
  id: string;
  level: string;
  message: string;
  timestamp: string;
};

export type Robot = {
  id: string;
  slug: string;
  name: string;
  summary?: string | null;
  description?: string | null;
  category?: string | null;
  icon?: string | null;
  isActive: boolean;
  version: string;
  estimatedMinutes?: number | null;
  maxConcurrency?: number | null;
  manualSecondsPerUnit?: number | null;
  unitLabel?: string | null;
  unitMetricKey?: string | null;
  conflictKeys?: string | null;
  command?: string | null;
  workingDirectory?: string | null;
  allowedDepartments: Department[];
  schema?: RobotSchema;
  documentationUrl?: string | null;
  documentationLabel?: string | null;
  supportLabel?: string | null;
  supportValue?: string | null;
  dataPolicy?: string | null;
  executions?: Execution[];
  inputExamples?: RobotInputExample[];
};

export type Execution = {
  id: string;
  robotId: string;
  robot: Robot;
  status: 'queued' | 'running' | 'success' | 'error' | 'canceled';
  progress: number;
  currentStep?: string | null;
  errorMessage?: string | null;
  unitsProcessed?: number | null;
  manualEstimatedSeconds?: number | null;
  requestedByName?: string | null;
  requestedByEmail?: string | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  files: ExecutionFile[];
  logs: ExecutionLog[];
};

export type ScheduledTask = {
  id: string;
  name: string;
  robotId: string;
  robot: Robot;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    departments: Department[];
  };
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  timeOfDay: string;
  startDate?: string | null;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  timezone: string;
  notes?: string | null;
  parameters?: Record<string, unknown> | null;
  isActive: boolean;
  lastRunAt?: string | null;
  nextRunAt: string;
  lastError?: string | null;
  lastExecutionId?: string | null;
  lastExecutionStatus?: 'queued' | 'running' | 'success' | 'error' | 'canceled' | null;
  createdAt: string;
  updatedAt: string;
  templateFiles?: string[];
  hasTemplateFiles?: boolean;
};

export type HubOverview = {
  stats: {
    totalRobots: number;
    readyRobots: number;
    runningExecutions: number;
    successfulExecutions: number;
  };
  robots: Robot[];
  recentExecutions: Execution[];
};

export type TimeSavingsReport = {
  totals: {
    executions: number;
    savedSeconds: number;
    manualEstimatedSeconds: number;
    unitsProcessed: number;
  };
  byRobot: Array<{
    robotId: string;
    robotName: string;
    executions: number;
    savedSeconds: number;
    manualEstimatedSeconds: number;
    unitsProcessed: number;
  }>;
  byUser: Array<{
    userId: string;
    userName: string;
    executions: number;
    savedSeconds: number;
    manualEstimatedSeconds: number;
    unitsProcessed: number;
  }>;
  trend: Array<{
    day: string;
    savedSeconds: number;
    executions: number;
  }>;
  executions: Array<{
    id: string;
    createdAt: string;
    robotId: string;
    robotName: string;
    userId: string | null;
    userName: string;
    unitsProcessed: number;
    unitLabel: string;
    manualEstimatedSeconds: number;
    savedSeconds: number;
  }>;
};
