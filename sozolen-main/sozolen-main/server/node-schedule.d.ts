declare module "node-schedule" {
  export interface Job {
    cancel(): void;
  }

  export function scheduleJob(
    rule: string,
    callback: () => void | Promise<void>,
  ): Job;
}

