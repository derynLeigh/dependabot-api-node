import type { DependabotPR } from '../../src/types/githubTypes.js';
import type { PRdto } from '../../src/types/githubTypes.js';

export interface MockPRResponseBody {
  count: number;
  data: PRdto[];
  generatedAt: string;
}

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

export function createMockPRdto(overrides: Partial<PRdto> = {}): PRdto {
  const defaults: PRdto = {
    id: 123,
    title: 'Test PR',
    url: 'https://example.com/pr/123',
    repo: 'test-repo',
    createdAt: '2025-09-01T10:00:00Z',
    updatedAt: '2025-09-01T11:00:00Z',
  };

  return { ...defaults, ...overrides };
}
export function createMockPRResponseBody(overrides: Partial<MockPRResponseBody> = {}): MockPRResponseBody {
  const defaults: MockPRResponseBody = {
    count: 1,
    data: [
      {
        id: 123,
        title: 'Test PR',
        url: 'https://example.com/pr/123',
        repo: 'test-repo',
        createdAt: '2025-09-01T10:00:00Z',
        updatedAt: '2025-09-01T11:00:00Z',
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  return { ...defaults, ...overrides };
}
