
import type { AuthConfig } from '../types/auth.js';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { DependabotPR, PRdto, FetchAllResult, RepoError } from '../types/gitHubTypes.js';

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
    type: 'installation',
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
    state: 'open',
  });

  return data.filter(pr => pr.user?.login === 'dependabot[bot]') as DependabotPR[];
}

export async function fetchAllDependabotPRs(
  config: AuthConfig,
  owner: string,
  repos: string[],
): Promise<FetchAllResult> {
  const token = await getGitHubToken(config);
  const errors: RepoError[] = [];
  const allPRs: PRdto[] = [];

  const results = await Promise.allSettled(
    repos.map(async (repo) => {
      try {
        const prs = await fetchDependabotPRs(token, owner, repo);
        return prs.map(toPRdto);
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error(`Failed to fetch PRs from repo "${repo}":`, err);
        
        errors.push({
          repo,
          error,
        });
        
        return [] as PRdto[];
      }
    }),
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allPRs.push(...result.value);
    }
  });

  return {
    data: allPRs,
    errors,
    count: allPRs.length,
  };
}