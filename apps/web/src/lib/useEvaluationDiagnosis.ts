'use client';

import { useApi } from '@/lib/useApi';
import { evaluationApiEndpoints } from '@/lib/apiEndpoints';

export interface DiagnosisApiState {
  gapsApi: ReturnType<typeof useApi<any>>;
  responsesApi: ReturnType<typeof useApi<any>>;
  diagnosisApi: ReturnType<typeof useApi<any>>;
}

export function useEvaluationDiagnosis(id: string | null, enabled = true): DiagnosisApiState {
  const shouldFetch = Boolean(id && enabled);

  const gapsApi = useApi<any>(shouldFetch ? evaluationApiEndpoints.gaps(id as string) : null);
  const responsesApi = useApi<any>(shouldFetch ? evaluationApiEndpoints.responses(id as string) : null);
  const diagnosisApi = useApi<any>(shouldFetch ? evaluationApiEndpoints.diagnosis(id as string) : null);

  return {
    gapsApi,
    responsesApi,
    diagnosisApi,
  };
}
