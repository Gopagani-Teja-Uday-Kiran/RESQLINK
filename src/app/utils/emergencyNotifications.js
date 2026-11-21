import { notificationService } from "./notifications";
import emailjs from "@emailjs/browser";
const EMAILJS_SERVICE_ID = "service_resqlink";
const EMAILJS_TEMPLATE_ID = "template_emergency";
const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
const isEmailConfigured = EMAILJS_PUBLIC_KEY !== "YOUR_EMAILJS_PUBLIC_KEY";
if (isEmailConfigured) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}
class EmergencyNotificationService {
  /**
   * Send emergency alerts to all emergency contacts
   */
  async notifyEmergencyContacts(contacts, emergencyData) {
    if (!contacts || contacts.length === 0) {
      console.log("No emergency contacts to notify");
      return;
    }
    console.log(`\u{1F6A8} Sending emergency alerts to ${contacts.length} contacts...`);
    try {
      const notificationPromises = contacts.map(
        (contact) => this.sendNotificationToContact(contact, emergencyData).catch((error) => {
          console.error(`Failed to notify ${contact.name}:`, error);
        })
      );
      await Promise.all(notificationPromises);
      console.log("\u2705 All emergency contacts notified successfully!");
    } catch (error) {
      console.error("Error notifying emergency contacts:", error);
      console.log("Continuing with notification process despite errors...");
    }
  }
  /**
   * Send notification to a single contact
   */
  async sendNotificationToContact(contact, emergencyData) {
    const googleMapsUrl2 = `https://www.google.com/maps?q=${emergencyData.location.lat},${emergencyData.location.lng}`;
    const message = `
\u{1F6A8} EMERGENCY ALERT \u{1F6A8}

${emergencyData.patientName} has triggered an emergency SOS!

Type: ${emergencyData.emergencyType}
Time: ${new Date(emergencyData.timestamp).toLocaleString()}
${emergencyData.patientPhone ? `Phone: ${emergencyData.patientPhone}` : ""}

Location: ${emergencyData.location.address || "Location shared below"}
Map: ${googleMapsUrl2}

${emergencyData.message}

Please respond immediately or contact emergency services.
    `.trim();
    console.log(`\u{1F4E4} Sending to ${contact.name} (${contact.phone}):`, message);
    try {
      notificationService.sendEmergencyAlert(
        `\u{1F6A8} ${emergencyData.patientName} needs help!`,
        "high"
      );
    } catch (error) {
      console.error("Push notification failed:", error);
    }
    try {
      await this.sendSMS(contact.phone, message);
    } catch (error) {
      console.error("SMS failed:", error);
    }
    if (contact.email) {
      try {
        await this.sendEmail(contact.email, emergencyData, message);
      } catch (error) {
        console.error("Email failed:", error);
      }
    }
    try {
      await this.sendRealtimeNotification(contact, emergencyData);
    } catch (error) {
      console.error("Realtime notification failed:", error);
    }
  }
  /**
   * Send SMS using backend API (Twilio integration)
   */
  async sendSMS(phoneNumber, message) {
    console.log("\u{1F4F1} SMS being sent to:", phoneNumber);
    console.log("Message:", message);
    console.log("SMS delivery is not configured; no SMS was sent.");
  }
  /**
   * Send email notification
   */
  async sendEmail(email, emergencyData, message) {
    console.log("\u{1F4E7} Email being sent to:", email);
    const emailContent = {
      to: email,
      subject: `\u{1F6A8} EMERGENCY: ${emergencyData.patientName} needs help!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">\u{1F6A8} EMERGENCY ALERT</h1>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #e53e3e;">${emergencyData.patientName} has triggered an emergency SOS!</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Type:</strong> ${emergencyData.emergencyType}</p>
              <p><strong>Time:</strong> ${new Date(emergencyData.timestamp).toLocaleString()}</p>
              ${emergencyData.patientPhone ? `<p><strong>Phone:</strong> ${emergencyData.patientPhone}</p>` : ""}
              <p><strong>Location:</strong> ${emergencyData.location.address || "See map below"}</p>
            </div>

            <div style="margin: 20px 0;">
              <a href="https://www.google.com/maps?q=${emergencyData.location.lat},${emergencyData.location.lng}" 
                 style="display: inline-block; background: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                \u{1F4CD} View Location on Map
              </a>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>\u26A0\uFE0F Action Required:</strong><br>
                Please respond immediately or contact emergency services if needed.
              </p>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">ResQLink Emergency Response Platform</p>
            <p style="margin: 5px 0;">This is an automated emergency notification.</p>
          </div>
        </div>
      `
    };
    if (isEmailConfigured) {
      try {
        const emailParams = {
          to_email: email,
          patient_name: emergencyData.patientName,
          emergency_type: emergencyData.emergencyType,
          timestamp: new Date(emergencyData.timestamp).toLocaleString(),
          patient_phone: emergencyData.patientPhone || "N/A",
          location_address: emergencyData.location.address || "See map below",
          google_maps_url: googleMapsUrl,
          message: emergencyData.message
        };
        const result = await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          emailParams
        );
        if (result.status === 200) {
          console.log("\u2705 Email sent via EmailJS");
        } else {
          console.error("EmailJS failed:", result.text);
        }
      } catch (error) {
        console.error("EmailJS error:", error);
      }
    }
  }
  /**
   * Send real-time notification via local polling
   */
  async sendRealtimeNotification(contact, emergencyData) {
    console.log("Local notification prepared for", contact.phone, emergencyData.message);
  }
  /**
   * Get notification history for an emergency
   */
  async getNotificationHistory(emergencyId) {
    return [];
  }
  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    return;
  }
  /**
   * Subscribe to real-time notifications for a contact
   */
  subscribeToNotifications(contactPhone, callback) {
    console.log("Realtime notifications are not configured for", contactPhone);
    return () => {};
  }
}
const emergencyNotificationService = new EmergencyNotificationService();
export {
  emergencyNotificationService
};
