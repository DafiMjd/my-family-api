import { MarriageRequest, DivorceRequest, CancelMarriageRequest, CancelDivorceRequest, MarriageOperationResponse, MarriageListResponse, SinglePersonsResponse } from "@/shared/types/marriage.types";
declare class MarriageService {
    marry(marriageData: MarriageRequest): Promise<MarriageOperationResponse>;
    divorce(divorceData: DivorceRequest): Promise<MarriageOperationResponse>;
    cancelMarriage(cancelData: CancelMarriageRequest): Promise<MarriageOperationResponse>;
    cancelDivorce(cancelData: CancelDivorceRequest): Promise<MarriageOperationResponse>;
    getPersonsByStatus(status: string, gender?: string): Promise<MarriageListResponse | SinglePersonsResponse>;
    private getMarriedPersons;
    private getDivorcedPersons;
    private getSinglePersons;
    private mapRelationshipToResponse;
    private mapPersonToResponse;
}
declare const _default: MarriageService;
export default _default;
//# sourceMappingURL=marriage.service.d.ts.map