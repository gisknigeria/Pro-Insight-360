export const evaluationApiEndpoints = {
  gaps: (evaluationId: string) => `/diagnosis/evaluations/${evaluationId}/gaps`,
  responses: (evaluationId: string) => `/diagnosis/evaluations/${evaluationId}/responses`,
  responsesFull: (evaluationId: string) => `/diagnosis/evaluations/${evaluationId}/responses/full`,
  diagnosis: (evaluationId: string) => `/diagnosis/evaluations/${evaluationId}/diagnosis`,
  score: (evaluationId: string) => `/diagnosis/evaluations/${evaluationId}/score`,
};

export const diagnosisApiEndpoints = {
  status: (diagnosisId: string) => `/diagnoses/${diagnosisId}/status`,
};
