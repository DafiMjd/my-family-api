import { Gender, FamilyMemberRole } from "@prisma/client";
import { CreatePersonRequest } from "./person.types";

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

export interface CreateFamilyPersonRequest {
  id?: string | null;
  person?: CreatePersonRequest | null;
}

// Request types
export interface CreateFamilyRequestById {
  fatherId: string;
  motherId: string;
  childrenIds: string[];
  name?: string;
  description?: string | null;
}

// Create family by full person payloads
export interface CreateFamilyRequest {
  father: CreateFamilyPersonRequest;
  mother: CreateFamilyPersonRequest;
  children: CreateFamilyPersonRequest[];
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
