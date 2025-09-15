import type { DependabotPR, PRdto } from "../types/githubTypes.js";
import type { AuthConfig } from "../types/auth.js";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

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
  const auth = createAppAuth({
    appId: config.GITHUB_APP_ID,
    privateKey: config.GITHUB_PRIVATE_KEY,
  });

  const { token } = await auth({
    type: "installation",
    installationId: config.GITHUB_INSTALLATION_ID,
  });
  
  return token;
}

export async function fetchDependabotPRs(
  token: string,
  owner: string,
  repo: string
): Promise<DependabotPR[]> {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: "open",
  });

  return data.filter(pr => pr.user?.login === 'dependabot[bot]');
}