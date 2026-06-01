"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeForm = serializeForm;
exports.prettyPrintForm = prettyPrintForm;
exports.deserializeForm = deserializeForm;
exports.validateConditionalLogic = validateConditionalLogic;
exports.getDependentRules = getDependentRules;
exports.insertQuestion = insertQuestion;
exports.reorderQuestions = reorderQuestions;
const common_1 = require("@nestjs/common");
function serializeForm(form) {
    return JSON.stringify(form);
}
function prettyPrintForm(json) {
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed, null, 2);
}
function deserializeForm(json) {
    let parsed;
    try {
        parsed = JSON.parse(json);
    }
    catch {
        throw new common_1.BadRequestException('Form definition is not valid JSON. Please check the format.');
    }
    return validateFormDefinition(parsed);
}
function validateFormDefinition(data) {
    if (!data || typeof data !== 'object') {
        throw new common_1.BadRequestException('Invalid form definition: expected an object.');
    }
    const d = data;
    if (typeof d.formId !== 'string') {
        throw new common_1.BadRequestException('Invalid form definition: "formId" must be a string.');
    }
    if (typeof d.title !== 'string') {
        throw new common_1.BadRequestException('Invalid form definition: "title" must be a string.');
    }
    if (!Array.isArray(d.pages)) {
        throw new common_1.BadRequestException('Invalid form definition: "pages" must be an array.');
    }
    if (!Array.isArray(d.conditionalLogic)) {
        throw new common_1.BadRequestException('Invalid form definition: "conditionalLogic" must be an array.');
    }
    if (typeof d.version !== 'number') {
        throw new common_1.BadRequestException('Invalid form definition: "version" must be a number.');
    }
    return d;
}
function validateConditionalLogic(form) {
    const allQuestionIds = new Set();
    for (const page of form.pages) {
        for (const q of page.questions) {
            allQuestionIds.add(q.questionId);
        }
    }
    const invalidRefs = [];
    for (const rule of form.conditionalLogic) {
        if (!allQuestionIds.has(rule.condition.sourceQuestionId)) {
            invalidRefs.push(rule.condition.sourceQuestionId);
        }
        if (!allQuestionIds.has(rule.targetQuestionId)) {
            invalidRefs.push(rule.targetQuestionId);
        }
    }
    return { valid: invalidRefs.length === 0, invalidRefs };
}
function getDependentRules(form, questionId) {
    return form.conditionalLogic.filter((rule) => rule.condition.sourceQuestionId === questionId ||
        rule.targetQuestionId === questionId);
}
function insertQuestion(page, question, position) {
    const questions = [...page.questions];
    const clampedPos = Math.max(0, Math.min(position, questions.length));
    question.position = clampedPos;
    questions.splice(clampedPos, 0, question);
    const reordered = questions.map((q, i) => ({ ...q, position: i }));
    return { ...page, questions: reordered };
}
function reorderQuestions(page, orderedIds) {
    const questionMap = new Map(page.questions.map((q) => [q.questionId, q]));
    const reordered = orderedIds
        .filter((id) => questionMap.has(id))
        .map((id, i) => ({ ...questionMap.get(id), position: i }));
    return { ...page, questions: reordered };
}
//# sourceMappingURL=form-serialiser.js.map