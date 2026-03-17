// src/core/email/email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailer: MailerService,
    private readonly configService: ConfigService,
  ) {}

  isConfigured(): boolean {
    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    const placeholderValues = new Set([
      '',
      'tonEmail@gmail.com',
      'tonMotDePasseOuAppPassword',
    ]);

    return (
      !!host &&
      !!user &&
      !!pass &&
      !placeholderValues.has(user) &&
      !placeholderValues.has(pass)
    );
  }

  // Envoi d'un email simple
  async sendEmail(to: string, subject: string, text: string) {
    return this.mailer.sendMail({
      to,
      subject,
      text,
    });
  }

  // Email de bienvenue
  async sendWelcomeEmail(to: string, name: string) {
    return this.mailer.sendMail({
      to,
      subject: "Bienvenue sur C'EMPIRE 🎉",
      template: './welcome', // si tu veux ajouter un template EJS ou Handlebars
      context: { name },
      text: `Bienvenue ${name} dans la plateforme C'EMPIRE !`,
    });
  }

  // Email de confirmation de commande
  async sendOrderConfirmation(to: string, orderNumber: string) {
    return this.mailer.sendMail({
      to,
      subject: 'Confirmation de votre commande',
      text: `Votre commande ${orderNumber} a bien été reçue.`,
    });
  }

  // Email générique pour le module Notifications
  async sendNotificationEmail(to: string, title: string, message: string) {
    return this.mailer.sendMail({
      to,
      subject: title,
      text: message,
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string, expiresAt: Date) {
    const expiryLabel = expiresAt.toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    return this.mailer.sendMail({
      to,
      subject: "Réinitialisation de votre mot de passe C'EMPIRE",
      text: [
        "Vous avez demandé la réinitialisation de votre mot de passe C'EMPIRE.",
        '',
        `Ouvrez ce lien pour définir un nouveau mot de passe : ${resetUrl}`,
        '',
        `Ce lien expire le ${expiryLabel}.`,
        '',
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; color: #112134; line-height: 1.5;">
          <h2 style="margin-bottom: 12px;">Réinitialisation de mot de passe</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe C'EMPIRE.</p>
          <p>
            <a
              href="${resetUrl}"
              style="display:inline-block;padding:12px 18px;background:#1e6ee7;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;"
            >
              Choisir un nouveau mot de passe
            </a>
          </p>
          <p>Ce lien expire le <strong>${expiryLabel}</strong>.</p>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });
  }
}
