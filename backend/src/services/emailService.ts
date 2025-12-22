import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
}

export interface OrderData {
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: any;
  estimatedDelivery?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('📧 Email service ready');
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
    }
  }

  private loadTemplate(templateName: string): string {
    try {
      const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.error(`Failed to load email template: ${templateName}`, error);
      return '';
    }
  }

  private replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"${process.env.COMPANY_NAME || 'Luxury Store'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${options.to}:`, info.messageId);
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  async sendOrderConfirmation(email: string, orderData: OrderData): Promise<void> {
    const template = this.loadTemplate('order-confirmation');

    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #eee;">
          <div style="display: flex; align-items: center;">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;">` : ''}
            <div>
              <h4 style="margin: 0; color: #333;">${item.name}</h4>
              <p style="margin: 5px 0; color: #666;">Quantity: ${item.quantity}</p>
            </div>
          </div>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
          <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
        </td>
      </tr>
    `).join('');

    const html = this.replaceTemplateVariables(template, {
      customerName: orderData.customerName,
      orderNumber: orderData.orderNumber,
      items: itemsHtml,
      subtotal: orderData.subtotal.toFixed(2),
      tax: orderData.tax.toFixed(2),
      shipping: orderData.shipping?.toFixed(2),
      total: orderData.total.toFixed(2),
      shippingAddress: `
        ${orderData.shippingAddress.street}<br>
        ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}<br>
        ${orderData.shippingAddress.country}
      `,
      estimatedDelivery: orderData.estimatedDelivery || 'Within 5-7 business days',
      companyName: process.env.COMPANY_NAME || 'Luxury Store',
      supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
      currentYear: new Date().getFullYear()
    });

    await this.sendEmail({
      to: email,
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      html
    });
  }

  async sendShippingNotification(email: string, orderData: any): Promise<void> {
    const template = this.loadTemplate('shipping-notification');

    const html = this.replaceTemplateVariables(template, {
      customerName: orderData.customerName,
      orderNumber: orderData.orderNumber,
      trackingNumber: orderData.trackingNumber,
      trackingUrl: orderData.trackingUrl,
      estimatedDelivery: orderData.estimatedDelivery,
      companyName: process.env.COMPANY_NAME || 'Luxury Store',
      supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
      currentYear: new Date().getFullYear()
    });

    await this.sendEmail({
      to: email,
      subject: `Your Order Has Shipped - ${orderData.orderNumber}`,
      html
    });
  }

  async sendPasswordReset(email: string, resetToken: string, customerName: string): Promise<void> {
    const template = this.loadTemplate('password-reset');
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = this.replaceTemplateVariables(template, {
      customerName,
      resetUrl,
      companyName: process.env.COMPANY_NAME || 'Luxury Store',
      supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
      currentYear: new Date().getFullYear()
    });

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html
    });
  }

  async sendWelcomeEmail(email: string, customerName: string): Promise<void> {
    const template = this.loadTemplate('welcome');

    const html = this.replaceTemplateVariables(template, {
      customerName,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      shopUrl: `${process.env.FRONTEND_URL}/collections`,
      companyName: process.env.COMPANY_NAME || 'Luxury Store',
      supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
      currentYear: new Date().getFullYear()
    });

    await this.sendEmail({
      to: email,
      subject: `Welcome to ${process.env.COMPANY_NAME || 'Luxury Store'}!`,
      html
    });
  }

  async sendNewsletterEmail(emails: string[], subject: string, content: string): Promise<void> {
    const template = this.loadTemplate('newsletter');

    const html = this.replaceTemplateVariables(template, {
      content,
      unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe`,
      companyName: process.env.COMPANY_NAME || 'Luxury Store',
      supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
      currentYear: new Date().getFullYear()
    });

    // Send to each email individually to protect privacy
    for (const email of emails) {
      try {
        await this.sendEmail({
          to: email,
          subject,
          html
        });
        // Add delay to prevent spam detection
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send newsletter to ${email}:`, error);
      }
    }
  }

  async sendOrderStatusUpdate(email: string, orderData: any): Promise<void> {
    const template = this.loadTemplate('order-status-update');

    const html = this.replaceTemplateVariables(template, {
      customerName: orderData.customerName,
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      statusMessage: this.getStatusMessage(orderData.status),
      trackingNumber: orderData.trackingNumber,
      trackingUrl: orderData.trackingUrl,
      companyName: process.env.COMPANY_NAME || 'Luxury Store',
      supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
      currentYear: new Date().getFullYear()
    });

    await this.sendEmail({
      to: email,
      subject: `Order Update - ${orderData.orderNumber}`,
      html
    });
  }

  private getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      'processing': 'Your order is being prepared for shipment.',
      'shipped': 'Your order has been shipped and is on its way to you.',
      'delivered': 'Your order has been delivered successfully.',
      'cancelled': 'Your order has been cancelled.',
      'refunded': 'Your order has been refunded.',
    };

    return messages[status] || 'Your order status has been updated.';
  }
}

export const emailService = new EmailService();
export default EmailService;