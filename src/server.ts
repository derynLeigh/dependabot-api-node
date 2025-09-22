import express from 'express';
import cors from 'cors';
import type { AuthConfig } from './types/auth.js';
import { fetchAllDependabotPRs } from './utils/gitHubHelpers.js';
import { Server } from 'http';
import { createScheduler } from './utils/scheduler.js';
import { getSchedulerConfig } from './utils/schedulerConfig.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

function getEnvConfig(): AuthConfig {
  const config: AuthConfig = {
    GITHUB_APP_ID: process.env.GITHUB_APP_ID as string,
    GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY as string,
    GITHUB_INSTALLATION_ID: process.env.GITHUB_INSTALLATION_ID as string,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return config;
}

export function createApp(): express.Express {
  const app = express();

  app.use(cors());

  app.get('/api/prs', async (req, res) => {
    try {
      const config = getEnvConfig();
      const owner = process.env.GITHUB_OWNER || 'derynLeigh';
      const repos = process.env.GITHUB_REPOS
        ? process.env.GITHUB_REPOS.split(',').map(r => r.trim())
        : ['techronymsService', 'techronyms-user-service', 'dependabot-pr-summariser'];

      const result = await fetchAllDependabotPRs(config, owner, repos);

      res.json({
        data: result.data,
        errors: result.errors,
        count: result.count,
        generatedAt: new Date().toISOString(),
        summary: {
          totalReposQueried: repos.length,
          successfulRepos: repos.length - result.errors.length,
          failedRepos: result.errors.length
        }
      });
    } catch (error) {
      res.status(500).json({
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
        generatedAt: new Date().toISOString()
      });
    }
  });

  return app;
}

let schedulerInstance: Awaited<ReturnType<typeof createScheduler>> | null =
  null;

async function startScheduler(): Promise<void> {
  if (process.env.ENABLE_SCHEDULER === 'true') {
    const config = getSchedulerConfig();
    schedulerInstance = await createScheduler(config);

    console.log(`Scheduler started with cron: ${config.cronSchedule}`);
    console.log(`Results will be saved to: ${config.outputPath}`);
  }
}

export function stopScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
    console.log('Scheduler stopped');
  }
}

export function startServer(): Server {
  const app = createApp();
  const server = app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    await startScheduler();
  });
  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
