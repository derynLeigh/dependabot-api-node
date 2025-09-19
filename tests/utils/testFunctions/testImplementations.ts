import type { AuthConfig, RepoError, FetchAllResult, PRdto, DependabotPR } from '../types/testTypes.js';

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

export async function fetchAllDependabotPRs(
  config: AuthConfig,
  owner: string,
  repos: string[],
  getToken: (config: AuthConfig) => Promise<string>,
  fetchPRs: (token: string, owner: string, repo: string) => Promise<DependabotPR[]>
): Promise<FetchAllResult> {
  const token = await getToken(config);
  const errors: RepoError[] = [];
  const allPRs: PRdto[] = [];

  const results = await Promise.allSettled(
    repos.map(async (repo) => {
      try {
        const prs = await fetchPRs(token, owner, repo);
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