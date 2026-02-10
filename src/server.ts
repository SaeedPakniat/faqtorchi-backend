import { createApp } from './app';
import { env } from './config/env';
import { startReminderWorker } from "./jobs/reminder.worker";

const app = createApp();

app.listen(env.PORT, () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

startReminderWorker();
