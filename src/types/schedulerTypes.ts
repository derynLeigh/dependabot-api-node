import { AuthConfig } from "./auth.js";

export interface SchedulerConfig {
  cronSchedule: string;
  outputPath: string;
  auth: AuthConfig;
  owner: string;
  repos: string[];
}
