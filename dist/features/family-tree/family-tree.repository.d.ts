import { ChildInput, FamilyTreePerson, FamilyTreePersonWithRelation, FamilyTreePersonWithRelationAndSpouses, PersonWithClosestRelatives, RootPersonWithSpouses } from "../../shared/types/family-tree.types";
type AddChildrenResult = {
    created: FamilyTreePerson[];
    parent: FamilyTreePerson;
    spouse: FamilyTreePerson | null;
};
declare class FamilyTreeRepository {
    findRootsWithSpouse(): Promise<RootPersonWithSpouses[]>;
    findChildrenWithSpouse(personId: string): Promise<FamilyTreePersonWithRelationAndSpouses[] | null>;
    findChildren(personId: string): Promise<FamilyTreePersonWithRelation[]>;
    findParents(personId: string): Promise<FamilyTreePersonWithRelation[]>;
    findClosestRelatedPeople(personId: string): Promise<PersonWithClosestRelatives>;
    personExists(personId: string): Promise<boolean>;
    addChildren(parentId: string, children: ChildInput[]): Promise<AddChildrenResult | null>;
    hasChildren(personId: string): Promise<boolean | null>;
}
declare const _default: FamilyTreeRepository;
export default _default;
//# sourceMappingURL=family-tree.repository.d.ts.map