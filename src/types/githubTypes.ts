import { Endpoints } from '@octokit/types';

type ListPullsResponse =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response'];
type GitHubPR = ListPullsResponse['data'][0];

export type DependabotPR = GitHubPR;

export interface PRdto {
  id: number;
  title: string;
  url: string;
  repo: string;
  createdAt: string;
  updatedAt: string;
}
