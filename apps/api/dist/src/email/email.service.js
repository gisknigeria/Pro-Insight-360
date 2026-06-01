"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let EmailService = EmailService_1 = class EmailService {
    config;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(config) {
        this.config = config;
    }
    async sendEmail(options) {
        const apiKey = this.config.get('BREVO_API_KEY');
        const fromEmail = this.config.get('BREVO_FROM_EMAIL', 'noreply@pro-insight-360.com');
        const fromName = this.config.get('BREVO_FROM_NAME', 'Pro-Insight 360');
        if (!apiKey || apiKey.startsWith('your-')) {
            this.logger.warn(`Email not sent (no API key configured): ${options.subject} → ${options.to}`);
            return;
        }
        const body = {
            sender: { name: fromName, email: fromEmail },
            to: [{ email: options.to }],
            subject: options.subject,
            htmlContent: options.htmlContent,
            textContent: options.textContent,
        };
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error(`Brevo email failed: ${response.status} — ${error}`);
            throw new Error(`Failed to send email: ${response.status}`);
        }
        this.logger.log(`Email sent: "${options.subject}" → ${options.to}`);
    }
    async sendInvitation(email, setupToken, frontendUrl) {
        const setupUrl = `${frontendUrl}/setup?token=${setupToken}`;
        await this.sendEmail({
            to: email,
            subject: 'You have been invited to Pro-Insight 360',
            htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1d4ed8;">Welcome to Pro-Insight 360</h2>
          <p>You have been invited to join the Pro-Insight 360 platform by GIS Konsult Ltd.</p>
          <p>Click the button below to set up your account. This link expires in 48 hours.</p>
          <a href="${setupUrl}"
             style="display: inline-block; padding: 12px 24px; background: #1d4ed8;
                    color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Set Up My Account
          </a>
          <p style="color: #64748b; font-size: 14px;">
            If the button does not work, copy and paste this link into your browser:<br>
            <a href="${setupUrl}">${setupUrl}</a>
          </p>
          <p style="color: #64748b; font-size: 12px;">
            If you did not expect this invitation, please ignore this email.
          </p>
        </div>
      `,
            textContent: `You have been invited to Pro-Insight 360. Set up your account here: ${setupUrl} (link expires in 48 hours)`,
        });
    }
    async sendAccountLockNotification(adminEmail, lockedEmail) {
        await this.sendEmail({
            to: adminEmail,
            subject: 'Account locked — Pro-Insight 360',
            htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Account Locked</h2>
          <p>The account for <strong>${lockedEmail}</strong> has been temporarily locked
             after 3 consecutive failed login attempts.</p>
          <p>The account will automatically unlock after 15 minutes.</p>
          <p>If this was not expected, please investigate immediately.</p>
        </div>
      `,
        });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map