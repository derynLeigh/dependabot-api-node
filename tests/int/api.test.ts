import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js';
import * as gitHubHelpers from '../../src/utils/gitHubHelpers.js';
import {
  createMockPRdto
} from '../utils/helperFunctions.js';
import type { PRdto } from '../../src/types/githubTypes.js';

vi.mock('../../src/utils/gitHubHelpers.js', async () => {
  const actual = await vi.importActual('../../src/utils/gitHubHelpers.js');
  return {
    ...actual,
    fetchAllDependabotPRs: vi.fn(),
  };
});

describe('API Endpoints', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/prs', () => {
    it('returns a list of Dependabot PRs', async () => {
      const mockPRs: PRdto[] = [
        createMockPRdto(),
      ];

      vi.mocked(gitHubHelpers.fetchAllDependabotPRs).mockResolvedValue(mockPRs);

      const response = await request(app).get('/api/prs');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('generatedAt');
      expect(response.body.data).toEqual(mockPRs);

      expect(gitHubHelpers.fetchAllDependabotPRs).toHaveBeenCalledTimes(1);
    });
  });
});
