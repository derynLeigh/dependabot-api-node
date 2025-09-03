import { describe, it, expect } from 'vitest';
import { toPRdto } from '../../src/utils/gitHubHelpers.js'; // Note the .js extension
import { createMockPR } from '../utils/helperFunctions.js';

describe('DTO transformation', () => {
  it('Transforms a Github PR to DTO format', () => {
    const mockPR = createMockPR();
    const result = toPRdto(mockPR);

    expect(result.id).toBe(mockPR.id);
    expect(result.title).toBe(mockPR.title);
    expect(result.url).toBe(mockPR.html_url);
    expect(result.repo).toBe(mockPR.head.repo.name);
    expect(result.createdAt).toBe(mockPR.created_at);
    expect(result.updatedAt).toBe(mockPR.updated_at);
  });

  it('Handles missing data', () => {
    const incompleteMockPR = createMockPR({
      id: 2,
      title: 'Incomplete PR',
      head: { repo: null },
    });

    const result = toPRdto(incompleteMockPR);

    expect(result.id).toBe(incompleteMockPR.id);
    expect(result.repo).toBe('');
  });

});

