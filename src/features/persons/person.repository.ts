import {
  Person,
  CreatePersonRequest,
  UpdatePersonRequest,
  Gender,
} from "@/shared/types/person.types";
import { ParentType, RelationshipType } from "@prisma/client";
import prisma from "@/shared/database/prisma";

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
    return await prisma.person.create({
      data: {
        ...personData,
        birthDate: new Date(personData.birthDate),
        deathDate: personData.deathDate ? new Date(personData.deathDate) : null,
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
    return await prisma.person.createManyAndReturn({
      data: datas.map((person) => ({
        ...person,
        birthDate: new Date(person.birthDate),
        deathDate: person.deathDate ? new Date(person.deathDate) : null,
      })),
    });
  }

  async update(
    id: string,
    personData: UpdatePersonRequest
  ): Promise<Person | null> {
    try {
      const updateData: any = { ...personData };

      // Convert date strings to Date objects if provided
      if (personData.birthDate) {
        updateData.birthDate = new Date(personData.birthDate);
      }
      if (personData.deathDate !== undefined) {
        updateData.deathDate = personData.deathDate
          ? new Date(personData.deathDate)
          : null;
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
    return await prisma.person.findMany({
      where: {
        id: { in: personIds },
      },
    });
  }
}

export default new PersonRepository();
