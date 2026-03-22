import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { AppConfig } from '../config.ts';
import { runMockAgent } from '../demo/mock-agent.ts';

const ABORT_KILL_TIMEOUT_MS = 1500;

export interface AgentRunResult {
  output: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
}

export class AgentRunner {
  private currentChild: ChildProcessWithoutNullStreams | null = null;
  private abortTimer: NodeJS.Timeout | null = null;
  private readonly config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  async run(prompt: string, iteration: number, agentCommand?: string): Promise<AgentRunResult> {
    if (this.config.mode === 'demo') {
      const output = await runMockAgent(prompt, iteration);
      return {
        output,
        exitCode: 0,
        signal: null,
      };
    }

    const command = agentCommand || this.config.agentCommand;
    const promptFilePath = join(this.config.stateDir, '.current-prompt.md');
    mkdirSync(this.config.stateDir, { recursive: true });
    writeFileSync(promptFilePath, prompt, 'utf8');

    const expandedCommand = command.replace(/\{PROMPT_FILE\}/g, promptFilePath);

    return new Promise((resolve, reject) => {
      const child = spawn(expandedCommand, {
        cwd: this.config.agentCwd,
        detached: process.platform !== 'win32',
        shell: true,
        stdio: 'pipe',
        env: {
          ...process.env,
          RALPH_ITERATION: String(iteration),
          RALPH_PROMPT_FILE: promptFilePath,
        },
      });

      this.currentChild = child;
      let output = '';

      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');

      child.stdout.on('data', (chunk: string) => {
        output += chunk;
      });
      child.stderr.on('data', (chunk: string) => {
        output += chunk;
      });
      child.on('error', (error) => {
        if (this.abortTimer) {
          clearTimeout(this.abortTimer);
          this.abortTimer = null;
        }
        this.currentChild = null;
        reject(error);
      });
      child.on('close', (exitCode, signal) => {
        if (this.abortTimer) {
          clearTimeout(this.abortTimer);
          this.abortTimer = null;
        }
        this.currentChild = null;
        resolve({ output, exitCode, signal });
      });

      child.stdin.write(prompt);
      child.stdin.end();
    });
  }

  abortCurrent(): void {
    if (!this.currentChild) {
      return;
    }

    this.killCurrent('SIGTERM');
    if (this.abortTimer) {
      clearTimeout(this.abortTimer);
    }
    this.abortTimer = setTimeout(() => {
      if (!this.currentChild || this.currentChild.killed) {
        return;
      }
      this.killCurrent('SIGKILL');
    }, ABORT_KILL_TIMEOUT_MS);
  }

  private killCurrent(signal: NodeJS.Signals): void {
    if (!this.currentChild) {
      return;
    }

    if (process.platform === 'win32' && typeof this.currentChild.pid === 'number') {
      spawnSync('taskkill', ['/pid', String(this.currentChild.pid), '/T', '/F'], {
        shell: true,
        windowsHide: true,
      });
      return;
    }

    if (process.platform !== 'win32' && typeof this.currentChild.pid === 'number') {
      try {
        process.kill(-this.currentChild.pid, signal);
        return;
      } catch {
        // Fall back to the direct child if the process group is already gone.
      }
    }

    this.currentChild.kill(signal);
  }
}
