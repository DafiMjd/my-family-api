import { Gender } from '@prisma/client';

// Define Person type based on the Prisma schema
export type Person = {
  id: string;
  name: string;
  gender: Gender;
  birthDate: Date | null;
  deathDate: Date | null;
  bio: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export { Gender };

export interface ParentPairInput {
  fatherId: string;
  motherId: string;
}

export interface CreatePersonRequestWithSpouse extends CreatePersonRequest {
  spouse?: CreatePersonRequest;
}

export interface CreatePersonRequest {
  name: string;
  gender: Gender;
  birthDate?: Date | string | null;
  deathDate?: Date | string | null;
  bio?: string | null;
  profilePictureUrl?: string | null;
}

/** POST /api/person/one — person fields plus optional parent link. */
export interface CreatePersonApiRequest extends CreatePersonRequest {
  parent?: ParentPairInput | null;
}

export interface UpdatePersonRequest {
  name?: string;
  gender?: Gender;
  birthDate?: Date | string | null;
  deathDate?: Date | string | null;
  bio?: string | null;
  profilePictureUrl?: string | null;
}

export interface PersonResponse {
  id: string;
  name: string;
  gender: Gender;
  birthDate: string | null;
  deathDate: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
