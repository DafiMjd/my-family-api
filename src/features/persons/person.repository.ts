import type { Prisma } from "@prisma/client";
import { ParentType, RelationshipType } from "@prisma/client";
import prisma from "@/shared/database/prisma";
import type {
  Person,
  CreatePersonRequest,
  UpdatePersonRequest,
  Gender,
} from "@/shared/types/person.types";

function trimToNullString(value: string | null | undefined, max: number): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  if (trimmed === "") {
    return null;
  }
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

export interface PersonFilters {
  name?: string;
  gender?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedPersons {
  data: Person[];
  total: number;
}

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}

export interface DeletePersonOptions {
  deleteSpouse?: boolean;
  deleteChildren?: boolean;
}

class PersonRepository {
  async findAll(filters?: PersonFilters): Promise<PaginatedPersons> {
    const normalizedStatus = filters?.status?.toUpperCase();

    const statusWhere =
      normalizedStatus === "MARRIED"
        ? {
          relationships: {
            some: {
              type: RelationshipType.SPOUSE,
              endDate: null,
            },
          },
        }
        : normalizedStatus === "SINGLE"
          ? {
            relationships: {
              none: {
                type: RelationshipType.SPOUSE,
                endDate: null,
              },
            },
          }
          : {};

    const where = {
      ...(filters?.name && { name: { contains: filters.name, mode: "insensitive" as const } }),
      ...(filters?.gender && { gender: filters.gender as Gender }),
      ...statusWhere,
    };

    const [data, total] = await prisma.$transaction([
      prisma.person.findMany({
        where,
        orderBy: { name: "asc" },
        ...(filters?.limit !== undefined && { take: filters.limit }),
        ...(filters?.offset !== undefined && { skip: filters.offset }),
      }),
      prisma.person.count({ where }),
    ]);

    return { data, total };
  }

  async findLatestCreated(
    pagination?: PaginationQuery
  ): Promise<PaginatedPersons> {
    const [data, total] = await prisma.$transaction([
      prisma.person.findMany({
        orderBy: { createdAt: "desc" },
        ...(pagination?.limit !== undefined && { take: pagination.limit }),
        ...(pagination?.offset !== undefined && { skip: pagination.offset }),
      }),
      prisma.person.count(),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Person | null> {
    return await prisma.person.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Person | null> {
    return await prisma.person.findFirst({
      where: { name },
    });
  }

  async create(personData: CreatePersonRequest): Promise<Person> {
    const { name, gender, birthDate, deathDate, bio, profilePictureUrl, phoneNumber, address } =
      personData;
    return await prisma.person.create({
      data: {
        name,
        gender,
        bio: bio ?? null,
        profilePictureUrl: profilePictureUrl ?? null,
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: deathDate ? new Date(deathDate) : null,
        phoneNumber: trimToNullString(phoneNumber, 50),
        address: trimToNullString(address, 2000),
      },
    });
  }

  async upsertBiologicalParentChild(
    parentId: string,
    parentName: string,
    childId: string,
    childName: string
  ): Promise<void> {
    await prisma.parentChild.upsert({
      where: { parentId_childId: { parentId, childId } },
      update: { parentName, childName },
      create: {
        parentId,
        parentName,
        childId,
        childName,
        type: ParentType.BIOLOGICAL,
      },
    });
  }

  /**
   * Links `child` to `designatedParent`, and if that person has an active spouse,
   * links the child to the spouse as well (both biological parent_child rows).
   */
  async linkBiologicalParentsForDesignatedParent(
    childId: string,
    childName: string,
    designatedParent: { id: string; name: string }
  ): Promise<void> {
    await this.upsertBiologicalParentChild(
      designatedParent.id,
      designatedParent.name,
      childId,
      childName
    );

    const marriage = await prisma.relationship.findFirst({
      where: {
        personId: designatedParent.id,
        type: RelationshipType.SPOUSE,
        endDate: null,
      },
      select: {
        relatedPersonId: true,
        relatedPersonName: true,
      },
    });

    if (marriage) {
      await this.upsertBiologicalParentChild(
        marriage.relatedPersonId,
        marriage.relatedPersonName,
        childId,
        childName
      );
    }
  }

  async createMany(datas: CreatePersonRequest[]): Promise<Person[]> {
    return await prisma.$transaction(
      datas.map((person) => {
        const {
          name,
          gender,
          birthDate,
          deathDate,
          bio,
          profilePictureUrl,
          phoneNumber,
          address,
        } = person;
        return prisma.person.create({
          data: {
            name,
            gender,
            bio: bio ?? null,
            profilePictureUrl: profilePictureUrl ?? null,
            birthDate: birthDate ? new Date(birthDate) : null,
            deathDate: deathDate ? new Date(deathDate) : null,
            phoneNumber: trimToNullString(phoneNumber, 50),
            address: trimToNullString(address, 2000),
          },
        });
      })
    );
  }

  async update(
    id: string,
    personData: UpdatePersonRequest
  ): Promise<Person | null> {
    try {
      const updateData: any = { ...personData };

      // Convert date strings to Date objects if provided
      if (personData.birthDate !== undefined) {
        updateData.birthDate = personData.birthDate
          ? new Date(personData.birthDate)
          : null;
      }
      if (personData.deathDate !== undefined) {
        updateData.deathDate = personData.deathDate
          ? new Date(personData.deathDate)
          : null;
      }
      if (personData.phoneNumber !== undefined) {
        updateData.phoneNumber = trimToNullString(personData.phoneNumber, 50);
      }
      if (personData.address !== undefined) {
        updateData.address = trimToNullString(personData.address, 2000);
      }

      return await prisma.person.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      // If person doesn't exist, Prisma throws an error
      return null;
    }
  }

  async delete(id: string, options?: DeletePersonOptions): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        const person = await tx.person.findUnique({
          where: { id },
          select: { id: true },
        });

        if (!person) {
          throw new Error("PERSON_NOT_FOUND");
        }

        const idsToDelete = new Set<string>([id]);

        if (options?.deleteSpouse) {
          const spouse = await tx.relationship.findFirst({
            where: {
              personId: id,
              type: RelationshipType.SPOUSE,
              endDate: null,
            },
            select: { relatedPersonId: true },
          });

          if (spouse?.relatedPersonId) {
            idsToDelete.add(spouse.relatedPersonId);
          }
        }

        if (options?.deleteChildren) {
          const parentIds = Array.from(idsToDelete);
          const children = await tx.parentChild.findMany({
            where: { parentId: { in: parentIds } },
            select: { childId: true },
          });

          for (const child of children) {
            idsToDelete.add(child.childId);
          }
        }

        await tx.person.deleteMany({
          where: { id: { in: Array.from(idsToDelete) } },
        });
      });

      return true;
    } catch (error) {
      // If person doesn't exist, return false
      return false;
    }
  }

  async count(): Promise<number> {
    return await prisma.person.count();
  }

  async findByGender(gender: string): Promise<Person[]> {
    return await prisma.person.findMany({
      where: { gender: gender as any },
      orderBy: { name: "asc" },
    });
  }

  async findLiving(): Promise<Person[]> {
    return await prisma.person.findMany({
      where: { deathDate: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async findDeceased(): Promise<Person[]> {
    return await prisma.person.findMany({
      where: { deathDate: { not: null } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPersonsByIds(personIds: string[]): Promise<Person[]> {
    if (personIds.length === 0) {
      return [];
    }
    return await prisma.person.findMany({
      where: {
        id: { in: personIds },
      },
    });
  }
}

export default new PersonRepository();
