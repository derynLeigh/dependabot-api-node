import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import type { AuthConfig } from '../types/auth.js';
import type { PRdto } from '../types/ui-pr.js';
import type { DependabotPR } from '../types/githubTypes.js';

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
  return data.filter(
    (pr): pr is DependabotPR => pr.user?.login === 'dependabot[bot]'
  );
}

export async function fetchAllDependabotPRs(
  config: AuthConfig,
  owner: string,
  repos: string[],
): Promise<PRdto[]> {
  const token = await getGitHubToken(config);

  const results = await Promise.all(
    repos.map(async (repo) => {
      try {
        const prs = await fetchDependabotPRs(token, owner, repo);
        return prs.map(toPRdto);
      } catch (err) {
        console.error(`Failed to fetch PRs from repo "${repo}":`, err);
        return [] as PRdto[];
      }
    }),
  );
  return results.flat();
}

