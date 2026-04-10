import type { PersonResponse } from "../../shared/types/person.types";
import { AddChildrenResponse, FamilyTreeRootEntryResponse, FamilyTreeRelativeResponse, FamilyTreeRelativeWithSpousesResponse, FamilyTreeClosestRelatedPeopleResponse, AddChildrenRequest, MarriedCoupleEntryResponse } from "../../shared/types/family-tree.types";
declare class FamilyTreeService {
    getRoots(): Promise<FamilyTreeRootEntryResponse[]>;
    getMarriedCouples(): Promise<MarriedCoupleEntryResponse[]>;
    getChildren(fatherId: string | undefined, motherId: string | undefined, withSpouse?: boolean): Promise<FamilyTreeRelativeResponse[] | FamilyTreeRelativeWithSpousesResponse[]>;
    getClosestRelatedPeople(personId: string): Promise<FamilyTreeClosestRelatedPeopleResponse>;
    getParents(personId: string): Promise<FamilyTreeRelativeResponse[]>;
    addChildren(request: AddChildrenRequest): Promise<AddChildrenResponse>;
    hasChildren(personId: string): Promise<boolean>;
    getChildrenCandidates(limit: number, offset: number): Promise<{
        data: PersonResponse[];
        total: number;
    }>;
    private mapDbPersonToPersonResponse;
    private mapMarriedCouplePerson;
    private mapToPersonResponse;
    private mapToRelativeResponse;
    private mapToRelativeWithSpousesResponse;
    private mapToSpouseResponse;
}
declare const _default: FamilyTreeService;
export default _default;
//# sourceMappingURL=family-tree.service.d.ts.map