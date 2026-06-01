import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FormDefinition } from '../forms/form-definition.types';
import { serializeForm, deserializeForm } from '../forms/form-serialiser';

export class CreateTemplateDto {
  name: string;
  sector?: string;
  evaluationType?: string;
  definition: FormDefinition;
}

export class UpdateTemplateDto {
  name?: string;
  sector?: string;
  evaluationType?: string;
  definition?: FormDefinition;
}

@Injectable()
export class TemplatesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateTemplateDto, createdById: string) {
    const template = await this.prisma.template.create({
      data: {
        name: dto.name,
        sector: dto.sector,
        evaluationType: dto.evaluationType,
        definition: serializeForm(dto.definition) as any,
        version: 1,
        createdById,
      },
    });

    // Save initial version snapshot
    await this.prisma.templateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        definition: serializeForm(dto.definition) as any,
      },
    });

    await this.audit.log({
      userId: createdById,
      action: 'TEMPLATE_CREATED',
      resourceType: 'Template',
      resourceId: template.id,
      metadata: { name: dto.name },
    });

    return template;
  }

  async findAll(filters?: {
    sector?: string;
    evaluationType?: string;
    keyword?: string;
  }) {
    return this.prisma.template.findMany({
      where: {
        isPublished: true,
        sector: filters?.sector ?? undefined,
        evaluationType: filters?.evaluationType ?? undefined,
        name: filters?.keyword
          ? { contains: filters.keyword, mode: 'insensitive' }
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found.');
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto, updatedById: string) {
    const template = await this.findOne(id);
    const newVersion = template.version + 1;

    const updated = await this.prisma.template.update({
      where: { id },
      data: {
        name: dto.name,
        sector: dto.sector,
        evaluationType: dto.evaluationType,
        definition: dto.definition
          ? (serializeForm(dto.definition) as any)
          : undefined,
        version: newVersion,
      },
    });

    // Save version snapshot (Property 35)
    if (dto.definition) {
      await this.prisma.templateVersion.create({
        data: {
          templateId: id,
          version: newVersion,
          definition: serializeForm(dto.definition) as any,
        },
      });
    }

    await this.audit.log({
      userId: updatedById,
      action: 'TEMPLATE_UPDATED',
      resourceType: 'Template',
      resourceId: id,
      metadata: { newVersion },
    });

    return updated;
  }

  async publish(id: string, publishedById: string) {
    const template = await this.findOne(id);
    const updated = await this.prisma.template.update({
      where: { id },
      data: { isPublished: true },
    });

    await this.audit.log({
      userId: publishedById,
      action: 'TEMPLATE_PUBLISHED',
      resourceType: 'Template',
      resourceId: id,
    });

    return updated;
  }

  async delete(id: string, deletedById: string) {
    await this.findOne(id);

    // Soft delete — mark as unpublished but retain all derived forms (Property 12)
    await this.prisma.template.update({
      where: { id },
      data: { isPublished: false },
    });

    await this.audit.log({
      userId: deletedById,
      action: 'TEMPLATE_DELETED',
      resourceType: 'Template',
      resourceId: id,
    });

    return { id, deleted: true };
  }

  /**
   * Create a form from a template — returns an editable copy.
   * Original template is NOT modified. (Property 11)
   * Records which template version was used. (Property 36)
   */
  async instantiateAsForm(
    templateId: string,
    evaluationId: string,
    title: string,
    createdById: string,
  ) {
    const template = await this.findOne(templateId);

    // Deserialise template definition to get a copy
    const definition = deserializeForm(JSON.stringify(template.definition));

    // Update the formId to a new unique ID for this form instance
    const formDefinition: FormDefinition = {
      ...definition,
      formId: `form-${Date.now()}`,
      version: 1,
    };

    const form = await this.prisma.form.create({
      data: {
        evaluationId,
        title,
        definition: serializeForm(formDefinition) as any,
        templateId,
        templateVersion: template.version, // record which version was used
        createdById,
      },
    });

    await this.audit.log({
      userId: createdById,
      action: 'FORM_CREATED_FROM_TEMPLATE',
      resourceType: 'Form',
      resourceId: form.id,
      metadata: { templateId, templateVersion: template.version },
    });

    return form;
  }

  async getVersionHistory(templateId: string) {
    return this.prisma.templateVersion.findMany({
      where: { templateId },
      orderBy: { version: 'desc' },
    });
  }
}
