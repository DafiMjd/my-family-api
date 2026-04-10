import { Gender, ParentType } from "@prisma/client";
export type FamilyTreePerson = {
    id: string;
    name: string;
    gender: Gender;
    birthDate: Date;
    deathDate: Date | null;
    bio: string | null;
    profilePictureUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
};
export type RootPersonWithSpouse = FamilyTreePerson & {
    relationships: Array<{
        relatedPerson: FamilyTreePerson & {
            _count: {
                childOf: number;
            };
        };
    }>;
};
export type RootPersonWithSpouses = FamilyTreePerson & {
    relationships: Array<{
        startDate: Date | null;
        endDate: Date | null;
        relatedPerson: FamilyTreePerson & {
            _count: {
                childOf: number;
            };
        };
    }>;
};
export type FamilyTreePersonWithRelation = FamilyTreePerson & {
    relationshipType: ParentType;
};
export type PersonWithChildrenAndSpouse = {
    parentsOf: Array<{
        child: FamilyTreePerson & {
            relationships: Array<{
                startDate: Date | null;
                endDate: Date | null;
                relatedPerson: FamilyTreePerson;
            }>;
        };
        type: ParentType;
    }>;
} | null;
export type FamilyTreePersonWithRelationAndSpouses = FamilyTreePerson & {
    relationshipType: ParentType;
    spouses: Array<{
        person: FamilyTreePerson;
        startDate: Date | null;
        endDate: Date | null;
    }>;
};
export interface FamilyTreePersonResponse {
    id: string;
    name: string;
    gender: Gender;
    birthDate: string;
    deathDate: string | null;
    bio: string | null;
    profilePictureUrl: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface FamilyTreeSpouseResponse extends FamilyTreePersonResponse {
    startMarriageDate: string | null;
    endMarriageDate: string | null;
}
export interface FamilyTreeRootEntryResponse extends FamilyTreePersonResponse {
    spouses: FamilyTreeSpouseResponse[];
    isMarried: boolean;
}
export type FamilyTreeRootsResponse = FamilyTreePersonResponse;
export interface FamilyTreeRelativeResponse extends FamilyTreePersonResponse {
    relationshipType: ParentType;
}
export interface FamilyTreeRelativeWithSpouseResponse extends FamilyTreeRelativeResponse {
    spouse: FamilyTreeSpouseResponse | null;
}
export interface FamilyTreeRelativeWithSpousesResponse extends FamilyTreeRelativeResponse {
    spouses: FamilyTreeSpouseResponse[];
}
export type PersonWithClosestRelatives = {
    relationships: Array<{
        relatedPerson: FamilyTreePerson;
        startDate: Date | null;
        endDate: Date | null;
    }>;
    parentsOf: Array<{
        child: FamilyTreePerson;
        type: ParentType;
    }>;
    childOf: Array<{
        parent: FamilyTreePerson;
        type: ParentType;
    }>;
} | null;
export interface FamilyTreeClosestRelatedPeopleResponse {
    spouse: FamilyTreeSpouseResponse | null;
    children: FamilyTreeRelativeResponse[];
    parents: FamilyTreeRelativeResponse[];
}
export interface ChildInput {
    name: string;
    gender: Gender;
    birthDate: string;
    deathDate?: string | null;
    bio?: string | null;
    profilePictureUrl?: string | null;
}
export interface AddChildrenRequest {
    parentId: string;
    children: ChildInput[];
}
export interface AddChildrenResponse {
    children: FamilyTreePersonResponse[];
    connectedParents: FamilyTreePersonResponse[];
}
export { ParentType, Gender };
//# sourceMappingURL=family-tree.types.d.ts.map