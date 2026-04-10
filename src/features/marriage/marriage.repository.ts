import { Relationship, RelationshipType } from '@prisma/client';
import prisma from '@/shared/database/prisma';

class MarriageRepository {
  async createMarriage(
    personId1: string,
    personName1: string,
    personId2: string,
    personName2: string,
    startDate: Date,
    endDate: Date | null
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
          endDate,
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
          endDate,
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

  async divorceMarriage(fatherId: string, motherId: string, endDate: Date): Promise<Relationship[]> {
    const activeMarriage = await prisma.relationship.findFirst({
      where: {
        type: RelationshipType.SPOUSE,
        endDate: null,
        OR: [
          { personId: fatherId, relatedPersonId: motherId },
          { personId: motherId, relatedPersonId: fatherId },
        ],
      },
    });

    if (!activeMarriage) {
      throw new Error('Persons are not currently married');
    }

    // Update both relationship rows
    await prisma.$transaction([
      prisma.relationship.updateMany({
        where: {
          personId: fatherId,
          relatedPersonId: motherId,
          type: RelationshipType.SPOUSE,
          endDate: null,
        },
        data: { endDate },
      }),
      prisma.relationship.updateMany({
        where: {
          personId: motherId,
          relatedPersonId: fatherId,
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
          { personId: fatherId, relatedPersonId: motherId, type: RelationshipType.SPOUSE },
          { personId: motherId, relatedPersonId: fatherId, type: RelationshipType.SPOUSE },
        ],
      },
    });
  }

  async cancelMarriage(fatherId: string, motherId: string): Promise<Relationship[]> {
    const marriage = await prisma.relationship.findFirst({
      where: {
        type: RelationshipType.SPOUSE,
        OR: [
          { personId: fatherId, relatedPersonId: motherId },
          { personId: motherId, relatedPersonId: fatherId },
        ],
      },
    });

    if (!marriage) {
      throw new Error("Persons have no marriage to cancel");
    }

    // Delete both relationship rows
    await prisma.$transaction([
      prisma.relationship.deleteMany({
        where: {
          personId: fatherId,
          relatedPersonId: motherId,
          type: RelationshipType.SPOUSE,
        },
      }),
      prisma.relationship.deleteMany({
        where: {
          personId: motherId,
          relatedPersonId: fatherId,
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

  async cancelDivorce(fatherId: string, motherId: string): Promise<Relationship[]> {
    const divorcedMarriage = await prisma.relationship.findFirst({
      where: {
        type: RelationshipType.SPOUSE,
        endDate: { not: null },
        OR: [
          { personId: fatherId, relatedPersonId: motherId },
          { personId: motherId, relatedPersonId: fatherId },
        ],
      },
    });

    if (!divorcedMarriage) {
      throw new Error("Persons are not currently divorced");
    }

    // Update both relationship rows to set end_date = null
    await prisma.$transaction([
      prisma.relationship.updateMany({
        where: {
          personId: fatherId,
          relatedPersonId: motherId,
          type: RelationshipType.SPOUSE,
          endDate: { not: null },
        },
        data: { endDate: null },
      }),
      prisma.relationship.updateMany({
        where: {
          personId: motherId,
          relatedPersonId: fatherId,
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
          { personId: fatherId, relatedPersonId: motherId, type: RelationshipType.SPOUSE },
          { personId: motherId, relatedPersonId: fatherId, type: RelationshipType.SPOUSE },
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
