import * as Notifications from "expo-notifications";

export async function notifyNow(params: {
  title: string;
  body: string;
  channelId?: string;
}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        sound: true,
      },
      trigger: params.channelId ? ({ channelId: params.channelId } as any) : null,
    });
  } catch {
    // no-op
  }
}

export async function scheduleAt(params: {
  title: string;
  body: string;
  date: Date;
  channelId?: string;
}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        sound: true,
      },
      trigger: {
        date: params.date,
        channelId: params.channelId,
      } as any,
    });
  } catch {
    // no-op
  }
}
