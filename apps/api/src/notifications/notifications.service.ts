import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  /** Send deadline reminders for forms approaching their deadline */
  async sendDeadlineReminders(): Promise<void> {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find forms with deadlines in the next 48 hours that are still published
    const forms = await this.prisma.form.findMany({
      where: {
        status: 'PUBLISHED',
        responseDeadline: { gte: now, lte: in48h },
      },
      include: {
        evaluation: { select: { title: true } },
        formAssignments: {
          include: { respondent: { select: { id: true, email: true } } },
        },
        responses: {
          where: { status: { in: ['SUBMITTED', 'SYNCED'] } },
          select: { respondentId: true },
        },
      },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    for (const form of forms) {
      const submittedIds = new Set(form.responses.map((r) => r.respondentId));
      const pendingAssignments = form.formAssignments.filter(
        (a) => !submittedIds.has(a.respondentId),
      );

      const hoursLeft = Math.round(
        (form.responseDeadline!.getTime() - now.getTime()) / (60 * 60 * 1000),
      );
      const urgency = hoursLeft <= 24 ? '24 hours' : '48 hours';

      for (const assignment of pendingAssignments) {
        await this.email
          .sendEmail({
            to: assignment.respondent.email,
            subject: `Reminder: ${form.title} — deadline in ${urgency}`,
            htmlContent: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d97706;">⏰ Deadline Reminder</h2>
                <p>You have <strong>${urgency}</strong> left to complete the form:</p>
                <p style="font-size: 18px; font-weight: bold;">${form.title}</p>
                <p style="color: #64748b;">Part of evaluation: ${form.evaluation.title}</p>
                <p>Deadline: <strong>${form.responseDeadline!.toLocaleString()}</strong></p>
                <a href="${frontendUrl}/my-forms"
                   style="display: inline-block; padding: 12px 24px; background: #1d4ed8;
                          color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                  Complete My Form Now
                </a>
              </div>
            `,
          })
          .catch((err) =>
            this.logger.error(`Failed to send reminder to ${assignment.respondent.email}: ${err.message}`),
          );
      }
    }

    this.logger.log(`Deadline reminders sent for ${forms.length} forms`);
  }

  /** Get in-app notifications for a user */
  async getUserNotifications(userId: string) {
    // Return pending form assignments and upcoming deadlines
    const assignments = await this.prisma.formAssignment.findMany({
      where: { respondentId: userId },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            status: true,
            responseDeadline: true,
            evaluation: { select: { title: true } },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
      take: 20,
    });

    const submittedFormIds = new Set(
      (
        await this.prisma.response.findMany({
          where: {
            respondentId: userId,
            status: { in: ['SUBMITTED', 'SYNCED'] },
          },
          select: { formId: true },
        })
      ).map((r) => r.formId),
    );

    return assignments
      .filter((a) => a.form.status === 'PUBLISHED')
      .map((a) => {
        const isSubmitted = submittedFormIds.has(a.form.id);
        const deadline = a.form.responseDeadline;
        const hoursLeft = deadline
          ? Math.round((deadline.getTime() - Date.now()) / (60 * 60 * 1000))
          : null;

        return {
          type: isSubmitted ? 'completed' : 'pending',
          formId: a.form.id,
          formTitle: a.form.title,
          evaluationTitle: a.form.evaluation.title,
          deadline: deadline?.toISOString() ?? null,
          hoursLeft,
          urgent: hoursLeft !== null && hoursLeft <= 24 && !isSubmitted,
          assignedAt: a.assignedAt.toISOString(),
        };
      });
  }
}
