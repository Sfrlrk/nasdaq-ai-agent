export const browserNotificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

export const browserNotificationPermission = () => {
    if (!browserNotificationsSupported()) return "unsupported";
    return Notification.permission;
};

export async function requestBrowserNotificationPermission() {
    if (!browserNotificationsSupported()) return "unsupported";
    return Notification.requestPermission();
}

export function sendBrowserNotification(title, body, enabled = true) {
    if (!enabled || !browserNotificationsSupported() || Notification.permission !== "granted") return false;
    new Notification(title, body ? { body } : undefined);
    return true;
}
