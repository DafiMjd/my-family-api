import { RelationshipType } from "@prisma/client";
import { PersonResponse } from "./person.types";
import { CreatePersonApiRequest } from "./person.types";
export { RelationshipType };
export interface MarriageRequest {
    personId1: string;
    personId2: string;
    startDate?: Date | string;
    endDate?: Date | string | null;
}
export interface MarryPersonInput {
    personId?: string;
    newPerson?: CreatePersonApiRequest;
}
export interface MarriageCreateRequest {
    person1: MarryPersonInput;
    person2: MarryPersonInput;
    startDate?: Date | string;
    endDate?: Date | string | null;
}
export interface DivorceRequest {
    fatherId: string;
    motherId: string;
    endDate?: Date | string;
}
export interface CancelMarriageRequest {
    fatherId: string;
    motherId: string;
}
export interface CancelDivorceRequest {
    fatherId: string;
    motherId: string;
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
//# sourceMappingURL=marriage.types.d.ts.map