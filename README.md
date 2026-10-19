# dependabot-api-node

A small Express API that collects open Dependabot pull requests across a set of GitHub repositories. It authenticates as a GitHub App, caches results in a local JSON file, and can optionally refresh that cache on a cron schedule.

## Requirements

- Node.js `>= 22.11 < 23`
- A GitHub App installed on the target owner, with the **Pull requests: Read** permission on the repositories you want to query

## Setup

```bash
npm install
```

Create a `.env` file in the project root (see [Configuration](#configuration)). Keep this file out of version control.

## Configuration

Environment variables are read from `.env` via `dotenv`.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `GITHUB_APP_ID` | Yes | — | ID of the GitHub App. |
| `GITHUB_PRIVATE_KEY` | Yes | — | PEM private key for the GitHub App. Wrap the value in double quotes in `.env` so the line breaks are preserved. |
| `GITHUB_INSTALLATION_ID` | Yes | — | Installation ID of the app on the target owner. |
| `GITHUB_OWNER` | Scheduler only | `derynLeigh` (`/api/prs` only) | User or organization that owns the repositories. |
| `GITHUB_REPOS` | Scheduler only | Built-in list (`/api/prs` only) | Comma-separated repository names, e.g. `repo-a,repo-b`. |
| `PORT` | No | `8080` | HTTP port. |
| `CACHE_TTL_MS` | No | `300000` (5 min) | How long a cached result stays valid, in milliseconds. |
| `ENABLE_SCHEDULER` | No | `false` | Set to `true` to start the cron job on server start. |
| `CRON_SCHEDULE` | No | `0 7 * * *` (7 AM daily) | Cron expression for scheduled fetches. |
| `MAX_RETRIES` | No | `3` | Attempts per scheduled run before giving up. |
| `RETRY_DELAY` | No | `5000` | Delay between scheduled retries, in milliseconds. |

When `ENABLE_SCHEDULER=true`, `GITHUB_OWNER` and `GITHUB_REPOS` are required and the server refuses to start scheduled fetches without them.

## Running

```bash
npm run dev     # build, then start
```

Or separately:

```bash
npm run build
npm start
```

`npm run build` runs ESLint first (via `prebuild`), so lint errors will stop the build.

Once running, the server logs its address (default `http://localhost:8080`).

## API

### `GET /api/prs`

Returns open Dependabot pull requests across the configured repositories.

```bash
curl http://localhost:8080/api/prs
```

```json
{
  "data": [
    {
      "id": 123456789,
      "title": "Bump express from 5.0.0 to 5.1.0",
      "url": "https://github.com/owner/repo/pull/42",
      "repo": "repo",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-02T00:00:00Z"
    }
  ],
  "errors": [],
  "count": 1,
  "generatedAt": "2024-01-02T08:00:00.000Z",
  "fromCache": false,
  "summary": {
    "totalReposQueried": 3,
    "successfulRepos": 3,
    "failedRepos": 0
  }
}
```

- `fromCache` indicates whether the result came from the cache.
- A failure in one repository does not fail the request. It is listed in `errors` as `{ "repo": "...", "error": "..." }`, and the remaining repositories are still returned.
- If the request fails entirely (for example, GitHub authentication fails), the response is `500` with `{ "error": { "message": "..." }, "generatedAt": "..." }`.

### `DELETE /api/cache`

Deletes the cache file. The next `GET /api/prs` fetches fresh data from GitHub.

```bash
curl -X DELETE http://localhost:8080/api/cache
```

## Caching and scheduled fetches

- Results are stored in `./pr-cache.json`, keyed by owner and repository list.
- Entries expire after `CACHE_TTL_MS`.
- When `ENABLE_SCHEDULER=true`, the cron job fetches fresh data and writes it to the same cache key, so requests made before the entry expires are served from cache.
- Because a scheduled result expires after `CACHE_TTL_MS`, set `CACHE_TTL_MS` to be longer than the interval between scheduled runs. With the default 5-minute TTL and a daily schedule, the warmed cache will have expired long before the next request.

## Scripts

| Script | Description |
| --- | --- |
| `npm start` | Run the compiled server from `build/`. |
| `npm run dev` | Build, then start. |
| `npm run build` | Lint, then compile TypeScript to `build/`. |
| `npm run build:watch` | Recompile on change. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run the Vitest suite. |
| `npm run test:coverage` | Run tests with V8 coverage reports. |
| `npm run prettier` | Format `src` and test files. |
| `npm run prettier:check` | Check formatting without writing. |
| `npm run clean` | Remove `coverage`, `build`, and `tmp`. |

## Project structure

```
src/
  server.ts                 Express app, routes, scheduler startup
  utils/
    gitHubHelpers.ts        GitHub App authentication and PR fetching
    scheduler.ts            Cron job, retry logic, error handling
    schedulerConfig.ts      Scheduler env parsing and cache-warming handler
    cache.ts                File-backed cache with TTL
  types/                    Shared TypeScript types
tests/
  unit/                     Unit tests
  integration/              Endpoint tests (supertest)
```

## Testing

```bash
npm test
```

Integration tests use supertest against the Express app and mock the GitHub helper module, so they do not call GitHub.

## Known limitations

- Each repository is queried with a single `pulls.list` call, which returns only the first page of results (30 PRs by default). Repositories with more open PRs will be truncated.
- Each cache miss and each scheduled run requests a new installation token.
