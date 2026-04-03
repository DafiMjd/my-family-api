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

// Internal type returned by the repository — root person with their active spouse.
// _count.childOf tells us whether the spouse has parents (came from another family).
export type RootPersonWithSpouse = FamilyTreePerson & {
  relationships: Array<{
    relatedPerson: FamilyTreePerson & {
      _count: { childOf: number };
    };
  }>;
};

export type FamilyTreePersonWithRelation = FamilyTreePerson & {
  relationshipType: ParentType;
};

// Internal type returned by the repository — person with its children, each child carrying their own active spouse.
export type PersonWithChildrenAndSpouse = {
  parentsOf: Array<{
    child: FamilyTreePerson & {
      relationships: Array<{ relatedPerson: FamilyTreePerson }>;
    };
    type: ParentType;
  }>;
} | null;

// Flattened internal type after mapping the raw repo result.
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

// Each entry in the roots response — a couple or a single person
export interface FamilyTreeRootEntryResponse {
  father: FamilyTreePersonResponse | null;
  mother: FamilyTreePersonResponse | null;
  isMarried: boolean;
}

// Kept as alias so existing /children and /parents types are unchanged
export type FamilyTreeRootsResponse = FamilyTreePersonResponse;

export interface FamilyTreeRelativeResponse extends FamilyTreePersonResponse {
  relationshipType: ParentType;
}

export interface FamilyTreeRelativeWithSpouseResponse extends FamilyTreeRelativeResponse {
  spouse: FamilyTreePersonResponse | null;
}

export { ParentType, Gender };
