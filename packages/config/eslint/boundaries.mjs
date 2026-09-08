export const boundaryRestrictions = [
  {
    group: ["@/modules/*/infrastructure/*", "@/modules/*/repositories/*"],
    message: "Import the module public API instead of another module's internals.",
  },
  {
    group: ["@caab/db", "@caab/db/*"],
    importNames: ["*"],
    message: "Client components cannot import server-only database code.",
  },
];
