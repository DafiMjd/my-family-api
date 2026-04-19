import familyRepository from "./family.repository";
import familyTreeRepository from "@/features/family-tree/family-tree.repository";
import personRepository from "@/features/persons/person.repository";
import {
  CreateFamilyRequestById,
  CreateFamilyParentInput,
  CreateFamilyChildInput,
  UpdateFamilyChildrenRequest,
  UpdateFamilyFatherRequest,
  UpdateFamilyMotherRequest,
  DeleteFamilyRequest,
  GetFamiliesQuery,
  FamilyResponse,
  FamilyWithMembers,
  CreateFamilyRequest,
} from "@/shared/types/family.types";
import { CreatePersonRequest, Person } from "@/shared/types/person.types";
import { Gender, FamilyMemberRole } from "@prisma/client";
import uploadPromotionService from "@/features/upload/upload-promotion.service";

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

    if (
      (fatherIn.parent && (!fatherIn.parent.fatherId || !fatherIn.parent.motherId)) ||
      (motherIn.parent && (!motherIn.parent.fatherId || !motherIn.parent.motherId))
    ) {
      throw new Error("parent.fatherId and parent.motherId are required when parent is provided");
    }

    const grandparentIds = [
      ...new Set(
        [
          fatherIn.parent?.fatherId,
          fatherIn.parent?.motherId,
          motherIn.parent?.fatherId,
          motherIn.parent?.motherId,
        ].filter((id): id is string => Boolean(id))
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
          "Grandparent not found: parent pair must reference existing persons"
        );
      }
    }

    if (fatherIn.parent) {
      const fatherGrandfather = await personRepository.findById(fatherIn.parent.fatherId);
      const fatherGrandmother = await personRepository.findById(fatherIn.parent.motherId);
      if (!fatherGrandfather || !fatherGrandmother) {
        throw new Error("Father parent pair not found");
      }
      if (fatherGrandfather.gender !== Gender.MAN || fatherGrandmother.gender !== Gender.WOMAN) {
        throw new Error("Father parent pair must be MAN (fatherId) and WOMAN (motherId)");
      }
    }

    if (motherIn.parent) {
      const motherGrandfather = await personRepository.findById(motherIn.parent.fatherId);
      const motherGrandmother = await personRepository.findById(motherIn.parent.motherId);
      if (!motherGrandfather || !motherGrandmother) {
        throw new Error("Mother parent pair not found");
      }
      if (motherGrandfather.gender !== Gender.MAN || motherGrandmother.gender !== Gender.WOMAN) {
        throw new Error("Mother parent pair must be MAN (fatherId) and WOMAN (motherId)");
      }
    }

    const [father, mother] = await Promise.all([
      personRepository.create(fatherIn.person),
      personRepository.create(motherIn.person),
    ]);

    const grandparentLinks: Promise<void>[] = [];
    if (fatherIn.parent) {
      const fatherGrandfather = grandparentById.get(fatherIn.parent.fatherId)!;
      const fatherGrandmother = grandparentById.get(fatherIn.parent.motherId)!;
      grandparentLinks.push(
        personRepository.upsertBiologicalParentChild(
          fatherGrandfather.id,
          fatherGrandfather.name,
          father.id,
          father.name
        )
      );
      grandparentLinks.push(
        personRepository.upsertBiologicalParentChild(
          fatherGrandmother.id,
          fatherGrandmother.name,
          father.id,
          father.name
        )
      );
    }
    if (motherIn.parent) {
      const motherGrandfather = grandparentById.get(motherIn.parent.fatherId)!;
      const motherGrandmother = grandparentById.get(motherIn.parent.motherId)!;
      grandparentLinks.push(
        personRepository.upsertBiologicalParentChild(
          motherGrandfather.id,
          motherGrandfather.name,
          mother.id,
          mother.name
        )
      );
      grandparentLinks.push(
        personRepository.upsertBiologicalParentChild(
          motherGrandmother.id,
          motherGrandmother.name,
          mother.id,
          mother.name
        )
      );
    }
    await Promise.all(grandparentLinks);

    const children = await this.resolveFamilyChildrenPersons(
      childrenInput,
      father,
      mother
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

    await Promise.all([
      uploadPromotionService.syncPersonProfilePictureUrl(father.id, father.profilePictureUrl),
      uploadPromotionService.syncPersonProfilePictureUrl(mother.id, mother.profilePictureUrl),
      ...children.map((child) =>
        uploadPromotionService.syncPersonProfilePictureUrl(child.id, child.profilePictureUrl)
      ),
    ]);

    const refreshedFamily = await familyRepository.findById(family.id);
    if (!refreshedFamily) {
      throw new Error("Family was created but could not be reloaded");
    }

    return this.mapToResponse(refreshedFamily, undefined);
  }

  /**
   * Builds the ordered child Person list: existing candidates or newly created persons.
   */
  private async resolveFamilyChildrenPersons(
    childrenInput: CreateFamilyChildInput[],
    father: Person,
    mother: Person
  ): Promise<Person[]> {
    const seenIds = new Set<string>();
    const children: Person[] = [];

    for (const item of childrenInput) {
      if ("personId" in item && item.personId) {
        const id = item.personId.trim();
        if (id === father.id || id === mother.id) {
          throw new Error("Child cannot be the same person as a parent");
        }
        if (seenIds.has(id)) {
          throw new Error("Duplicate child personId in children list");
        }
        seenIds.add(id);

        const existing = await personRepository.findById(id);
        if (!existing) {
          throw new Error(`Child with ID ${id} not found`);
        }

        const eligible = await familyTreeRepository.isChildrenCandidate(id);
        if (!eligible) {
          throw new Error(
            `Child ${id} is not eligible (must match GET /api/family-tree/children-candidate rules)`
          );
        }

        children.push(existing);
        continue;
      }

      if ("newPerson" in item && item.newPerson) {
        const person = await personRepository.create(item.newPerson as CreatePersonRequest);
        children.push(person);
      }
    }

    return children;
  }

  private splitFamilyParentInput(input: CreateFamilyParentInput): {
    parent: { fatherId: string; motherId: string } | null;
    person: CreatePersonRequest;
  } {
    const { parent, ...person } = input;
    return { parent: parent ?? null, person };
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

    await Promise.all([
      uploadPromotionService.syncPersonProfilePictureUrl(father.id, father.profilePictureUrl),
      uploadPromotionService.syncPersonProfilePictureUrl(mother.id, mother.profilePictureUrl),
      ...children.map((child) =>
        uploadPromotionService.syncPersonProfilePictureUrl(child.id, child.profilePictureUrl)
      ),
    ]);

    const refreshedFamily = await familyRepository.findById(family.id);
    if (!refreshedFamily) {
      throw new Error("Family was created but could not be reloaded");
    }

    return this.mapToResponse(refreshedFamily, undefined);
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
          phoneNumber: m.person.phoneNumber,
          address: m.person.address,
          spouse: spousePerson
            ? {
                id: spousePerson.id,
                name: spousePerson.name,
                gender: spousePerson.gender,
                birthDate: spousePerson.birthDate,
                deathDate: spousePerson.deathDate,
                bio: spousePerson.bio,
                profilePictureUrl: spousePerson.profilePictureUrl,
                phoneNumber: spousePerson.phoneNumber,
                address: spousePerson.address,
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
            phoneNumber: father.person.phoneNumber,
            address: father.person.address,
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
            phoneNumber: mother.person.phoneNumber,
            address: mother.person.address,
          }
        : null,
      children,
      createdAt: family.createdAt.toISOString(),
      updatedAt: family.updatedAt.toISOString(),
    };
  }
}

export default new FamilyService();
