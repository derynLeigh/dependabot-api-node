import type { DependabotPR, PRdto } from "../types/githubTypes.js";
import type { AuthConfig } from "../types/auth.js";
import { createAppAuth } from "@octokit/auth-app";

export function toPRdto(pr: DependabotPR): PRdto {
  return {
    id: pr.id,
    title: pr.title,
    url: pr.html_url,
    repo: pr.head?.repo?.name ?? '',
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
  };
}

export async function getGitHubToken(config: AuthConfig): Promise<string> {
  console.log('createAppAuth:', createAppAuth);
  const auth = createAppAuth({
    appId: config.GITHUB_APP_ID,
    privateKey: config.GITHUB_PRIVATE_KEY,
  });
  // Debug logs to inspect the auth object
  console.log('auth type:', typeof auth); 
  console.log('auth value:', auth); 
  console.log('auth is function?', typeof auth === 'function');

  const { token } = await auth({
    type: "installation",
    installationId: config.GITHUB_INSTALLATION_ID,
  });
  
  return token;
}