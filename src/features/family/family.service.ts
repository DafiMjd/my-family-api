import familyRepository from "./family.repository";
import personRepository from "@/features/persons/person.repository";
import {
  CreateFamilyRequestById,
  CreateFamilyParentInput,
  UpdateFamilyChildrenRequest,
  UpdateFamilyFatherRequest,
  UpdateFamilyMotherRequest,
  DeleteFamilyRequest,
  GetFamiliesQuery,
  FamilyResponse,
  FamilyWithMembers,
  CreateFamilyRequest,
} from "@/shared/types/family.types";
import {
  CreatePersonRequest,
  CreatePersonRequestWithSpouse,
} from "@/shared/types/person.types";
import { Gender, FamilyMemberRole, Person } from "@prisma/client";

class FamilyService {
  async createFamily(data: CreateFamilyRequest): Promise<FamilyResponse> {
    const fatherIn = this.splitFamilyParentInput(data.father);
    const motherIn = this.splitFamilyParentInput(data.mother);
    const { children: childrenInput, description } = data;

    if (fatherIn.person.gender !== Gender.MAN) {
      throw new Error("Father must be male");
    }
    if (motherIn.person.gender !== Gender.WOMAN) {
      throw new Error("Mother must be female");
    }

    const grandparentIds = [
      ...new Set(
        [fatherIn.parentId, motherIn.parentId].filter((id): id is string =>
          Boolean(id)
        )
      ),
    ];

    const grandparentById = new Map<string, { id: string; name: string }>();
    if (grandparentIds.length > 0) {
      const grandparents = await personRepository.findPersonsByIds(
        grandparentIds
      );
      for (const p of grandparents) {
        grandparentById.set(p.id, { id: p.id, name: p.name });
      }
      if (grandparentById.size !== grandparentIds.length) {
        throw new Error(
          "Grandparent not found: parentId must reference an existing person"
        );
      }
    }

    const [father, mother] = await Promise.all([
      personRepository.create(fatherIn.person),
      personRepository.create(motherIn.person),
    ]);

    const grandparentLinks: Promise<void>[] = [];
    if (fatherIn.parentId) {
      const gp = grandparentById.get(fatherIn.parentId)!;
      grandparentLinks.push(
        personRepository.linkBiologicalParentsForDesignatedParent(
          father.id,
          father.name,
          gp
        )
      );
    }
    if (motherIn.parentId) {
      const gp = grandparentById.get(motherIn.parentId)!;
      grandparentLinks.push(
        personRepository.linkBiologicalParentsForDesignatedParent(
          mother.id,
          mother.name,
          gp
        )
      );
    }
    await Promise.all(grandparentLinks);

    const childPersonPayloads = childrenInput.map((row) =>
      this.stripSpouseFromChildInput(row)
    );
    const children =
      childPersonPayloads.length > 0
        ? await personRepository.createMany(childPersonPayloads)
        : [];

    const childSpouses = await this.createSpousesForChildren(
      childrenInput,
      children
    );

    const familyName =
      data.name !== undefined && String(data.name).trim() !== ""
        ? String(data.name).trim()
        : `${father.name} & ${mother.name}'s Family`;

    const family = await this.createFamilyWithMembers(
      father,
      mother,
      children,
      familyName,
      description ?? null
    );

    return this.mapToResponse(family, childSpouses);
  }

  /** Removes `spouse` so Prisma create does not receive an unknown field. */
  private stripSpouseFromChildInput(
    row: CreatePersonRequestWithSpouse
  ): CreatePersonRequest {
    const { spouse: _s, ...person } = row;
    return person;
  }

  /**
   * Creates spouse persons (batch) and SPOUSE links for children that include `spouse`.
   * Returns a map of childId → spouse Person for the API response.
   */
  private async createSpousesForChildren(
    childrenInput: CreatePersonRequestWithSpouse[],
    children: Person[]
  ): Promise<Map<string, Person>> {
    const result = new Map<string, Person>();
    if (childrenInput.length !== children.length) {
      throw new Error("Invalid internal state: children length mismatch");
    }

    type Pair = { child: Person; spouseReq: CreatePersonRequest };
    const pairs: Pair[] = [];
    for (let i = 0; i < childrenInput.length; i++) {
      const spouseReq = childrenInput[i].spouse;
      if (!spouseReq) {
        continue;
      }
      const child = children[i];
      if (spouseReq.gender === child.gender) {
        throw new Error(
          "Child and spouse must have different genders (MAN and WOMAN)"
        );
      }
      pairs.push({ child, spouseReq });
    }

    if (pairs.length === 0) {
      return result;
    }

    const spouses = await personRepository.createMany(
      pairs.map((p) => p.spouseReq)
    );

    await Promise.all(
      pairs.map(({ child }, index) => {
        const spouse = spouses[index];
        return familyRepository.createSpouseRelationship(
          child.id,
          child.name,
          spouse.id,
          spouse.name,
          new Date()
        );
      })
    );

    for (let i = 0; i < pairs.length; i++) {
      result.set(pairs[i].child.id, spouses[i]);
    }

    return result;
  }

  private splitFamilyParentInput(input: CreateFamilyParentInput): {
    parentId: string | null;
    person: CreatePersonRequest;
  } {
    const { parentId, ...person } = input;
    return { parentId: parentId ?? null, person };
  }

  // Create a new family
  async createFamilyById(
    data: CreateFamilyRequestById
  ): Promise<FamilyResponse> {
    const { fatherId, motherId, childrenIds, name, description } = data;

    // 1. Fetch and validate father
    const father = await personRepository.findById(fatherId);
    if (!father) {
      throw new Error(`Father with ID ${fatherId} not found`);
    }
    if (father.gender !== Gender.MAN) {
      throw new Error("Father must be male");
    }

    // 2. Fetch and validate mother
    const mother = await personRepository.findById(motherId);
    if (!mother) {
      throw new Error(`Mother with ID ${motherId} not found`);
    }
    if (mother.gender !== Gender.WOMAN) {
      throw new Error("Mother must be female");
    }

    // 3. Check if father/mother are married to other people
    const fatherMarriage = await familyRepository.findActiveMarriage(fatherId);
    if (fatherMarriage && fatherMarriage.relatedPersonId !== motherId) {
      throw new Error(
        `Father is already married to another person (ID: ${fatherMarriage.relatedPersonId})`
      );
    }

    const motherMarriage = await familyRepository.findActiveMarriage(motherId);
    if (motherMarriage && motherMarriage.relatedPersonId !== fatherId) {
      throw new Error(
        `Mother is already married to another person (ID: ${motherMarriage.relatedPersonId})`
      );
    }

    // 4. Fetch and validate children
    const children = await Promise.all(
      childrenIds.map(async (childId) => {
        const child = await personRepository.findById(childId);
        if (!child) {
          throw new Error(`Child with ID ${childId} not found`);
        }
        return child;
      })
    );

    const family = await this.createFamilyWithMembers(father, mother, children);

    return this.mapToResponse(family, undefined);
  }

  private async createFamilyWithMembers(
    father: Person,
    mother: Person,
    children: Person[],
    name?: string,
    description?: string | null
  ): Promise<FamilyWithMembers> {
    // 5. Generate family name if not provided
    const familyName = name || `${father.name} & ${mother.name}'s Family`;

    // 6. Create family with members
    const family = await familyRepository.createFamily(
      familyName,
      description || null,
      father.id,
      mother.id,
      children.map((child) => child.id)
    );

    // 7. Check if spouse relationship exists, if not create it
    const existingSpouseRelationship =
      await familyRepository.findActiveSpouseRelationship(father.id, mother.id);

    if (!existingSpouseRelationship) {
      await familyRepository.createSpouseRelationship(
        father.id,
        father.name,
        mother.id,
        mother.name,
        new Date()
      );
    }

    // 8. Create parent-child relationships
    for (const child of children) {
      await familyRepository.createParentChildRelationships(father.id, father.name, child.id, child.name);
      await familyRepository.createParentChildRelationships(mother.id, mother.name, child.id, child.name);
    }

    return family;
  }

  // Get family by ID
  async getFamilyById(familyId: string): Promise<FamilyResponse | null> {
    const family = await familyRepository.findById(familyId);
    if (!family) {
      return null;
    }
    return this.mapToResponse(family, undefined);
  }

  // Get families with filters
  async getFamilies(
    filters: GetFamiliesQuery
  ): Promise<{ data: FamilyResponse[]; total: number }> {
    const { data, total } = await familyRepository.findFamilies(filters);
    return {
      data: data.map((family) => this.mapToResponse(family, undefined)),
      total,
    };
  }

  // Update family children
  async updateFamilyChildren(
    familyId: string,
    data: UpdateFamilyChildrenRequest
  ): Promise<FamilyResponse> {
    const { childrenIds } = data;

    // 1. Check if family exists
    const existingFamily = await familyRepository.findById(familyId);
    if (!existingFamily) {
      throw new Error(`Family with ID ${familyId} not found`);
    }

    // 2. Get father and mother
    const parents = existingFamily.familyMembers.filter(
      (m) => m.role === FamilyMemberRole.PARENT
    );
    const father = parents.find((m) => m.person.gender === Gender.MAN) ?? null;
    const mother = parents.find((m) => m.person.gender === Gender.WOMAN) ?? null;

    if (!father || !mother) {
      throw new Error("Family must have both father and mother");
    }

    // 3. Validate new children exist
    const newChildren = await Promise.all(
      childrenIds.map(async (childId) => {
        const child = await personRepository.findById(childId);
        if (!child) {
          throw new Error(`Child with ID ${childId} not found`);
        }
        return child;
      })
    );

    // 4. Get old children IDs
    const oldChildrenIds = existingFamily.familyMembers
      .filter((m) => m.role === FamilyMemberRole.CHILD)
      .map((m) => m.personId);

    const isDuplicateChildren = oldChildrenIds.some((id) =>
      childrenIds.includes(id)
    );
    if (isDuplicateChildren) {
      throw new Error("Duplicate children IDs are not allowed");
    }

    const parentIds = [father.personId, mother.personId];
    const isDuplicateParentAndChildren = parentIds.some((id) =>
      childrenIds.includes(id)
    );
    if (isDuplicateParentAndChildren) {
      throw new Error("Parent and children IDs must be unique");
    }

    // 5. Delete old parent-child relationships
    if (oldChildrenIds.length > 0) {
      await familyRepository.deleteParentChildRelationships(
        parentIds,
        oldChildrenIds
      );
    }

    // 6. Update family children
    const updatedFamily = await familyRepository.updateFamilyChildren(
      familyId,
      childrenIds
    );

    // 7. Create new parent-child relationships
    for (const child of newChildren) {
      await familyRepository.createParentChildRelationships(father.personId, father.person.name, child.id, child.name);
      await familyRepository.createParentChildRelationships(mother.personId, mother.person.name, child.id, child.name);
    }

    return this.mapToResponse(updatedFamily, undefined);
  }

  // Update family father
  async updateFamilyFather(
    familyId: string,
    data: UpdateFamilyFatherRequest
  ): Promise<FamilyResponse> {
    const { fatherId } = data;

    // 1. Check if family exists
    const existingFamily = await familyRepository.findById(familyId);
    if (!existingFamily) {
      throw new Error(`Family with ID ${familyId} not found`);
    }

    // 2. Validate new father
    const newFather = await personRepository.findById(fatherId);
    if (!newFather) {
      throw new Error(`Father with ID ${fatherId} not found`);
    }
    if (newFather.gender !== Gender.MAN) {
      throw new Error("Father must be male");
    }

    // 3. Get mother and children
    const parents = existingFamily.familyMembers.filter(
      (m) => m.role === FamilyMemberRole.PARENT
    );
    const mother = parents.find((m) => m.person.gender === Gender.WOMAN) ?? null;
    const oldFather = parents.find((m) => m.person.gender === Gender.MAN) ?? null;
    const children = existingFamily.familyMembers.filter(
      (m) => m.role === FamilyMemberRole.CHILD
    );

    if (!mother) {
      throw new Error("Family must have a mother");
    }

    // 4. Check if new father is married to someone else
    const newFatherMarriage = await familyRepository.findActiveMarriage(
      fatherId
    );
    if (
      newFatherMarriage &&
      newFatherMarriage.relatedPersonId !== mother.personId
    ) {
      throw new Error(
        `Father is already married to another person (ID: ${newFatherMarriage.relatedPersonId})`
      );
    }

    // 5. Delete old father's parent-child relationships
    if (oldFather) {
      const childrenIds = children.map((c) => c.personId);
      await familyRepository.deleteParentChildRelationships(
        [oldFather.personId],
        childrenIds
      );

      // Delete old spouse relationship
      await familyRepository.deleteSpouseRelationship(
        oldFather.personId,
        mother.personId
      );
    }

    // 6. Update family father
    const updatedFamily = await familyRepository.updateFamilyFather(
      familyId,
      fatherId
    );

    // 7. Create/update spouse relationship with mother
    const existingSpouseRelationship =
      await familyRepository.findActiveSpouseRelationship(
        fatherId,
        mother.personId
      );

    if (!existingSpouseRelationship) {
      await familyRepository.createSpouseRelationship(
        fatherId,
        newFather.name,
        mother.personId,
        mother.person.name,
        new Date()
      );
    }

    // 8. Create new parent-child relationships
    for (const child of children) {
      await familyRepository.createParentChildRelationships(fatherId, newFather.name, child.personId, child.person.name);
    }

    return this.mapToResponse(updatedFamily, undefined);
  }

  // Update family mother
  async updateFamilyMother(
    familyId: string,
    data: UpdateFamilyMotherRequest
  ): Promise<FamilyResponse> {
    const { motherId } = data;

    // 1. Check if family exists
    const existingFamily = await familyRepository.findById(familyId);
    if (!existingFamily) {
      throw new Error(`Family with ID ${familyId} not found`);
    }

    // 2. Validate new mother
    const newMother = await personRepository.findById(motherId);
    if (!newMother) {
      throw new Error(`Mother with ID ${motherId} not found`);
    }
    if (newMother.gender !== Gender.WOMAN) {
      throw new Error("Mother must be female");
    }

    // 3. Get father and children
    const parents = existingFamily.familyMembers.filter(
      (m) => m.role === FamilyMemberRole.PARENT
    );
    const father = parents.find((m) => m.person.gender === Gender.MAN) ?? null;
    const oldMother = parents.find((m) => m.person.gender === Gender.WOMAN) ?? null;
    const children = existingFamily.familyMembers.filter(
      (m) => m.role === FamilyMemberRole.CHILD
    );

    if (!father) {
      throw new Error("Family must have a father");
    }

    // 4. Check if new mother is married to someone else
    const newMotherMarriage = await familyRepository.findActiveMarriage(
      motherId
    );
    if (
      newMotherMarriage &&
      newMotherMarriage.relatedPersonId !== father.personId
    ) {
      throw new Error(
        `Mother is already married to another person (ID: ${newMotherMarriage.relatedPersonId})`
      );
    }

    // 5. Delete old mother's parent-child relationships
    if (oldMother) {
      const childrenIds = children.map((c) => c.personId);
      await familyRepository.deleteParentChildRelationships(
        [oldMother.personId],
        childrenIds
      );

      // Delete old spouse relationship
      await familyRepository.deleteSpouseRelationship(
        oldMother.personId,
        father.personId
      );
    }

    // 6. Update family mother
    const updatedFamily = await familyRepository.updateFamilyMother(
      familyId,
      motherId
    );

    // 7. Create/update spouse relationship with father
    const existingSpouseRelationship =
      await familyRepository.findActiveSpouseRelationship(
        father.personId,
        motherId
      );

    if (!existingSpouseRelationship) {
      await familyRepository.createSpouseRelationship(
        father.personId,
        father.person.name,
        motherId,
        newMother.name,
        new Date()
      );
    }

    // 8. Create new parent-child relationships
    for (const child of children) {
      await familyRepository.createParentChildRelationships(motherId, newMother.name, child.personId, child.person.name);
    }

    return this.mapToResponse(updatedFamily, undefined);
  }

  // Delete family
  async deleteFamily(
    familyId: string,
    options: DeleteFamilyRequest = {}
  ): Promise<boolean> {
    const { deleteSpouseRelationship = false } = options;

    // 1. Check if family exists
    const existingFamily = await familyRepository.findById(familyId);
    if (!existingFamily) {
      throw new Error(`Family with ID ${familyId} not found`);
    }

    // 2. Get family members
    const memberParents = existingFamily.familyMembers.filter(
      (m) => m.role === FamilyMemberRole.PARENT
    );
    const father = memberParents.find((m) => m.person.gender === Gender.MAN) ?? null;
    const mother = memberParents.find((m) => m.person.gender === Gender.WOMAN) ?? null;
    const children = existingFamily.familyMembers.filter(
      (m) => m.role === FamilyMemberRole.CHILD
    );

    // 3. Delete parent-child relationships
    if (father && mother && children.length > 0) {
      const parentIds = [father.personId, mother.personId];
      const childrenIds = children.map((c) => c.personId);
      await familyRepository.deleteParentChildRelationships(
        parentIds,
        childrenIds
      );
    }

    // 4. Optionally delete spouse relationship
    if (deleteSpouseRelationship && father && mother) {
      await familyRepository.deleteSpouseRelationship(
        father.personId,
        mother.personId
      );
    }

    // 5. Delete family (cascade will delete family_members)
    return await familyRepository.deleteFamily(familyId);
  }

  // Map family to response
  private mapToResponse(
    family: FamilyWithMembers,
    childSpouses?: Map<string, Person>
  ): FamilyResponse {
    const parents = family.familyMembers.filter(
      (m) => m.role === FamilyMemberRole.PARENT
    );
    const father = parents.find((m) => m.person.gender === Gender.MAN) ?? null;
    const mother = parents.find((m) => m.person.gender === Gender.WOMAN) ?? null;
    const children = family.familyMembers
      .filter((m) => m.role === FamilyMemberRole.CHILD)
      .map((m) => {
        const spousePerson = childSpouses?.get(m.person.id);
        return {
          id: m.person.id,
          name: m.person.name,
          gender: m.person.gender,
          birthDate: m.person.birthDate,
          deathDate: m.person.deathDate,
          bio: m.person.bio,
          profilePictureUrl: m.person.profilePictureUrl,
          spouse: spousePerson
            ? {
                id: spousePerson.id,
                name: spousePerson.name,
                gender: spousePerson.gender,
                birthDate: spousePerson.birthDate,
                deathDate: spousePerson.deathDate,
                bio: spousePerson.bio,
                profilePictureUrl: spousePerson.profilePictureUrl,
              }
            : null,
        };
      });

    return {
      id: family.id,
      name: family.name,
      description: family.description,
      father: father
        ? {
            id: father.person.id,
            name: father.person.name,
            gender: father.person.gender,
            birthDate: father.person.birthDate,
            deathDate: father.person.deathDate,
            bio: father.person.bio,
            profilePictureUrl: father.person.profilePictureUrl,
          }
        : null,
      mother: mother
        ? {
            id: mother.person.id,
            name: mother.person.name,
            gender: mother.person.gender,
            birthDate: mother.person.birthDate,
            deathDate: mother.person.deathDate,
            bio: mother.person.bio,
            profilePictureUrl: mother.person.profilePictureUrl,
          }
        : null,
      children,
      createdAt: family.createdAt.toISOString(),
      updatedAt: family.updatedAt.toISOString(),
    };
  }
}

export default new FamilyService();
