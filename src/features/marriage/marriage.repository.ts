import { Relationship, RelationshipType } from '@prisma/client';
import prisma from '@/shared/database/prisma';

class MarriageRepository {
  async   createMarriage(
    personId1: string,
    personName1: string,
    personId2: string,
    personName2: string,
    startDate: Date
  ): Promise<Relationship[]> {
    // Create bidirectional marriage relationships
    const relationships = await prisma.$transaction([
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

    return relationships;
  }

  async findActiveMarriage(personId: string): Promise<Relationship | null> {
    return await prisma.relationship.findFirst({
      where: {
        personId,
        type: RelationshipType.SPOUSE,
        endDate: null,
      },
      include: {
        relatedPerson: true,
      },
    });
  }

  async divorceMarriage(personId: string, endDate: Date): Promise<Relationship[]> {
    // Find the active marriage
    const activeMarriage = await this.findActiveMarriage(personId);
    
    if (!activeMarriage) {
      throw new Error('Person is not currently married');
    }

    const spouseId = activeMarriage.relatedPersonId;

    // Update both relationship rows
    const relationships = await prisma.$transaction([
      prisma.relationship.updateMany({
        where: {
          personId,
          relatedPersonId: spouseId,
          type: RelationshipType.SPOUSE,
          endDate: null,
        },
        data: { endDate },
      }),
      prisma.relationship.updateMany({
        where: {
          personId: spouseId,
          relatedPersonId: personId,
          type: RelationshipType.SPOUSE,
          endDate: null,
        },
        data: { endDate },
      }),
    ]);

    // Return the updated relationships
    return await prisma.relationship.findMany({
      where: {
        OR: [
          { personId, relatedPersonId: spouseId, type: RelationshipType.SPOUSE },
          { personId: spouseId, relatedPersonId: personId, type: RelationshipType.SPOUSE },
        ],
      },
    });
  }

  async cancelMarriage(personId: string): Promise<Relationship[]> {
    // Find any marriage (active or inactive)
    const marriage = await prisma.relationship.findFirst({
      where: {
        personId,
        type: RelationshipType.SPOUSE,
      },
    });

    if (!marriage) {
      throw new Error('Person has no marriage to cancel');
    }

    const spouseId = marriage.relatedPersonId;

    // Delete both relationship rows
    await prisma.$transaction([
      prisma.relationship.deleteMany({
        where: {
          personId,
          relatedPersonId: spouseId,
          type: RelationshipType.SPOUSE,
        },
      }),
      prisma.relationship.deleteMany({
        where: {
          personId: spouseId,
          relatedPersonId: personId,
          type: RelationshipType.SPOUSE,
        },
      }),
    ]);

    // Return empty array since relationships are deleted
    return [];
  }

  async findAnyMarriage(personId: string): Promise<Relationship | null> {
    return await prisma.relationship.findFirst({
      where: {
        personId,
        type: RelationshipType.SPOUSE,
      },
    });
  }

  async cancelDivorce(personId: string): Promise<Relationship[]> {
    // Find the divorced marriage (has end_date IS NOT NULL)
    const divorcedMarriage = await prisma.relationship.findFirst({
      where: {
        personId,
        type: RelationshipType.SPOUSE,
        endDate: { not: null },
      },
      include: {
        relatedPerson: true,
      },
    });

    if (!divorcedMarriage) {
      throw new Error('Person is not currently divorced');
    }

    const spouseId = divorcedMarriage.relatedPersonId;

    // Update both relationship rows to set end_date = null
    await prisma.$transaction([
      prisma.relationship.updateMany({
        where: {
          personId,
          relatedPersonId: spouseId,
          type: RelationshipType.SPOUSE,
          endDate: { not: null },
        },
        data: { endDate: null },
      }),
      prisma.relationship.updateMany({
        where: {
          personId: spouseId,
          relatedPersonId: personId,
          type: RelationshipType.SPOUSE,
          endDate: { not: null },
        },
        data: { endDate: null },
      }),
    ]);

    // Return the updated relationships
    return await prisma.relationship.findMany({
      where: {
        OR: [
          { personId, relatedPersonId: spouseId, type: RelationshipType.SPOUSE },
          { personId: spouseId, relatedPersonId: personId, type: RelationshipType.SPOUSE },
        ],
      },
    });
  }

  async getMarriedPersons(gender?: string): Promise<any[]> {
    // Get all active marriages (end_date IS NULL)
    const whereClause: any = {
      type: RelationshipType.SPOUSE,
      endDate: null,
    };

    // Add gender filter if provided
    if (gender) {
      whereClause.OR = [
        { person: { gender } },
        { relatedPerson: { gender } },
      ];
    }

    return await prisma.relationship.findMany({
      where: whereClause,
      include: {
        person: true,
        relatedPerson: true,
      },
    });
  }

  async getDivorcedPersons(gender?: string): Promise<any[]> {
    // Get all divorced marriages (end_date IS NOT NULL)
    const whereClause: any = {
      type: RelationshipType.SPOUSE,
      endDate: { not: null },
    };

    // Add gender filter if provided
    if (gender) {
      whereClause.OR = [
        { person: { gender } },
        { relatedPerson: { gender } },
      ];
    }

    return await prisma.relationship.findMany({
      where: whereClause,
      include: {
        person: true,
        relatedPerson: true,
      },
    });
  }

  async getSinglePersons(gender?: string): Promise<any[]> {
    // Get all persons who are not in any marriage relationship
    const marriedPersonIds = await prisma.relationship.findMany({
      where: {
        type: RelationshipType.SPOUSE,
      },
      select: {
        personId: true,
        relatedPersonId: true,
      },
    });

    // Collect all person IDs that are married
    const marriedIds = new Set<string>();
    marriedPersonIds.forEach(rel => {
      marriedIds.add(rel.personId);
      marriedIds.add(rel.relatedPersonId);
    });

    // Build where clause for single persons
    const whereClause: any = {
      id: {
        notIn: Array.from(marriedIds),
      },
    };

    // Add gender filter if provided
    if (gender) {
      whereClause.gender = gender;
    }

    // Get all persons who are not in the married set
    return await prisma.person.findMany({
      where: whereClause,
    });
  }
}

export default new MarriageRepository();
