import type { Person, PersonResponse } from "@/shared/types/person.types";
import personRepository from "@/features/persons/person.repository";
import uploadPromotionService from "@/features/upload/upload-promotion.service";
import familyTreeRepository from "./family-tree.repository";
import {
  AddChildrenResponse,
  FamilyTreeRootEntryResponse,
  FamilyTreeRelativeResponse,
  FamilyTreeRelativeWithSpousesResponse,
  FamilyTreeClosestRelatedPeopleResponse,
  FamilyTreePerson,
  FamilyTreePersonWithRelation,
  FamilyTreePersonWithRelationAndSpouses,
  FamilyTreePersonResponse,
  FamilyTreeSpouseResponse,
  AddChildrenRequest,
  MarriedCoupleEntryResponse,
  ParentType,
} from "@/shared/types/family-tree.types";
class FamilyTreeService {
  async getRoots(): Promise<FamilyTreeRootEntryResponse[]> {
    const roots = await familyTreeRepository.findRootsWithSpouse();
    const rootIds = new Set(roots.map((r) => r.id));
    const processedIds = new Set<string>();
    const result: FamilyTreeRootEntryResponse[] = [];

    for (const root of roots) {
      if (processedIds.has(root.id)) continue;
      processedIds.add(root.id);

      const spouses = root.relationships
        .filter((relationship) => relationship.relatedPerson._count.childOf === 0)
        .map((relationship) => ({
          person: relationship.relatedPerson,
          startDate: relationship.startDate,
          endDate: relationship.endDate,
        }));

      for (const spouse of spouses) {
        if (rootIds.has(spouse.person.id)) {
          processedIds.add(spouse.person.id);
        }
      }

      result.push({
        ...this.mapToPersonResponse(root),
        spouses: spouses.map((spouse) =>
          this.mapToSpouseResponse(spouse.person, spouse.startDate, spouse.endDate)
        ),
      });
    }

    return result;
  }

  async getMarriedCouples(): Promise<MarriedCoupleEntryResponse[]> {
    const couples = await familyTreeRepository.findMarriedCouples();
    return couples.map((c) => ({
      father: this.mapMarriedCouplePerson(c.father),
      mother: this.mapMarriedCouplePerson(c.mother),
    }));
  }

  async getChildren(
    fatherId: string | undefined,
    motherId: string | undefined,
    withSpouse = false
  ): Promise<FamilyTreeRelativeResponse[] | FamilyTreeRelativeWithSpousesResponse[]> {
    const f = fatherId?.trim();
    const m = motherId?.trim();
    const hasFather = Boolean(f);
    const hasMother = Boolean(m);

    if (!hasFather && !hasMother) {
      throw new Error("At least one of fatherId or motherId is required");
    }

    if (hasFather && hasMother) {
      const [fatherExists, motherExists] = await Promise.all([
        familyTreeRepository.personExists(f!),
        familyTreeRepository.personExists(m!),
      ]);
      if (!fatherExists || !motherExists) {
        throw new Error("Father or mother not found");
      }

      if (!(await familyTreeRepository.areMarriedPair(f!, m!))) {
        throw new Error("Father and mother are not an active married pair");
      }

      if (withSpouse) {
        const children = await familyTreeRepository.findChildrenWithSpouseByPair(f!, m!);
        return children.map((p) => this.mapToRelativeWithSpousesResponse(p));
      }

      const children = await familyTreeRepository.findChildrenByPair(f!, m!);
      return children.map((p) => this.mapToRelativeResponse(p));
    }

    const parentId = (f ?? m) as string;
    const parentExists = await familyTreeRepository.personExists(parentId);
    if (!parentExists) {
      throw new Error("Person not found");
    }

    if (withSpouse) {
      const children = await familyTreeRepository.findChildrenWithSpouseByParent(parentId);
      return children.map((p) => this.mapToRelativeWithSpousesResponse(p));
    }

    const children = await familyTreeRepository.findChildrenByParent(parentId);
    return children.map((p) => this.mapToRelativeResponse(p));
  }

  async getClosestRelatedPeople(personId: string): Promise<FamilyTreeClosestRelatedPeopleResponse> {
    const result = await familyTreeRepository.findClosestRelatedPeople(personId);
    if (result === null) {
      throw new Error(`Person with ID '${personId}' not found`);
    }

    return {
      spouse: result.relationships[0]?.relatedPerson
        ? this.mapToSpouseResponse(
          result.relationships[0].relatedPerson,
          result.relationships[0].startDate,
          result.relationships[0].endDate
        )
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

  async addChildren(request: AddChildrenRequest): Promise<AddChildrenResponse> {
    const { parent, children } = request;
    const existingIds = children
      .filter((c): c is { personId: string } => "personId" in c && Boolean(c.personId))
      .map((c) => c.personId.trim());

    const seen = new Set<string>();
    for (const id of existingIds) {
      if (seen.has(id)) {
        throw new Error("Duplicate personId in children list");
      }
      seen.add(id);
      if (id === parent.fatherId || id === parent.motherId) {
        throw new Error("A child cannot be the same person as a parent");
      }
      const eligible = await familyTreeRepository.isChildrenCandidate(id);
      if (!eligible) {
        throw new Error(
          "Each existing child must have no parents and match GET /api/family-tree/children-candidate rules"
        );
      }
    }

    const result = await familyTreeRepository.addChildren(parent, children);
    if (result === null) {
      throw new Error("One or both parents not found");
    }

    const { created, parents } = result;

    await Promise.all(
      created.map((c) =>
        uploadPromotionService.syncPersonProfilePictureUrl(c.id, c.profilePictureUrl)
      )
    );

    const parentsMustHaveDifferentGenders =
      (parents[0].gender !== "MAN" && parents[1].gender !== "WOMAN") ||
      (parents[0].gender !== "WOMAN" && parents[1].gender !== "MAN");

    if (!parentsMustHaveDifferentGenders) {
      throw new Error("Parents must have different genders");
    }

    const createdIds = created.map((c) => c.id);
    const reloaded = await personRepository.findPersonsByIds(createdIds);
    const byId = new Map(reloaded.map((p) => [p.id, p]));
    const createdAfterPromote = createdIds.map((id) => {
      const p = byId.get(id);
      if (!p) {
        throw new Error(`Child person missing after add-children: ${id}`);
      }
      return p;
    });

    return {
      children: createdAfterPromote.map((c) => this.mapToPersonResponse(c)),
      connectedParents: parents.map((p) => this.mapToPersonResponse(p)),
    };
  }

  async hasChildren(personId: string): Promise<boolean> {
    const hasChildren = await familyTreeRepository.hasChildren(personId);
    if (hasChildren === null) {
      throw new Error(`Person with ID '${personId}' not found`);
    }

    return hasChildren;
  }

  /** Orphans not in an active marriage — same response shape as GET /api/person/list. */
  async getChildrenCandidates(
    limit: number,
    offset: number
  ): Promise<{ data: PersonResponse[]; total: number }> {
    const { data, total } = await familyTreeRepository.findChildrenCandidates(limit, offset);
    return { data: data.map((p) => this.mapDbPersonToPersonResponse(p)), total };
  }

  private mapDbPersonToPersonResponse(person: Person): PersonResponse {
    return {
      id: person.id,
      name: person.name,
      gender: person.gender,
      birthDate: person.birthDate ? person.birthDate.toISOString() : null,
      deathDate: person.deathDate ? person.deathDate.toISOString() : null,
      bio: person.bio,
      profilePictureUrl: person.profilePictureUrl,
      phoneNumber: person.phoneNumber,
      address: person.address,
      createdAt: person.createdAt.toISOString(),
      updatedAt: person.updatedAt.toISOString(),
    };
  }

  private mapMarriedCouplePerson(person: FamilyTreePerson): FamilyTreeRelativeWithSpousesResponse {
    return {
      ...this.mapToPersonResponse(person),
      relationshipType: ParentType.BIOLOGICAL,
      spouses: [],
    };
  }

  private mapToPersonResponse(person: FamilyTreePerson): FamilyTreePersonResponse {
    return {
      id: person.id,
      name: person.name,
      gender: person.gender,
      birthDate: person.birthDate ? person.birthDate.toISOString() : null,
      deathDate: person.deathDate ? person.deathDate.toISOString() : null,
      bio: person.bio,
      profilePictureUrl: person.profilePictureUrl,
      phoneNumber: person.phoneNumber,
      address: person.address,
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

  private mapToRelativeWithSpousesResponse(
    person: FamilyTreePersonWithRelationAndSpouses
  ): FamilyTreeRelativeWithSpousesResponse {
    return {
      ...this.mapToPersonResponse(person),
      relationshipType: person.relationshipType,
      spouses: person.spouses.map((spouse) =>
        this.mapToSpouseResponse(spouse.person, spouse.startDate, spouse.endDate)
      ),
    };
  }

  private mapToSpouseResponse(
    spouse: FamilyTreePerson,
    startDate: Date | null,
    endDate: Date | null
  ): FamilyTreeSpouseResponse {
    return {
      ...this.mapToPersonResponse(spouse),
      startMarriageDate: startDate ? startDate.toISOString() : null,
      endMarriageDate: endDate ? endDate.toISOString() : null,
    };
  }
}

export default new FamilyTreeService();
