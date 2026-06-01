import { ResponseData } from './response-data.types';
export declare function serializeResponse(response: ResponseData): string;
export declare function prettyPrintResponse(json: string): string;
export declare function deserializeResponse(json: string): ResponseData;
