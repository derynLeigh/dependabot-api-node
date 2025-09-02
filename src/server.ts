import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import type { AuthConfig } from './types/auth.js';
import { errorHandler, handleErrorResponse } from './utils/errorHandler.js';
import { fetchAllDependabotPRs } from './utils/gitHubHelpers.js';
import { Server } from 'http';

dotenv.config();

const app = express();
const PORT = 8080;

type EnvConfig = AuthConfig;

function getEnvConfig(): EnvConfig {
  const config: AuthConfig = {
    GITHUB_APP_ID: process.env.GITHUB_APP_ID!,
    GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY!,
    GITHUB_INSTALLATION_ID: process.env.GITHUB_INSTALLATION_ID!,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  return config;
}

app.use(cors());

app.get('/api/prs', async (_req, res) => {
  try {
    const config = getEnvConfig();
    const prs = await fetchAllDependabotPRs(config, 'derynLeigh', [
      'techronymsService',
      'techronyms-user-service',
      'dependabot-pr-summariser',
    ]);
    res.json({
      data: prs,
      generatedAt: new Date().toISOString(),
      count: prs.length,
    });
  } catch (error) {
    handleErrorResponse(res, error, { request: _req });
  }
});

app.use(errorHandler);

export default app;

export function startServer(): Server {
  return app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
