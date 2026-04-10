import prisma from "@/shared/database/prisma";
import type { PaginatedPersons } from "@/features/persons/person.repository";
import type { Person } from "@/shared/types/person.types";
import type { Prisma } from "@prisma/client";
import { ParentType, RelationshipType } from "@prisma/client";
import type { AddChildItem } from "@/shared/types/family-tree.types";
import {
  FamilyTreePerson,
  FamilyTreePersonWithRelation,
  FamilyTreePersonWithRelationAndSpouses,
  PersonWithClosestRelatives,
  RootPersonWithSpouses,
} from "@/shared/types/family-tree.types";

type AddChildrenResult = {
  created: FamilyTreePerson[];
  parents: [FamilyTreePerson, FamilyTreePerson];
};

class FamilyTreeRepository {
  /** Same filter as GET /api/family-tree/children-candidate (no parents; exclude spouse-of-descendant roots). */
  private getChildrenCandidateWhere(): Prisma.PersonWhereInput {
    return {
      childOf: { none: {} },
      NOT: {
        OR: [
          {
            relationships: {
              some: {
                type: RelationshipType.SPOUSE,
                relatedPerson: {
                  childOf: { some: {} },
                },
              },
            },
          },
          {
            relatedRelationships: {
              some: {
                type: RelationshipType.SPOUSE,
                person: {
                  childOf: { some: {} },
                },
              },
            },
          },
        ],
      },
    };
  }

  async isChildrenCandidate(personId: string): Promise<boolean> {
    const count = await prisma.person.count({
      where: { id: personId, ...this.getChildrenCandidateWhere() },
    });
    return count > 0;
  }

  // Find all first-generation persons with their active spouse (single query).
  // Excludes people who have no parents but are married to someone who does (they appear under that spouse's family line).
  async findRootsWithSpouse(): Promise<RootPersonWithSpouses[]> {
    const rows = await prisma.person.findMany({
      where: {
        childOf: { none: {} },
        NOT: {
          OR: [
            {
              relationships: {
                some: {
                  type: RelationshipType.SPOUSE,
                  relatedPerson: {
                    childOf: { some: {} },
                  },
                },
              },
            },
            {
              relatedRelationships: {
                some: {
                  type: RelationshipType.SPOUSE,
                  person: {
                    childOf: { some: {} },
                  },
                },
              },
            },
          ],
        },
      },
      include: {
        relationships: {
          where: { type: RelationshipType.SPOUSE },
          include: {
            relatedPerson: {
              include: { _count: { select: { childOf: true } } },
            },
          },
        },
      },
      orderBy: { birthDate: "asc" },
    });

    return rows as RootPersonWithSpouses[];
  }

  /**
   * Distinct opposite-gender spouse pairs from active SPOUSE rows.
   * Uses only rows where personId < relatedPersonId so bidirectional pairs are counted once.
   */
  async findMarriedCouples(): Promise<Array<{ father: FamilyTreePerson; mother: FamilyTreePerson }>> {
    const rows = await prisma.relationship.findMany({
      where: { type: RelationshipType.SPOUSE },
      include: {
        person: true,
        relatedPerson: true,
      },
    });

    const couples: Array<{ father: FamilyTreePerson; mother: FamilyTreePerson }> = [];

    for (const row of rows) {
      if (row.personId >= row.relatedPersonId) {
        continue;
      }

      const a = row.person;
      const b = row.relatedPerson;

      if (a.gender === "MAN" && b.gender === "WOMAN") {
        couples.push({ father: a, mother: b });
      } else if (a.gender === "WOMAN" && b.gender === "MAN") {
        couples.push({ father: b, mother: a });
      }
    }

    couples.sort((x, y) => {
      const byFather = x.father.name.localeCompare(y.father.name);
      if (byFather !== 0) {
        return byFather;
      }
      return x.mother.name.localeCompare(y.mother.name);
    });

    return couples;
  }

  async areMarriedPair(fatherId: string, motherId: string): Promise<boolean> {
    const relationship = await prisma.relationship.findFirst({
      where: {
        type: RelationshipType.SPOUSE,
        OR: [
          { personId: fatherId, relatedPersonId: motherId },
          { personId: motherId, relatedPersonId: fatherId },
        ],
      },
    });

    return Boolean(relationship);
  }

  // Children of a father/mother pair (linked to both), each child carrying their own spouses.
  async findChildrenWithSpouseByPair(
    fatherId: string,
    motherId: string
  ): Promise<FamilyTreePersonWithRelationAndSpouses[]> {
    const rows = await prisma.parentChild.findMany({
      where: {
        parentId: fatherId,
        child: {
          childOf: {
            some: {
              parentId: motherId,
            },
          },
        },
      },
      include: {
        child: {
          include: {
            relationships: {
              where: { type: RelationshipType.SPOUSE },
              include: { relatedPerson: true },
            },
          },
        },
      },
      orderBy: { child: { birthDate: "asc" } },
    });

    return rows.map((row) => ({
      ...row.child,
      relationshipType: row.type,
      spouses: row.child.relationships.map((relationship) => ({
        person: relationship.relatedPerson,
        startDate: relationship.startDate,
        endDate: relationship.endDate,
      })),
    }));
  }

  async findChildrenByPair(fatherId: string, motherId: string): Promise<FamilyTreePersonWithRelation[]> {
    const rows = await prisma.parentChild.findMany({
      where: {
        parentId: fatherId,
        child: {
          childOf: {
            some: {
              parentId: motherId,
            },
          },
        },
      },
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

  // Children linked to this parent (single parentId), each child carrying their own spouses.
  async findChildrenWithSpouseByParent(
    parentId: string
  ): Promise<FamilyTreePersonWithRelationAndSpouses[]> {
    const rows = await prisma.parentChild.findMany({
      where: { parentId },
      include: {
        child: {
          include: {
            relationships: {
              where: { type: RelationshipType.SPOUSE },
              include: { relatedPerson: true },
            },
          },
        },
      },
      orderBy: { child: { birthDate: "asc" } },
    });

    return rows.map((row) => ({
      ...row.child,
      relationshipType: row.type,
      spouses: row.child.relationships.map((relationship) => ({
        person: relationship.relatedPerson,
        startDate: relationship.startDate,
        endDate: relationship.endDate,
      })),
    }));
  }

  async findChildrenByParent(parentId: string): Promise<FamilyTreePersonWithRelation[]> {
    const rows = await prisma.parentChild.findMany({
      where: { parentId },
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

  // Fetch spouse, children, and parents of a person in a single query.
  // Returns null when the person does not exist.
  async findClosestRelatedPeople(personId: string): Promise<PersonWithClosestRelatives> {
    const result = await prisma.person.findUnique({
      where: { id: personId },
      select: {
        relationships: {
          where: { type: RelationshipType.SPOUSE, endDate: null },
          include: { relatedPerson: true },
          take: 1,
        },
        parentsOf: {
          include: { child: true },
          orderBy: { child: { birthDate: "asc" } },
        },
        childOf: {
          include: { parent: true },
          orderBy: { parent: { birthDate: "asc" } },
        },
      },
    });

    return result as PersonWithClosestRelatives;
  }

  // Check whether a person exists
  async personExists(personId: string): Promise<boolean> {
    const count = await prisma.person.count({ where: { id: personId } });
    return count > 0;
  }

  // Link existing children-candidate persons and/or create new children for the parent pair.
  // Returns null when one or both parents do not exist.
  async addChildren(
    parent: { fatherId: string; motherId: string },
    children: AddChildItem[]
  ): Promise<AddChildrenResult | null> {
    const [father, mother] = await Promise.all([
      prisma.person.findUnique({ where: { id: parent.fatherId } }),
      prisma.person.findUnique({ where: { id: parent.motherId } }),
    ]);

    if (!father || !mother) return null;

    const result = await prisma.$transaction(async (tx) => {
      const out: FamilyTreePerson[] = [];

      for (const item of children) {
        if ("personId" in item && item.personId) {
          const existing = await tx.person.findUnique({ where: { id: item.personId } });
          if (!existing) {
            throw new Error(`Child person not found: ${item.personId}`);
          }

          await tx.parentChild.upsert({
            where: { parentId_childId: { parentId: father.id, childId: existing.id } },
            update: { parentName: father.name, childName: existing.name },
            create: {
              parentId: father.id,
              parentName: father.name,
              childId: existing.id,
              childName: existing.name,
              type: ParentType.BIOLOGICAL,
            },
          });
          await tx.parentChild.upsert({
            where: { parentId_childId: { parentId: mother.id, childId: existing.id } },
            update: { parentName: mother.name, childName: existing.name },
            create: {
              parentId: mother.id,
              parentName: mother.name,
              childId: existing.id,
              childName: existing.name,
              type: ParentType.BIOLOGICAL,
            },
          });

          out.push(existing as FamilyTreePerson);
          continue;
        }

        if ("newPerson" in item && item.newPerson) {
          const np = item.newPerson;
          const created = await tx.person.create({
            data: {
              name: np.name,
              gender: np.gender,
              birthDate: new Date(np.birthDate),
              deathDate: np.deathDate ? new Date(np.deathDate) : null,
              bio: np.bio ?? null,
              profilePictureUrl: np.profilePictureUrl ?? null,
              childOf: {
                create: [
                  {
                    parentId: father.id,
                    parentName: father.name,
                    childName: np.name,
                    type: ParentType.BIOLOGICAL,
                  },
                  {
                    parentId: mother.id,
                    parentName: mother.name,
                    childName: np.name,
                    type: ParentType.BIOLOGICAL,
                  },
                ],
              },
            },
          });

          out.push(created as FamilyTreePerson);
        }
      }

      return {
        created: out,
        parents: [father as FamilyTreePerson, mother as FamilyTreePerson] as [
          FamilyTreePerson,
          FamilyTreePerson,
        ],
      };
    });

    return result;
  }

  /**
   * People with no parent-child row as child, no active SPOUSE as either side of the relationship.
   * Paginated with limit/offset only.
   */
  async findChildrenCandidates(limit: number, offset: number): Promise<PaginatedPersons> {
    const where = this.getChildrenCandidateWhere();

    const [data, total] = await prisma.$transaction([
      prisma.person.findMany({
        where,
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.person.count({ where }),
    ]);

    return { data: data as Person[], total };
  }

  // Check whether a person has at least one child using a single lightweight query.
  // Returns null when the person does not exist.
  async hasChildren(personId: string): Promise<boolean | null> {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: {
        parentsOf: {
          select: { childId: true },
          take: 1,
        },
      },
    });

    if (!person) {
      return null;
    }

    return person.parentsOf.length > 0;
  }
}

export default new FamilyTreeRepository();
