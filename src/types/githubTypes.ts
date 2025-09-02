import { Endpoints } from '@octokit/types';

type ListPullsResponse =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response'];
type GitHubPR = ListPullsResponse['data'][0];

export type DependabotPR = GitHubPR;
