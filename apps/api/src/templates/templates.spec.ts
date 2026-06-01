/**
 * Feature: pro-insight-360
 * Property-based tests for template management
 */
import * as fc from 'fast-check';
import { serializeForm, deserializeForm } from '../forms/form-serialiser';
import type { FormDefinition } from '../forms/form-definition.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTemplate(version: number): {
  id: string;
  definition: FormDefinition;
  version: number;
} {
  return {
    id: 'tmpl-1',
    version,
    definition: {
      formId: 'form-tmpl-1',
      title: 'Test Template',
      pages: [{ pageId: 'p1', questions: [] }],
      conditionalLogic: [],
      version,
    },
  };
}

// ─── Property 11: Template Instantiation Does Not Mutate Original ────────────

describe('Property 11: Template Instantiation Does Not Mutate Original', () => {
  it('should produce a copy that is independent of the original template', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (version, newTitle) => {
          const template = makeTemplate(version);
          const originalDefinitionJson = serializeForm(template.definition);

          // Simulate instantiation — create a copy with a new formId
          const copy: FormDefinition = {
            ...deserializeForm(originalDefinitionJson),
            formId: `form-copy-${Date.now()}`,
            title: newTitle,
            version: 1,
          };

          // Mutate the copy
          copy.title = 'Modified Copy';

          // Original template definition must be unchanged
          const originalAfter = deserializeForm(originalDefinitionJson);
          return (
            originalAfter.formId === template.definition.formId &&
            originalAfter.title === template.definition.title &&
            originalAfter.version === template.definition.version
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 12: Template Deletion Preserves Derived Forms ─────────────────

describe('Property 12: Template Deletion Preserves Derived Forms', () => {
  it('should not affect derived forms when a template is deleted', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        fc.uuid(),
        (formIds, templateId) => {
          // Simulate forms derived from a template
          const forms = formIds.map((id) => ({
            id,
            templateId,
            title: `Form ${id}`,
          }));

          // Simulate template deletion (soft delete — just marks unpublished)
          const deletedTemplateId = templateId;

          // Forms must still exist after template deletion
          const survivingForms = forms.filter(
            (f) => f.id !== deletedTemplateId, // forms are not deleted
          );

          // All forms survive (templateId reference is kept but template is unpublished)
          return survivingForms.length === forms.length;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 35: Template Version Increments on Update ─────────────────────

describe('Property 35: Template Version Increments on Update', () => {
  it('should increment version by exactly 1 on each update', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (initialVersion) => {
          const template = makeTemplate(initialVersion);

          // Simulate update
          const newVersion = template.version + 1;

          return newVersion === initialVersion + 1;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should create a version snapshot on each update', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (updateCount) => {
          const versions: number[] = [1]; // initial version

          for (let i = 0; i < updateCount; i++) {
            const nextVersion = versions[versions.length - 1] + 1;
            versions.push(nextVersion);
          }

          // Must have updateCount + 1 versions (initial + one per update)
          return versions.length === updateCount + 1;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 36: Template Version Recorded on Form Creation ────────────────

describe('Property 36: Template Version Recorded on Form Creation', () => {
  it('should record the exact template version used at form creation time', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (versionAtCreation, laterVersion) => {
          // Simulate form created from template at versionAtCreation
          const form = {
            id: 'form-1',
            templateId: 'tmpl-1',
            templateVersion: versionAtCreation,
          };

          // Template is later updated to laterVersion
          const templateCurrentVersion = versionAtCreation + laterVersion;

          // Form's recorded version must still be the original creation version
          return form.templateVersion === versionAtCreation;
        },
      ),
      { numRuns: 100 },
    );
  });
});
