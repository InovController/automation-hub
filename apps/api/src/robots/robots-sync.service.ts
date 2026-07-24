import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 min

@Injectable()
export class RobotsSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RobotsSyncService.name);
  private timer?: NodeJS.Timeout;
  private syncing = false;
  private lastSyncAt: Date | null = null;
  private lastSyncStatus: 'success' | 'error' | 'idle' = 'idle';
  private lastSyncOutput = '';

  private get repoDir() {
    return process.env.ROBOTS_REPO_DIR ?? '';
  }

  private get gitSafeDirectory() {
    return this.repoDir.replace(/\\/g, '/');
  }

  isConfigured() {
    return !!this.repoDir;
  }

  onModuleInit() {
    if (!this.isConfigured()) return;
    void this.sync();
    this.timer = setInterval(() => void this.sync(), SYNC_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  getStatus() {
    return {
      configured: this.isConfigured(),
      repoDir: this.repoDir || null,
      syncing: this.syncing,
      lastSyncStatus: this.lastSyncStatus,
      lastSyncAt: this.lastSyncAt?.toISOString() ?? null,
      lastSyncOutput: this.lastSyncOutput,
    };
  }

  async sync() {
    if (!this.isConfigured()) {
      return { status: 'error', output: 'ROBOTS_REPO_DIR não configurado.' };
    }
    if (this.syncing) {
      return { status: 'syncing', output: 'Sincronização já em andamento.' };
    }

    this.syncing = true;
    try {
      const { stdout, stderr } = await execFileAsync(
        'git',
        ['-c', `safe.directory=${this.gitSafeDirectory}`, 'pull', '--ff-only'],
        {
        cwd: this.repoDir,
        timeout: 30_000,
        },
      );
      const output = (stdout || stderr || 'Already up to date.').trim();
      this.lastSyncStatus = 'success';
      this.lastSyncAt = new Date();
      this.lastSyncOutput = output;
      this.logger.log(`Sync OK: ${output}`);
      return { status: 'success', output };
    } catch (error) {
      const output = (error instanceof Error ? error.message : String(error)).slice(0, 500);
      this.lastSyncStatus = 'error';
      this.lastSyncAt = new Date();
      this.lastSyncOutput = output;
      this.logger.error(`Sync error: ${output}`);
      return { status: 'error', output };
    } finally {
      this.syncing = false;
    }
  }
}
