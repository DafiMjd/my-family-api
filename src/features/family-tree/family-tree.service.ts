import familyTreeRepository from "./family-tree.repository";
import {
  AddChildrenResponse,
  ChildInput,
  FamilyTreeRootEntryResponse,
  FamilyTreeRelativeResponse,
  FamilyTreeRelativeWithSpouseResponse,
  FamilyTreeClosestRelatedPeopleResponse,
  FamilyTreePerson,
  FamilyTreePersonWithRelation,
  FamilyTreePersonWithRelationAndSpouse,
  FamilyTreePersonResponse,
} from "@/shared/types/family-tree.types";
import { Gender } from "@prisma/client";

class FamilyTreeService {
  async getRoots(): Promise<FamilyTreeRootEntryResponse[]> {
    const roots = await familyTreeRepository.findRootsWithSpouse();
    const rootIds = new Set(roots.map((r) => r.id));
    const processedIds = new Set<string>();
    const result: FamilyTreeRootEntryResponse[] = [];

    for (const root of roots) {
      if (processedIds.has(root.id)) continue;
      processedIds.add(root.id);

      const spouseRaw = root.relationships[0]?.relatedPerson ?? null;
      const isMarried = spouseRaw !== null;

      // If the spouse has parents they belong to another family branch,
      // which means this root person reached the tree through marriage — skip entirely.
      const spouseHasParents = (spouseRaw?._count.childOf ?? 0) > 0;
      if (spouseHasParents) continue;

      const spouse = spouseRaw;

      // If spouse is also a root, mark them as processed to avoid a duplicate entry
      if (spouse && rootIds.has(spouse.id)) {
        processedIds.add(spouse.id);
      }

      const members: FamilyTreePerson[] = spouse ? [root, spouse] : [root];
      const father = members.find((p) => p.gender === Gender.MAN) ?? null;
      const mother = members.find((p) => p.gender === Gender.WOMAN) ?? null;

      result.push({
        father: father ? this.mapToPersonResponse(father) : null,
        mother: mother ? this.mapToPersonResponse(mother) : null,
        isMarried,
      });
    }

    return result;
  }

  async getChildren(
    personId: string,
    withSpouse = false
  ): Promise<FamilyTreeRelativeResponse[] | FamilyTreeRelativeWithSpouseResponse[]> {
    const exists = await familyTreeRepository.personExists(personId);
    if (!exists) {
      throw new Error(`Person with ID '${personId}' not found`);
    }
    if (withSpouse) {
      const children = await familyTreeRepository.findChildrenWithSpouse(personId);
      if (children === null) {
        throw new Error(`Person with ID '${personId}' not found`);
      }
      return children.map((p) => this.mapToRelativeWithSpouseResponse(p));
    }

    const children = await familyTreeRepository.findChildren(personId);
    return children.map((p) => this.mapToRelativeResponse(p));
  }

  async getClosestRelatedPeople(personId: string): Promise<FamilyTreeClosestRelatedPeopleResponse> {
    const result = await familyTreeRepository.findClosestRelatedPeople(personId);
    if (result === null) {
      throw new Error(`Person with ID '${personId}' not found`);
    }

    return {
      spouse: result.relationships[0]?.relatedPerson
        ? this.mapToPersonResponse(result.relationships[0].relatedPerson)
        : null,
      children: result.parentsOf.map((row) =>
        this.mapToRelativeResponse({ ...row.child, relationshipType: row.type })
      ),
      parents: result.childOf.map((row) =>
        this.mapToRelativeResponse({ ...row.parent, relationshipType: row.type })
      ),
    };
  }

  async getParents(personId: string): Promise<FamilyTreeRelativeResponse[]> {
    const exists = await familyTreeRepository.personExists(personId);
    if (!exists) {
      throw new Error(`Person with ID '${personId}' not found`);
    }

    const parents = await familyTreeRepository.findParents(personId);
    return parents.map((p) => this.mapToRelativeResponse(p));
  }

  async addChildren(parentId: string, children: ChildInput[]): Promise<AddChildrenResponse> {
    const result = await familyTreeRepository.addChildren(parentId, children);
    if (result === null) {
      throw new Error(`Person with ID '${parentId}' not found`);
    }

    const { created, parent, spouse } = result;
    const connectedParents = spouse ? [parent, spouse] : [parent];

    return {
      children: created.map((c) => this.mapToPersonResponse(c)),
      connectedParents: connectedParents.map((p) => this.mapToPersonResponse(p)),
    };
  }

  async hasChildren(personId: string): Promise<boolean> {
    const hasChildren = await familyTreeRepository.hasChildren(personId);
    if (hasChildren === null) {
      throw new Error(`Person with ID '${personId}' not found`);
    }

    return hasChildren;
  }

  private mapToPersonResponse(person: FamilyTreePerson): FamilyTreePersonResponse {
    return {
      id: person.id,
      name: person.name,
      gender: person.gender,
      birthDate: person.birthDate.toISOString(),
      deathDate: person.deathDate ? person.deathDate.toISOString() : null,
      bio: person.bio,
      profilePictureUrl: person.profilePictureUrl,
      createdAt: person.createdAt.toISOString(),
      updatedAt: person.updatedAt.toISOString(),
    };
  }

  private mapToRelativeResponse(
    person: FamilyTreePersonWithRelation
  ): FamilyTreeRelativeResponse {
    return {
      ...this.mapToPersonResponse(person),
      relationshipType: person.relationshipType,
    };
  }

  private mapToRelativeWithSpouseResponse(
    person: FamilyTreePersonWithRelationAndSpouse
  ): FamilyTreeRelativeWithSpouseResponse {
    return {
      ...this.mapToPersonResponse(person),
      relationshipType: person.relationshipType,
      spouse: person.spouse ? this.mapToPersonResponse(person.spouse) : null,
    };
  }
}

export default new FamilyTreeService();
