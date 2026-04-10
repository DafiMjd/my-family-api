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

export type RootPersonWithSpouses = FamilyTreePerson & {
  relationships: Array<{
    startDate: Date | null;
    endDate: Date | null;
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

// Each entry in the roots response — a couple or a single person
export interface FamilyTreeRootEntryResponse extends FamilyTreePersonResponse {
  spouses: FamilyTreeSpouseResponse[];
}

// Kept as alias so existing /children and /parents types are unchanged
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

/** One MAN/WOMAN marriage from the SPOUSE graph (for parent pickers, etc.). */
export interface MarriedCoupleEntryResponse {
  father: FamilyTreeRelativeWithSpousesResponse;
  mother: FamilyTreeRelativeWithSpousesResponse;
}

// Internal type for the single-query closest-related-people result.
export type PersonWithClosestRelatives = {
  relationships: Array<{
    relatedPerson: FamilyTreePerson;
    startDate: Date | null;
    endDate: Date | null;
  }>;
  parentsOf: Array<{ child: FamilyTreePerson; type: ParentType }>;
  childOf: Array<{ parent: FamilyTreePerson; type: ParentType }>;
} | null;

export interface FamilyTreeClosestRelatedPeopleResponse {
  spouse: FamilyTreeSpouseResponse | null;
  children: FamilyTreeRelativeResponse[];
  parents: FamilyTreeRelativeResponse[];
}

/** New child payload inside POST /api/family-tree/add-children. Parents come from `parent` on the request body. */
export interface AddChildNewPersonInput {
  name: string;
  gender: Gender;
  birthDate: string;
  deathDate?: string | null;
  bio?: string | null;
  profilePictureUrl?: string | null;
}

/** Either link an existing person (must satisfy children-candidate rules) or create a new one. */
export type AddChildItem = { personId: string } | { newPerson: AddChildNewPersonInput };

export interface AddChildrenRequest {
  parent: {
    fatherId: string;
    motherId: string;
  };
  children: AddChildItem[];
}

export interface AddChildrenResponse {
  children: FamilyTreePersonResponse[];
  connectedParents: FamilyTreePersonResponse[];
}

export { ParentType, Gender };
