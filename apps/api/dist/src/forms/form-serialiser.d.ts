import { FormDefinition, QuestionDefinition, ConditionalRule } from './form-definition.types';
export declare function serializeForm(form: FormDefinition): string;
export declare function prettyPrintForm(json: string): string;
export declare function deserializeForm(json: string): FormDefinition;
export declare function validateConditionalLogic(form: FormDefinition): {
    valid: boolean;
    invalidRefs: string[];
};
export declare function getDependentRules(form: FormDefinition, questionId: string): ConditionalRule[];
export declare function insertQuestion(page: FormDefinition['pages'][0], question: QuestionDefinition, position: number): FormDefinition['pages'][0];
export declare function reorderQuestions(page: FormDefinition['pages'][0], orderedIds: string[]): FormDefinition['pages'][0];
