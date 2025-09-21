import { RelationshipType } from "@prisma/client";
import { PersonResponse } from "./person.types";

export { RelationshipType };

export interface MarriageRequest {
  personId1: string;
  personId2: string;
  startDate?: Date | string;
}

export interface DivorceRequest {
  personId: string;
  endDate?: Date | string;
}

export interface CancelMarriageRequest {
  personId: string;
}

export interface CancelDivorceRequest {
  personId: string;
}

export interface MarriageResponse {
  id: string;
  personId: string;
  personName: string;
  relatedPersonId: string;
  relatedPersonName: string;
  type: RelationshipType;
  startDate: string | null;
  endDate: string | null;
}

export interface MarriageOperationResponse {
  success: boolean;
  data: MarriageResponse[];
  message: string;
}

export interface MarriageErrorResponse {
  success: false;
  error: string;
  message: string;
}

export interface MarriedCouple {
  husband: PersonResponse;
  wife: PersonResponse;
  startDate: string | null;
}

export interface DivorcedCouple {
  husband: PersonResponse;
  wife: PersonResponse;
  startDate: string | null;
  endDate: string | null;
}

export interface MarriageListResponse {
  success: boolean;
  data: MarriedCouple[] | DivorcedCouple[];
  message: string;
}

export interface SinglePersonsResponse {
  success: boolean;
  data: PersonResponse[];
  message: string;
}
