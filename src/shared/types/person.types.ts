import { Gender } from '@prisma/client';

// Define Person type based on the Prisma schema
export type Person = {
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

export { Gender };

export interface CreatePersonRequest {
  name: string;
  gender: Gender;
  birthDate: Date | string;
  deathDate?: Date | string | null;
  bio?: string | null;
  profilePictureUrl?: string | null;
}

export interface UpdatePersonRequest {
  name?: string;
  gender?: Gender;
  birthDate?: Date | string;
  deathDate?: Date | string | null;
  bio?: string | null;
  profilePictureUrl?: string | null;
}

export interface PersonResponse {
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
