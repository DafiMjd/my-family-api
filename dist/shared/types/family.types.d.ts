import { Gender, FamilyMemberRole } from "@prisma/client";
import { CreatePersonRequest } from "./person.types";
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
export interface CreateFamilyPersonRequest {
    id?: string | null;
    person?: CreatePersonRequest | null;
}
export interface CreateFamilyRequestById {
    fatherId: string;
    motherId: string;
    childrenIds: string[];
    name?: string;
    description?: string | null;
}
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
export { Gender, FamilyMemberRole };
//# sourceMappingURL=family.types.d.ts.map