import type { PaginatedPersons } from "../persons/person.repository";
import type { AddChildItem } from "../../shared/types/family-tree.types";
import { FamilyTreePerson, FamilyTreePersonWithRelation, FamilyTreePersonWithRelationAndSpouses, PersonWithClosestRelatives, RootPersonWithSpouses } from "../../shared/types/family-tree.types";
type AddChildrenResult = {
    created: FamilyTreePerson[];
    parents: [FamilyTreePerson, FamilyTreePerson];
};
declare class FamilyTreeRepository {
    private getChildrenCandidateWhere;
    isChildrenCandidate(personId: string): Promise<boolean>;
    findRootsWithSpouse(): Promise<RootPersonWithSpouses[]>;
    findMarriedCouples(): Promise<Array<{
        father: FamilyTreePerson;
        mother: FamilyTreePerson;
    }>>;
    areMarriedPair(fatherId: string, motherId: string): Promise<boolean>;
    findChildrenWithSpouseByPair(fatherId: string, motherId: string): Promise<FamilyTreePersonWithRelationAndSpouses[]>;
    findChildrenByPair(fatherId: string, motherId: string): Promise<FamilyTreePersonWithRelation[]>;
    findChildrenWithSpouseByParent(parentId: string): Promise<FamilyTreePersonWithRelationAndSpouses[]>;
    findChildrenByParent(parentId: string): Promise<FamilyTreePersonWithRelation[]>;
    findParents(personId: string): Promise<FamilyTreePersonWithRelation[]>;
    findClosestRelatedPeople(personId: string): Promise<PersonWithClosestRelatives>;
    personExists(personId: string): Promise<boolean>;
    addChildren(parent: {
        fatherId: string;
        motherId: string;
    }, children: AddChildItem[]): Promise<AddChildrenResult | null>;
    findChildrenCandidates(limit: number, offset: number): Promise<PaginatedPersons>;
    hasChildren(personId: string): Promise<boolean | null>;
}
declare const _default: FamilyTreeRepository;
export default _default;
//# sourceMappingURL=family-tree.repository.d.ts.map