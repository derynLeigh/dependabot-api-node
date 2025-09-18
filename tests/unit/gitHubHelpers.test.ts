import { describe, it, expect } from 'vitest';
import { toPRdto } from '../utils/testFunctions/testImplementations.js';
import { createTestMockPR } from '../utils/testFunctions/helperFunctions.js'

describe('toPRdto', () => {
  it('should transform a complete GitHub PR to PRdto format', () => {
    const githubPR = createTestMockPR({
      id: 123,
      title: 'Bump typescript from 5.0.0 to 5.1.0',
      html_url: 'https://github.com/owner/repo/pull/123',
    });

    const result = toPRdto(githubPR);

    expect(result).toEqual({
      id: 123,
      title: 'Bump typescript from 5.0.0 to 5.1.0',
      url: 'https://github.com/owner/repo/pull/123',
      repo: 'mock-repo', // from the default
      createdAt: '2025-09-01T10:00:00Z',
      updatedAt: '2025-09-01T11:00:00Z'
    });
  });

  it('should handle missing repo data gracefully', () => {
    const githubPR = createTestMockPR({
      id: 456,
      title: 'Update dependency',
      head: null
    });

    const result = toPRdto(githubPR);
    expect(result.repo).toBe('');
  });
});