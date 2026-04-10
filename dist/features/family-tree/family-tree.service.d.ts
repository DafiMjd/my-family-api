import { AddChildrenResponse, ChildInput, FamilyTreeRootEntryResponse, FamilyTreeRelativeResponse, FamilyTreeRelativeWithSpousesResponse, FamilyTreeClosestRelatedPeopleResponse } from "../../shared/types/family-tree.types";
declare class FamilyTreeService {
    getRoots(): Promise<FamilyTreeRootEntryResponse[]>;
    getChildren(personId: string, withSpouse?: boolean): Promise<FamilyTreeRelativeResponse[] | FamilyTreeRelativeWithSpousesResponse[]>;
    getClosestRelatedPeople(personId: string): Promise<FamilyTreeClosestRelatedPeopleResponse>;
    getParents(personId: string): Promise<FamilyTreeRelativeResponse[]>;
    addChildren(parentId: string, children: ChildInput[]): Promise<AddChildrenResponse>;
    hasChildren(personId: string): Promise<boolean>;
    private mapToPersonResponse;
    private mapToRelativeResponse;
    private mapToRelativeWithSpousesResponse;
    private mapToSpouseResponse;
}
declare const _default: FamilyTreeService;
export default _default;
//# sourceMappingURL=family-tree.service.d.ts.map