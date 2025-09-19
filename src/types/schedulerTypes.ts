import { FetchAllResult } from "./gitHubTypes.js";

export interface SchedulerConfig {
    cronSchedule: string;
    outputPath?: string;
    onSuccess?: (result: FetchAllResult) => Promise<void>;
    onError?: (error: Error) => Promise<void>;
}