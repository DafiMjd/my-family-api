import { Gender, FamilyMemberRole } from "@prisma/client";
import { CreatePersonRequest, CreatePersonRequestWithSpouse, ParentPairInput } from "./person.types";

// Database model types
export type Family = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FamilyMember = {
  familyId: string;
  personId: string;
  role: FamilyMemberRole;
};

export type FamilyWithMembers = Family & {
  familyMembers: Array<{
    personId: string;
    role: FamilyMemberRole;
    person: {
      id: string;
      name: string;
      gender: Gender;
      birthDate: Date;
      deathDate: Date | null;
      bio: string | null;
      profilePictureUrl: string | null;
    };
  }>;
};

// PARENT role covers both father (MAN) and mother (WOMAN) — gender distinguishes them

// Request types
export interface CreateFamilyRequestById {
  fatherId: string;
  motherId: string;
  childrenIds: string[];
  name?: string;
  description?: string | null;
}

/**
 * Father or mother row: person fields plus optional parent pair.
 * If parent is null, this parent is treated as first generation for that branch.
 */
export interface CreateFamilyParentInput extends CreatePersonRequest {
  parent?: ParentPairInput | null;
}

/**
 * POST /api/family/one — create family with new persons only.
 * Default name: `${father.name} & ${mother.name}'s Family` when name is empty or omitted.
 */
export interface CreateFamilyRequest {
  father: CreateFamilyParentInput;
  mother: CreateFamilyParentInput;
  children: CreatePersonRequestWithSpouse[];
  name?: string;
  description?: string | null;
}

export interface UpdateFamilyChildrenRequest {
  childrenIds: string[];
}

export interface UpdateFamilyFatherRequest {
  fatherId: string;
}

export interface UpdateFamilyMotherRequest {
  motherId: string;
}

export interface DeleteFamilyRequest {
  deleteSpouseRelationship?: boolean;
}

export interface GetFamiliesQuery {
  fatherId?: string;
  motherId?: string;
  childrenId?: string;
  limit?: number;
  offset?: number;
}

// Response types
export interface FamilyResponse {
  id: string;
  name: string;
  description: string | null;
  father: {
    id: string;
    name: string;
    gender: Gender;
    birthDate: Date;
    deathDate: Date | null;
    bio: string | null;
    profilePictureUrl: string | null;
  } | null;
  mother: {
    id: string;
    name: string;
    gender: Gender;
    birthDate: Date;
    deathDate: Date | null;
    bio: string | null;
    profilePictureUrl: string | null;
  } | null;
  children: Array<{
    id: string;
    name: string;
    gender: Gender;
    birthDate: Date;
    deathDate: Date | null;
    bio: string | null;
    profilePictureUrl: string | null;
    /** Present when a spouse was created with this child on POST /api/family/one; otherwise null. */
    spouse: {
      id: string;
      name: string;
      gender: Gender;
      birthDate: Date;
      deathDate: Date | null;
      bio: string | null;
      profilePictureUrl: string | null;
    } | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyErrorResponse {
  success: false;
  error: string;
  message: string;
}

// Re-export enums
export { Gender, FamilyMemberRole };
