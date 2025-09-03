import type { DependabotPR } from '../../src/types/githubTypes.js';

export function createMockPR(
  overrides: Partial<Omit<DependabotPR, 'head'>> & {
    head?: { repo: { name: string } | null } | null;
  } = {},
): DependabotPR {
  const defaults = {
    id: 1,
    title: 'Mock PR',
    html_url: 'https://example.com/pr/1',
    head: { repo: { name: 'mock-repo' } },
    created_at: '2025-09-01T10:00:00Z',
    updated_at: '2025-09-01T11:00:00Z',
  };

  return { ...defaults, ...overrides } as DependabotPR;
}
