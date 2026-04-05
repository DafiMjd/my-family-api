import { FamilyTreeRootEntryResponse, FamilyTreeRelativeResponse, FamilyTreeRelativeWithSpouseResponse, FamilyTreeClosestRelatedPeopleResponse } from "@/shared/types/family-tree.types";
declare class FamilyTreeService {
    getRoots(): Promise<FamilyTreeRootEntryResponse[]>;
    getChildren(personId: string, withSpouse?: boolean): Promise<FamilyTreeRelativeResponse[] | FamilyTreeRelativeWithSpouseResponse[]>;
    getClosestRelatedPeople(personId: string): Promise<FamilyTreeClosestRelatedPeopleResponse>;
    getParents(personId: string): Promise<FamilyTreeRelativeResponse[]>;
    private mapToPersonResponse;
    private mapToRelativeResponse;
    private mapToRelativeWithSpouseResponse;
}
declare const _default: FamilyTreeService;
export default _default;
//# sourceMappingURL=family-tree.service.d.ts.map