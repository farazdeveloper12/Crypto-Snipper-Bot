// backend/src/utils/notification-service.js
const nodemailer = require('nodemailer');
const twilio = require('twilio');

class NotificationService {
  constructor() {
    // Email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Twilio SMS configuration
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID, 
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendEmail(to, subject, body) {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html: body
      });
      return true;
    } catch (error) {
      console.error('Email sending failed', error);
      return false;
    }
  }

  async sendSMS(to, message) {
    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });
      return true;
    } catch (error) {
      console.error('SMS sending failed', error);
      return false;
    }
  }

  async sendTradingAlert(user, tradeDetails) {
    const emailBody = `
      <h1>Trading Alert</h1>
      <p>Token: ${tradeDetails.token}</p>
      <p>Action: ${tradeDetails.type}</p>
      <p>Amount: ${tradeDetails.amount}</p>
      <p>Status: ${tradeDetails.status}</p>
    `;

    // Send email if enabled
    if (user.notifications.email.tradeAlerts) {
      await this.sendEmail(
        user.email, 
        'Trading Alert', 
        emailBody
      );
    }

    // Send SMS if enabled
    if (user.notifications.sms.enabled) {
      await this.sendSMS(
        user.notifications.sms.phoneNumber,
        `Trading Alert: ${tradeDetails.token} ${tradeDetails.type}`
      );
    }
  }
}

module.exports = new NotificationService();