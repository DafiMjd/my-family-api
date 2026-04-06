import {
  Relationship,
  RelationshipType,
  FamilyMemberRole,
  ParentType,
} from "@prisma/client";
import prisma from "@/shared/database/prisma";
import {
  FamilyWithMembers,
  GetFamiliesQuery,
} from "@/shared/types/family.types";

export interface PaginatedFamilies {
  data: FamilyWithMembers[];
  total: number;
}

class FamilyRepository {
  // Find family by ID with members
  async findById(familyId: string): Promise<FamilyWithMembers | null> {
    return await prisma.family.findUnique({
      where: { id: familyId },
      include: {
        familyMembers: {
          include: {
            person: {
              select: {
                id: true,
                name: true,
                gender: true,
                birthDate: true,
                deathDate: true,
                bio: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    });
  }

  // Find families with filters
  async findFamilies(filters: GetFamiliesQuery): Promise<PaginatedFamilies> {
    const { fatherId, motherId, childrenId, limit, offset } = filters;

    // Build where clause dynamically
    const whereConditions: any = {};

    if (fatherId || motherId || childrenId) {
      whereConditions.familyMembers = {
        some: {
          OR: [
            fatherId
              ? { personId: fatherId, role: FamilyMemberRole.PARENT }
              : undefined,
            motherId
              ? { personId: motherId, role: FamilyMemberRole.PARENT }
              : undefined,
            childrenId
              ? { personId: childrenId, role: FamilyMemberRole.CHILD }
              : undefined,
          ].filter(Boolean),
        },
      };
    }

    const [data, total] = await prisma.$transaction([
      prisma.family.findMany({
        where: whereConditions,
        include: {
          familyMembers: {
            include: {
              person: {
                select: {
                  id: true,
                  name: true,
                  gender: true,
                  birthDate: true,
                  deathDate: true,
                  bio: true,
                  profilePictureUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        ...(limit !== undefined && { take: limit }),
        ...(offset !== undefined && { skip: offset }),
      }),
      prisma.family.count({ where: whereConditions }),
    ]);

    return { data, total };
  }

  // Create family with members
  async createFamily(
    name: string,
    description: string | null,
    fatherId: string,
    motherId: string,
    childrenIds: string[]
  ): Promise<FamilyWithMembers> {
    return await prisma.family.create({
      data: {
        name,
        description,
        familyMembers: {
          create: [
            { personId: fatherId, role: FamilyMemberRole.PARENT },
            { personId: motherId, role: FamilyMemberRole.PARENT },
            ...childrenIds.map((childId) => ({
              personId: childId,
              role: FamilyMemberRole.CHILD,
            })),
          ],
        },
      },
      include: {
        familyMembers: {
          include: {
            person: {
              select: {
                id: true,
                name: true,
                gender: true,
                birthDate: true,
                deathDate: true,
                bio: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    });
  }

  // Create parent-child relationship
  async createParentChildRelationships(
    parentId: string,
    parentName: string,
    childId: string,
    childName: string,
    type: ParentType = ParentType.BIOLOGICAL
  ): Promise<void> {
    await prisma.parentChild.upsert({
      where: { parentId_childId: { parentId, childId } },
      update: { parentName, childName },
      create: { parentId, parentName, childId, childName, type },
    });
  }

  // Create spouse relationship (bidirectional)
  async createSpouseRelationship(
    personId1: string,
    personName1: string,
    personId2: string,
    personName2: string,
    startDate: Date
  ): Promise<Relationship[]> {
    return await prisma.$transaction([
      prisma.relationship.create({
        data: {
          personId: personId1,
          personName: personName1,
          relatedPersonId: personId2,
          relatedPersonName: personName2,
          type: RelationshipType.SPOUSE,
          startDate,
          endDate: null,
        },
      }),
      prisma.relationship.create({
        data: {
          personId: personId2,
          personName: personName2,
          relatedPersonId: personId1,
          relatedPersonName: personName1,
          type: RelationshipType.SPOUSE,
          startDate,
          endDate: null,
        },
      }),
    ]);
  }

  // Find active spouse relationship
  async findActiveSpouseRelationship(
    personId1: string,
    personId2: string
  ): Promise<Relationship | null> {
    return await prisma.relationship.findFirst({
      where: {
        personId: personId1,
        relatedPersonId: personId2,
        type: RelationshipType.SPOUSE,
        endDate: null,
      },
    });
  }

  // Find active marriage for a person
  async findActiveMarriage(personId: string): Promise<Relationship | null> {
    return await prisma.relationship.findFirst({
      where: {
        personId,
        type: RelationshipType.SPOUSE,
        endDate: null,
      },
    });
  }

  // Update family children
  async updateFamilyChildren(
    familyId: string,
    newChildrenIds: string[]
  ): Promise<FamilyWithMembers> {
    await prisma.familyMember.deleteMany({
      where: { familyId, role: FamilyMemberRole.CHILD },
    });

    await prisma.familyMember.createMany({
      data: newChildrenIds.map((childId) => ({
        familyId,
        personId: childId,
        role: FamilyMemberRole.CHILD,
      })),
    });

    // Return updated family
    return (await this.findById(familyId))!;
  }

  // Update family father
  async updateFamilyFather(
    familyId: string,
    newFatherId: string
  ): Promise<FamilyWithMembers> {
    const currentFather = await prisma.familyMember.findFirst({
      where: { familyId, role: FamilyMemberRole.PARENT, person: { gender: "MAN" } },
    });

    if (currentFather) {
      await prisma.familyMember.delete({
        where: { familyId_personId: { familyId, personId: currentFather.personId } },
      });
    }

    await prisma.familyMember.create({
      data: {
        familyId,
        personId: newFatherId,
        role: FamilyMemberRole.PARENT,
      },
    });

    return (await this.findById(familyId))!;
  }

  // Update family mother
  async updateFamilyMother(
    familyId: string,
    newMotherId: string
  ): Promise<FamilyWithMembers> {
    const currentMother = await prisma.familyMember.findFirst({
      where: { familyId, role: FamilyMemberRole.PARENT, person: { gender: "WOMAN" } },
    });

    if (currentMother) {
      await prisma.familyMember.delete({
        where: { familyId_personId: { familyId, personId: currentMother.personId } },
      });
    }

    await prisma.familyMember.create({
      data: {
        familyId,
        personId: newMotherId,
        role: FamilyMemberRole.PARENT,
      },
    });

    return (await this.findById(familyId))!;
  }

  // Delete parent-child relationships for a family
  async deleteParentChildRelationships(
    parentIds: string[],
    childrenIds: string[]
  ): Promise<void> {
    await prisma.parentChild.deleteMany({
      where: {
        parentId: { in: parentIds },
        childId: { in: childrenIds },
      },
    });
  }

  // Delete spouse relationship
  async deleteSpouseRelationship(
    personId1: string,
    personId2: string
  ): Promise<void> {
    await prisma.relationship.deleteMany({
      where: {
        OR: [
          {
            personId: personId1,
            relatedPersonId: personId2,
            type: RelationshipType.SPOUSE,
          },
          {
            personId: personId2,
            relatedPersonId: personId1,
            type: RelationshipType.SPOUSE,
          },
        ],
      },
    });
  }

  // Delete family
  async deleteFamily(familyId: string): Promise<boolean> {
    try {
      await prisma.family.delete({
        where: { id: familyId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get family members by role
  async getFamilyMembersByRole(familyId: string, role: FamilyMemberRole) {
    return await prisma.familyMember.findMany({
      where: {
        familyId,
        role,
      },
      include: {
        person: true,
      },
    });
  }
}

export default new FamilyRepository();
