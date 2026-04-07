import prisma from "@/shared/database/prisma";
import { ParentType, RelationshipType } from "@prisma/client";
import {
  ChildInput,
  FamilyTreePerson,
  FamilyTreePersonWithRelation,
  FamilyTreePersonWithRelationAndSpouse,
  PersonWithChildrenAndSpouse,
  PersonWithClosestRelatives,
  RootPersonWithSpouse,
} from "@/shared/types/family-tree.types";

type AddChildrenResult = {
  created: FamilyTreePerson[];
  parent: FamilyTreePerson;
  spouse: FamilyTreePerson | null;
};

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

  // Find all children of a given person, each child carrying their own active spouse — single query.
  // Returns null when the person does not exist.
  async findChildrenWithSpouse(personId: string): Promise<FamilyTreePersonWithRelationAndSpouse[] | null> {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: {
        parentsOf: {
          include: {
            child: {
              include: {
                relationships: {
                  where: { type: RelationshipType.SPOUSE, endDate: null },
                  include: { relatedPerson: true },
                  take: 1,
                },
              },
            },
          },
          orderBy: { child: { birthDate: "asc" } },
        },
      },
    });

    if (!person) return null;

    const raw = person as unknown as NonNullable<PersonWithChildrenAndSpouse>;
    return raw.parentsOf.map((row) => ({
      ...row.child,
      relationshipType: row.type,
      spouse: row.child.relationships[0]?.relatedPerson ?? null,
    }));
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

  // Create new persons as children of the given parent (and their spouse if one exists).
  // Returns null when the parent does not exist.
  async addChildren(parentId: string, children: ChildInput[]): Promise<AddChildrenResult | null> {
    const parent = await prisma.person.findUnique({
      where: { id: parentId },
      include: {
        relationships: {
          where: { type: RelationshipType.SPOUSE, endDate: null },
          include: { relatedPerson: true },
          take: 1,
        },
      },
    });

    if (!parent) return null;

    const spouse = (parent.relationships[0]?.relatedPerson ?? null) as FamilyTreePerson | null;

    const created = await prisma.$transaction(
      children.map((child) =>
        prisma.person.create({
          data: {
            name: child.name,
            gender: child.gender,
            birthDate: new Date(child.birthDate),
            deathDate: child.deathDate ? new Date(child.deathDate) : null,
            bio: child.bio ?? null,
            profilePictureUrl: child.profilePictureUrl ?? null,
            childOf: {
              create: [
                {
                  parentId: parent.id,
                  parentName: parent.name,
                  childName: child.name,
                  type: ParentType.BIOLOGICAL,
                },
                ...(spouse
                  ? [
                      {
                        parentId: spouse.id,
                        parentName: spouse.name,
                        childName: child.name,
                        type: ParentType.BIOLOGICAL,
                      },
                    ]
                  : []),
              ],
            },
          },
        })
      )
    );

    return { created: created as FamilyTreePerson[], parent: parent as FamilyTreePerson, spouse };
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
