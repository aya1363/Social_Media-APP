import cron from "node-cron";

export function startCronJobs() {
  // Every minute
  cron.schedule("* * * * *", () => {
    console.log("Running a task every minute");
});

  // Every day at midnight
  cron.schedule("0 0 * * *", () => {
    console.log("Running a task every midnight");
});
}
