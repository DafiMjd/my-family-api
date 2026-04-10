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
export type FamilyTreePersonWithRelation = FamilyTreePerson & {
    relationshipType: ParentType;
};
export type PersonWithChildrenAndSpouse = {
    parentsOf: Array<{
        child: FamilyTreePerson & {
            relationships: Array<{
                relatedPerson: FamilyTreePerson;
            }>;
        };
        type: ParentType;
    }>;
} | null;
export type FamilyTreePersonWithRelationAndSpouse = FamilyTreePerson & {
    relationshipType: ParentType;
    spouse: FamilyTreePerson | null;
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
export interface FamilyTreeRootEntryResponse {
    father: FamilyTreePersonResponse | null;
    mother: FamilyTreePersonResponse | null;
    isMarried: boolean;
}
export type FamilyTreeRootsResponse = FamilyTreePersonResponse;
export interface FamilyTreeRelativeResponse extends FamilyTreePersonResponse {
    relationshipType: ParentType;
}
export interface FamilyTreeRelativeWithSpouseResponse extends FamilyTreeRelativeResponse {
    spouse: FamilyTreePersonResponse | null;
}
export type PersonWithClosestRelatives = {
    relationships: Array<{
        relatedPerson: FamilyTreePerson;
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
    spouse: FamilyTreePersonResponse | null;
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