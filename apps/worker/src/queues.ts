import type { Queue } from "pg-boss";

export const QUEUES = {
  fileScan: "file-scan",
  filePromotion: "file-promotion",
  fileReconciliation: "file-reconciliation",
  auditExport: "audit-export",
  retention: "retention",
  deadLetter: "caab-dead-letter",
} as const;

export const queueDefinitions: Queue[] = [
  {
    name: QUEUES.deadLetter,
    policy: "standard",
    retryLimit: 0,
    deleteAfterSeconds: 0,
  },
  ...Object.values(QUEUES)
    .filter((name) => name !== QUEUES.deadLetter)
    .map((name) => ({
      name,
      policy: "standard",
      retryLimit: 4,
      retryDelay: 30,
      retryBackoff: true,
      retryDelayMax: 900,
      expireInSeconds: 900,
      heartbeatSeconds: 60,
      retentionSeconds: 1_209_600,
      deleteAfterSeconds: 604_800,
      deadLetter: QUEUES.deadLetter,
    })),
];
