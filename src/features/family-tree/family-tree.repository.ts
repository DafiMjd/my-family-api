import prisma from "@/shared/database/prisma";
import { RelationshipType } from "@prisma/client";
import {
  FamilyTreePersonWithRelation,
  RootPersonWithSpouse,
} from "@/shared/types/family-tree.types";

class FamilyTreeRepository {
  // Find all first-generation persons with their active spouse (single query)
  async findRootsWithSpouse(): Promise<RootPersonWithSpouse[]> {
    const rows = await prisma.person.findMany({
      where: {
        childOf: { none: {} },
      },
      include: {
        relationships: {
          where: { type: RelationshipType.SPOUSE, endDate: null },
          include: {
            relatedPerson: {
              include: { _count: { select: { childOf: true } } },
            },
          },
          take: 1,
        },
      },
      orderBy: { birthDate: "asc" },
    });

    return rows as RootPersonWithSpouse[];
  }

  // Find all children of a given person
  async findChildren(personId: string): Promise<FamilyTreePersonWithRelation[]> {
    const rows = await prisma.parentChild.findMany({
      where: { parentId: personId },
      include: {
        child: true,
      },
      orderBy: { child: { birthDate: "asc" } },
    });

    return rows.map((row) => ({
      ...row.child,
      relationshipType: row.type,
    }));
  }

  // Find all parents of a given person
  async findParents(personId: string): Promise<FamilyTreePersonWithRelation[]> {
    const rows = await prisma.parentChild.findMany({
      where: { childId: personId },
      include: {
        parent: true,
      },
      orderBy: { parent: { birthDate: "asc" } },
    });

    return rows.map((row) => ({
      ...row.parent,
      relationshipType: row.type,
    }));
  }

  // Check whether a person exists
  async personExists(personId: string): Promise<boolean> {
    const count = await prisma.person.count({ where: { id: personId } });
    return count > 0;
  }
}

export default new FamilyTreeRepository();
