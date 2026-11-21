class NotificationService {
  static instance;
  constructor() {
  }
  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  // Request notification permission
  async requestPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }
    if (Notification.permission === "granted") {
      return true;
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }
  // Send local notification
  async sendNotification(title, options) {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.log("Notification permission denied");
      return;
    }
    const defaultOptions = {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: [200, 100, 200],
      ...options
    };
    try {
      const notification = new Notification(title, defaultOptions);
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }
  // Send emergency notification
  async sendEmergencyAlert(message, urgency = "high") {
    const urgencyConfig = {
      low: { tag: "emergency-low", requireInteraction: false },
      medium: { tag: "emergency-medium", requireInteraction: true },
      high: { tag: "emergency-high", requireInteraction: true }
    };
    await this.sendNotification("\u{1F6A8} Emergency Alert", {
      body: message,
      ...urgencyConfig[urgency],
      badge: "/favicon.ico",
      vibrate: [300, 100, 300, 100, 300]
    });
  }
  // Send status update notification
  async sendStatusUpdate(title, message) {
    await this.sendNotification(title, {
      body: message,
      tag: "status-update",
      requireInteraction: false
    });
  }
  // Check notification permission status
  getPermissionStatus() {
    if ("Notification" in window) {
      return Notification.permission;
    }
    return "denied";
  }
}
const notificationService = NotificationService.getInstance();
export {
  NotificationService,
  notificationService
};
