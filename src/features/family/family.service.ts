import familyRepository from "./family.repository";
import personRepository from "@/features/persons/person.repository";
import {
  CreateFamilyRequestById,
  UpdateFamilyChildrenRequest,
  UpdateFamilyFatherRequest,
  UpdateFamilyMotherRequest,
  DeleteFamilyRequest,
  GetFamiliesQuery,
  FamilyResponse,
  FamilyWithMembers,
  CreateFamilyRequest,
} from "@/shared/types/family.types";
import { Gender, FamilyMemberRole, Person } from "@prisma/client";

class FamilyService {
  async createFamily(data: CreateFamilyRequest): Promise<FamilyResponse> {
    const { father, mother, children } = data;
    if (!father.id && !father.person) {
      throw new Error("Provide either father ID or father person object");
    }
    if (!mother.id && !mother.person) {
      throw new Error("Provide either mother ID or mother person object");
    }
    if (
      children.length > 0 &&
      children.some((child) => !child.id && !child.person)
    ) {
      throw new Error("Provide either child ID or child person object");
    }

    const createdFather = father.id
      ? await personRepository.findById(father.id!)
      : await personRepository.create(father.person!);
    if (!createdFather) {
      throw new Error(`Father with ID ${father.id} not found`);
    }
    const createdMother = mother.id
      ? await personRepository.findById(mother.id!)
      : await personRepository.create(mother.person!);
    if (!createdMother) {
      throw new Error(`Mother with ID ${mother.id} not found`);
    }

    const childrenIds = children
      .filter((child) => child.id)
      .map((child) => child.id!);
    const childrenToCreate = children
      .filter((child) => !child.id)
      .map((child) => child.person!);
    const existingChildren = await personRepository.findPersonsByIds(
      childrenIds
    );

    const createdChildren = await personRepository.createMany(childrenToCreate);

    const family = await this.createFamilyWithMembers(
      createdFather,
      createdMother,
      [...createdChildren, ...existingChildren]
    );

    return this.mapToResponse(family);
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

    return this.mapToResponse(family);
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
      // Father -> Child relationship
      await familyRepository.createParentChildRelationships(
        father.id,
        father.name,
        child.id,
        child.name
      );

      // Mother -> Child relationship
      await familyRepository.createParentChildRelationships(
        mother.id,
        mother.name,
        child.id,
        child.name
      );
    }

    return family;
  }

  // Get family by ID
  async getFamilyById(familyId: string): Promise<FamilyResponse | null> {
    const family = await familyRepository.findById(familyId);
    if (!family) {
      return null;
    }
    return this.mapToResponse(family);
  }

  // Get families with filters
  async getFamilies(filters: GetFamiliesQuery): Promise<FamilyResponse[]> {
    const families = await familyRepository.findFamilies(filters);
    return families.map((family) => this.mapToResponse(family));
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
    const father = existingFamily.familyMembers.find(
      (m) => m.role === FamilyMemberRole.FATHER
    );
    const mother = existingFamily.familyMembers.find(
      (m) => m.role === FamilyMemberRole.MOTHER
    );

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
      await familyRepository.createParentChildRelationships(
        father.personId,
        father.person.name,
        child.id,
        child.name
      );

      await familyRepository.createParentChildRelationships(
        mother.personId,
        mother.person.name,
        child.id,
        child.name
      );
    }

    return this.mapToResponse(updatedFamily);
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
    const mother = existingFamily.familyMembers.find(
      (m) => m.role === FamilyMemberRole.MOTHER
    );
    const oldFather = existingFamily.familyMembers.find(
      (m) => m.role === FamilyMemberRole.FATHER
    );
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
      await familyRepository.createParentChildRelationships(
        fatherId,
        newFather.name,
        child.personId,
        child.person.name
      );
    }

    return this.mapToResponse(updatedFamily);
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
    const father = existingFamily.familyMembers.find(
      (m) => m.role === FamilyMemberRole.FATHER
    );
    const oldMother = existingFamily.familyMembers.find(
      (m) => m.role === FamilyMemberRole.MOTHER
    );
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
      await familyRepository.createParentChildRelationships(
        motherId,
        newMother.name,
        child.personId,
        child.person.name
      );
    }

    return this.mapToResponse(updatedFamily);
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
    const father = existingFamily.familyMembers.find(
      (m) => m.role === FamilyMemberRole.FATHER
    );
    const mother = existingFamily.familyMembers.find(
      (m) => m.role === FamilyMemberRole.MOTHER
    );
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
  private mapToResponse(family: FamilyWithMembers): FamilyResponse {
    const father = family.familyMembers.find(
      (m) => m.role === FamilyMemberRole.FATHER
    );
    const mother = family.familyMembers.find(
      (m) => m.role === FamilyMemberRole.MOTHER
    );
    const children = family.familyMembers
      .filter((m) => m.role === FamilyMemberRole.CHILD)
      .map((m) => ({
        id: m.person.id,
        name: m.person.name,
        gender: m.person.gender,
        birthDate: m.person.birthDate,
        deathDate: m.person.deathDate,
        bio: m.person.bio,
        profilePictureUrl: m.person.profilePictureUrl,
      }));

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
