export interface GitHubUser {
  login: string;
  id: number;
  type: string;
}

export interface DependabotPR {
  id: number;
  title: string;
  html_url: string;
  user?: GitHubUser | null; // Add this for filtering logic
  head?: {
    repo?: {
      name: string;
    } | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface AuthConfig {
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  GITHUB_INSTALLATION_ID: string;
}

export interface RepoError {
  repo: string;
  error: string;
  code?: string;
}

export interface FetchAllResult {
  data: PRdto[];
  errors: RepoError[];
  count: number;
}

export interface PRdto {
  id: number;
  title: string;
  url: string;
  repo: string;
  createdAt: string;
  updatedAt: string;
}

export interface DependabotPR {
  id: number;
  title: string;
  html_url: string;
  head?: {
    repo?: {
      name: string;
    } | null;
  } | null;
  created_at: string;
  updated_at: string;
}
