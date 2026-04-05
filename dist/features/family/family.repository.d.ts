import { Relationship, FamilyMemberRole, ParentType } from "@prisma/client";
import { FamilyWithMembers, GetFamiliesQuery } from "@/shared/types/family.types";
declare class FamilyRepository {
    findById(familyId: string): Promise<FamilyWithMembers | null>;
    findFamilies(filters: GetFamiliesQuery): Promise<FamilyWithMembers[]>;
    createFamily(name: string, description: string | null, fatherId: string, motherId: string, childrenIds: string[]): Promise<FamilyWithMembers>;
    createParentChildRelationships(parentId: string, parentName: string, childId: string, childName: string, type?: ParentType): Promise<void>;
    createSpouseRelationship(personId1: string, personName1: string, personId2: string, personName2: string, startDate: Date): Promise<Relationship[]>;
    findActiveSpouseRelationship(personId1: string, personId2: string): Promise<Relationship | null>;
    findActiveMarriage(personId: string): Promise<Relationship | null>;
    updateFamilyChildren(familyId: string, newChildrenIds: string[]): Promise<FamilyWithMembers>;
    updateFamilyFather(familyId: string, newFatherId: string): Promise<FamilyWithMembers>;
    updateFamilyMother(familyId: string, newMotherId: string): Promise<FamilyWithMembers>;
    deleteParentChildRelationships(parentIds: string[], childrenIds: string[]): Promise<void>;
    deleteSpouseRelationship(personId1: string, personId2: string): Promise<void>;
    deleteFamily(familyId: string): Promise<boolean>;
    getFamilyMembersByRole(familyId: string, role: FamilyMemberRole): Promise<({
        person: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            gender: import(".prisma/client").$Enums.Gender;
            birthDate: Date;
            deathDate: Date | null;
            bio: string | null;
            profilePictureUrl: string | null;
        };
    } & {
        personId: string;
        familyId: string;
        role: import(".prisma/client").$Enums.FamilyMemberRole;
    })[]>;
}
declare const _default: FamilyRepository;
export default _default;
//# sourceMappingURL=family.repository.d.ts.map