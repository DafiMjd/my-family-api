import type { Person as PrismaPerson } from "@prisma/client";
import { Gender } from "@prisma/client";

/** Person row — same shape as Prisma `Person` so repository results type-check after `prisma generate`. */
export type Person = PrismaPerson;

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
  phoneNumber?: string | null;
  address?: string | null;
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
  phoneNumber?: string | null;
  address?: string | null;
}

export interface PersonResponse {
  id: string;
  name: string;
  gender: Gender;
  birthDate: string | null;
  deathDate: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
  phoneNumber: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}
