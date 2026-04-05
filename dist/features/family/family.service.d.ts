import { CreateFamilyRequestById, UpdateFamilyChildrenRequest, UpdateFamilyFatherRequest, UpdateFamilyMotherRequest, DeleteFamilyRequest, GetFamiliesQuery, FamilyResponse, CreateFamilyRequest } from "@/shared/types/family.types";
declare class FamilyService {
    createFamily(data: CreateFamilyRequest): Promise<FamilyResponse>;
    createFamilyById(data: CreateFamilyRequestById): Promise<FamilyResponse>;
    private createFamilyWithMembers;
    getFamilyById(familyId: string): Promise<FamilyResponse | null>;
    getFamilies(filters: GetFamiliesQuery): Promise<FamilyResponse[]>;
    updateFamilyChildren(familyId: string, data: UpdateFamilyChildrenRequest): Promise<FamilyResponse>;
    updateFamilyFather(familyId: string, data: UpdateFamilyFatherRequest): Promise<FamilyResponse>;
    updateFamilyMother(familyId: string, data: UpdateFamilyMotherRequest): Promise<FamilyResponse>;
    deleteFamily(familyId: string, options?: DeleteFamilyRequest): Promise<boolean>;
    private mapToResponse;
}
declare const _default: FamilyService;
export default _default;
//# sourceMappingURL=family.service.d.ts.map