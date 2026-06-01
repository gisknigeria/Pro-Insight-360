import { FormDefinition } from '../forms/form-definition.types';

/**
 * Sector-specific predefined templates
 * Task 31.1: Implement sector-specific predefined templates
 */

export type TemplateSector = 'government' | 'housing' | 'ngo' | 'education' | 'private';

export interface TemplatePreset {
  id: string;
  name: string;
  sector: TemplateSector;
  evaluationType: string;
  description: string;
  definition: FormDefinition;
}

export const SECTOR_PRESETS: Record<TemplateSector, Omit<TemplatePreset, 'id'>[]> = {
  government: [
    {
      name: 'National GIS Readiness Assessment',
      sector: 'government',
      evaluationType: 'gis_readiness',
      description: 'Comprehensive GIS readiness assessment for national government departments',
      definition: createGovernmentTemplate(),
    },
    {
      name: 'Local Authority Digital Transformation',
      sector: 'government',
      evaluationType: 'digital_readiness',
      description: 'Digital transformation readiness for local government authorities',
      definition: createLocalAuthorityTemplate(),
    },
  ],
  housing: [
    {
      name: 'Housing Department GIS Assessment',
      sector: 'housing',
      evaluationType: 'gis_readiness',
      description: 'GIS readiness assessment tailored for housing departments',
      definition: createHousingTemplate(),
    },
  ],
  ngo: [
    {
      name: 'NGO Programme Evaluation',
      sector: 'ngo',
      evaluationType: 'programme_evaluation',
      description: 'Programme evaluation framework for NGOs',
      definition: createNGOTemplate(),
    },
  ],
  education: [
    {
      name: 'University GIS Capability Assessment',
      sector: 'education',
      evaluationType: 'gis_readiness',
      description: 'GIS capability assessment for higher education institutions',
      definition: createEducationTemplate(),
    },
  ],
  private: [
    {
      name: 'Corporate Digital Readiness',
      sector: 'private',
      evaluationType: 'digital_readiness',
      description: 'Digital readiness assessment for private sector organisations',
      definition: createPrivateTemplate(),
    },
  ],
};

function createGovernmentTemplate(): FormDefinition {
  return {
    formId: 'gov-gis-readiness',
    title: 'National GIS Readiness Assessment',
    version: 1,
    pages: [
      {
        pageId: 'page-1',
        title: 'Data & Content',
        questions: [
          {
            questionId: 'gov-data-availability',
            type: 'rating_scale',
            label: 'Spatial Data Availability',
            isRequired: true,
            position: 0,
            dimensions: ['WHAT'],
            config: { min: 0, max: 100, minLabel: 'None', maxLabel: 'Comprehensive' },
          },
          {
            questionId: 'gov-data-quality',
            type: 'rating_scale',
            label: 'Data Quality and Accuracy',
            isRequired: true,
            position: 1,
            dimensions: ['WHAT'],
            config: { min: 0, max: 100, minLabel: 'Poor', maxLabel: 'Excellent' },
          },
        ],
        conditionalLogic: [],
      },
    ],
    conditionalLogic: [],
  };
}

function createLocalAuthorityTemplate(): FormDefinition {
  return {
    formId: 'local-digital-readiness',
    title: 'Local Authority Digital Transformation',
    version: 1,
    pages: [
      {
        pageId: 'page-1',
        title: 'Digital Infrastructure',
        questions: [
          {
            questionId: 'local-infrastructure',
            type: 'rating_scale',
            label: 'IT Infrastructure Adequacy',
            isRequired: true,
            position: 0,
            dimensions: ['WHAT'],
            config: { min: 0, max: 100 },
          },
        ],
        conditionalLogic: [],
      },
    ],
    conditionalLogic: [],
  };
}

function createHousingTemplate(): FormDefinition {
  return {
    formId: 'housing-gis-assessment',
    title: 'Housing Department GIS Assessment',
    version: 1,
    pages: [
      {
        pageId: 'page-1',
        title: 'Property Data Management',
        questions: [
          {
            questionId: 'housing-data',
            type: 'rating_scale',
            label: 'Property Data Quality',
            isRequired: true,
            position: 0,
            dimensions: ['WHAT'],
            config: { min: 0, max: 100 },
          },
        ],
        conditionalLogic: [],
      },
    ],
    conditionalLogic: [],
  };
}

function createNGOTemplate(): FormDefinition {
  return {
    formId: 'ngo-programme-evaluation',
    title: 'NGO Programme Evaluation',
    version: 1,
    pages: [
      {
        pageId: 'page-1',
        title: 'Programme Impact',
        questions: [
          {
            questionId: 'ngo-impact',
            type: 'rating_scale',
            label: 'Programme Impact Assessment',
            isRequired: true,
            position: 0,
            dimensions: ['WHAT'],
            config: { min: 0, max: 100 },
          },
        ],
        conditionalLogic: [],
      },
    ],
    conditionalLogic: [],
  };
}

function createEducationTemplate(): FormDefinition {
  return {
    formId: 'edu-gis-capability',
    title: 'University GIS Capability Assessment',
    version: 1,
    pages: [
      {
        pageId: 'page-1',
        title: 'Research GIS Usage',
        questions: [
          {
            questionId: 'edu-research-gis',
            type: 'rating_scale',
            label: 'GIS Usage in Research',
            isRequired: true,
            position: 0,
            dimensions: ['WHAT'],
            config: { min: 0, max: 100 },
          },
        ],
        conditionalLogic: [],
      },
    ],
    conditionalLogic: [],
  };
}

function createPrivateTemplate(): FormDefinition {
  return {
    formId: 'corporate-digital-readiness',
    title: 'Corporate Digital Readiness',
    version: 1,
    pages: [
      {
        pageId: 'page-1',
        title: 'Business Intelligence',
        questions: [
          {
            questionId: 'corp-bi',
            type: 'rating_scale',
            label: 'Business Intelligence Maturity',
            isRequired: true,
            position: 0,
            dimensions: ['WHAT'],
            config: { min: 0, max: 100 },
          },
        ],
        conditionalLogic: [],
      },
    ],
    conditionalLogic: [],
  };
}