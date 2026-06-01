"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeResponse = serializeResponse;
exports.prettyPrintResponse = prettyPrintResponse;
exports.deserializeResponse = deserializeResponse;
const common_1 = require("@nestjs/common");
function serializeResponse(response) {
    return JSON.stringify(response);
}
function prettyPrintResponse(json) {
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed, null, 2);
}
function deserializeResponse(json) {
    let parsed;
    try {
        parsed = JSON.parse(json);
    }
    catch {
        throw new common_1.BadRequestException('Cached response is not valid JSON. The response has been quarantined.');
    }
    return validateResponseData(parsed);
}
function validateResponseData(data) {
    if (!data || typeof data !== 'object') {
        throw new common_1.BadRequestException('Invalid response data: expected an object.');
    }
    const d = data;
    if (typeof d.responseId !== 'string') {
        throw new common_1.BadRequestException('Invalid response data: "responseId" must be a string.');
    }
    if (typeof d.formId !== 'string') {
        throw new common_1.BadRequestException('Invalid response data: "formId" must be a string.');
    }
    if (typeof d.respondentId !== 'string') {
        throw new common_1.BadRequestException('Invalid response data: "respondentId" must be a string.');
    }
    if (typeof d.formVersion !== 'number') {
        throw new common_1.BadRequestException('Invalid response data: "formVersion" must be a number.');
    }
    if (!Array.isArray(d.answers)) {
        throw new common_1.BadRequestException('Invalid response data: "answers" must be an array.');
    }
    if (typeof d.savedAt !== 'string') {
        throw new common_1.BadRequestException('Invalid response data: "savedAt" must be an ISO 8601 string.');
    }
    return d;
}
//# sourceMappingURL=response-serialiser.js.map