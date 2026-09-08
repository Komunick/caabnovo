export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startInstrumentation } = await import("./modules/shared/telemetry");
    await startInstrumentation();
  }
}
