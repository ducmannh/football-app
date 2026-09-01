export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initDailyCronScheduler } = await import("@/lib/services/daily-cron");
    initDailyCronScheduler();
  }
}
