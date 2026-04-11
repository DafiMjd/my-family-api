import marriageRepository from "./marriage.repository";
import personRepository from "../persons/person.repository";
import personService from "../persons/person.service";
import uploadPromotionService from "@/features/upload/upload-promotion.service";
import {
  MarriageRequest,
  MarriageCreateRequest,
  MarryPersonInput,
  DivorceRequest,
  CancelMarriageRequest,
  CancelDivorceRequest,
  MarriageResponse,
  MarriageOperationResponse,
  MarriedCouple,
  DivorcedCouple,
  MarriageListResponse,
  SinglePersonsResponse,
} from "@/shared/types/marriage.types";
import { Relationship } from "@prisma/client";

class MarriageService {
  async marry(
    marriageData: MarriageRequest
  ): Promise<MarriageOperationResponse> {
    return this.createMarriageByIds(marriageData);
  }

  async marryByPersonInput(
    marriageData: MarriageCreateRequest
  ): Promise<MarriageOperationResponse> {
    const personId1 = await this.resolvePersonId(marriageData.person1);
    const personId2 = await this.resolvePersonId(marriageData.person2);

    return this.createMarriageByIds({
      personId1,
      personId2,
      startDate: marriageData.startDate,
      endDate: marriageData.endDate,
    });
  }

  private async createMarriageByIds(
    marriageData: MarriageRequest
  ): Promise<MarriageOperationResponse> {
    const { personId1, personId2, startDate, endDate } = marriageData;

    if (personId1 === personId2) {
      throw new Error("Cannot marry a person to themselves");
    }

    // Validate that both persons exist
    const persons = await personRepository.findPersonsByIds(
      [personId1, personId2]
    );
    if (persons.length !== 2) {
      throw new Error("One or both persons not found");
    }

    // Check if persons have different genders
    const person1 = persons.find((p) => p.id === personId1);
    const person2 = persons.find((p) => p.id === personId2);

    if (!person1 || !person2) {
      throw new Error("One or both persons not found");
    }

    if (person1.gender === person2.gender) {
      throw new Error("Persons must have different genders");
    }

    // Create marriage with custom or current date
    const marriageDate = startDate ? new Date(startDate) : new Date();
    const marriageEndDate = endDate ? new Date(endDate) : null;

    if (marriageEndDate && marriageEndDate < marriageDate) {
      throw new Error("endDate cannot be earlier than startDate");
    }

    const relationships = await marriageRepository.createMarriage(
      personId1,
      person1.name,
      personId2,
      person2.name,
      marriageDate,
      marriageEndDate
    );

    await Promise.all([
      uploadPromotionService.syncPersonProfilePictureUrl(
        person1.id,
        person1.profilePictureUrl
      ),
      uploadPromotionService.syncPersonProfilePictureUrl(
        person2.id,
        person2.profilePictureUrl
      ),
    ]);

    return {
      success: true,
      data: relationships.map(this.mapRelationshipToResponse),
      message: "Marriage created successfully",
    };
  }

  private async resolvePersonId(personInput: MarryPersonInput): Promise<string> {
    if (personInput.personId && personInput.newPerson) {
      throw new Error("Provide only one of personId or newPerson");
    }
    if (!personInput.personId && !personInput.newPerson) {
      throw new Error("Either personId or newPerson is required");
    }

    if (personInput.personId) {
      return personInput.personId;
    }

    const createdPerson = await personService.createPerson(personInput.newPerson!);
    return createdPerson.id;
  }

  async divorce(
    divorceData: DivorceRequest
  ): Promise<MarriageOperationResponse> {
    const { fatherId, motherId, endDate } = divorceData;
    const { father, mother } = await this.validateMarriagePair(fatherId, motherId);

    // Process divorce with custom or current date
    const divorceDate = endDate ? new Date(endDate) : new Date();
    const now = new Date();
    if (divorceDate > now) {
      throw new Error("endDate cannot be in the future");
    }
    const relationships = await marriageRepository.divorceMarriage(
      father.id,
      mother.id,
      divorceDate
    );

    return {
      success: true,
      data: relationships.map(this.mapRelationshipToResponse),
      message: "Marriage ended successfully",
    };
  }

  async cancelMarriage(
    cancelData: CancelMarriageRequest
  ): Promise<MarriageOperationResponse> {
    const { fatherId, motherId } = cancelData;
    const { father, mother } = await this.validateMarriagePair(fatherId, motherId);

    // Cancel marriage (delete relationships)
    await marriageRepository.cancelMarriage(father.id, mother.id);

    return {
      success: true,
      data: [], // No data returned for deletion
      message: "Marriage cancelled successfully",
    };
  }

  async cancelDivorce(
    cancelData: CancelDivorceRequest
  ): Promise<MarriageOperationResponse> {
    const { fatherId, motherId } = cancelData;
    const { father, mother } = await this.validateMarriagePair(fatherId, motherId);

    // Cancel divorce (restore marriage by setting end_date = null)
    const relationships = await marriageRepository.cancelDivorce(father.id, mother.id);

    return {
      success: true,
      data: relationships.map(this.mapRelationshipToResponse),
      message: "Divorce cancelled successfully - marriage restored",
    };
  }

  async getPersonsByStatus(
    status: string,
    gender?: string
  ): Promise<MarriageListResponse | SinglePersonsResponse> {
    switch (status) {
      case "married":
        return await this.getMarriedPersons(gender);
      case "divorced":
        return await this.getDivorcedPersons(gender);
      case "single":
        return await this.getSinglePersons(gender);
      default:
        throw new Error(
          "Invalid status. Must be one of: married, single, divorced"
        );
    }
  }

  private async getMarriedPersons(
    gender?: string
  ): Promise<MarriageListResponse> {
    const relationships = await marriageRepository.getMarriedPersons(gender);

    // Group relationships into couples (avoid reverse-direction duplicates)
    const couples: MarriedCouple[] = [];
    const processedPairs = new Set<string>();

    for (const rel of relationships) {
      const pairKey = [rel.personId, rel.relatedPersonId].sort().join(":");
      if (processedPairs.has(pairKey)) continue;

      const husband =
        rel.person.gender === "MAN" ? rel.person : rel.relatedPerson;
      const wife =
        rel.person.gender === "WOMAN" ? rel.person : rel.relatedPerson;

      couples.push({
        husband: this.mapPersonToResponse(husband),
        wife: this.mapPersonToResponse(wife),
        startDate: rel.startDate ? rel.startDate.toISOString() : null,
      });

      processedPairs.add(pairKey);
    }

    const genderText = gender ? ` (${gender})` : "";
    return {
      success: true,
      data: couples,
      message: `Found ${couples.length} married couples${genderText}`,
    };
  }

  private async getDivorcedPersons(
    gender?: string
  ): Promise<MarriageListResponse> {
    const relationships = await marriageRepository.getDivorcedPersons(gender);

    // Group relationships into couples (avoid reverse-direction duplicates)
    const couples: DivorcedCouple[] = [];
    const processedPairs = new Set<string>();

    for (const rel of relationships) {
      const pairKey = [rel.personId, rel.relatedPersonId].sort().join(":");
      if (processedPairs.has(pairKey)) continue;

      const husband =
        rel.person.gender === "MAN" ? rel.person : rel.relatedPerson;
      const wife =
        rel.person.gender === "WOMAN" ? rel.person : rel.relatedPerson;

      couples.push({
        husband: this.mapPersonToResponse(husband),
        wife: this.mapPersonToResponse(wife),
        startDate: rel.startDate ? rel.startDate.toISOString() : null,
        endDate: rel.endDate ? rel.endDate.toISOString() : null,
      });

      processedPairs.add(pairKey);
    }

    const genderText = gender ? ` (${gender})` : "";
    return {
      success: true,
      data: couples,
      message: `Found ${couples.length} divorced couples${genderText}`,
    };
  }

  private async getSinglePersons(
    gender?: string
  ): Promise<SinglePersonsResponse> {
    const persons = await marriageRepository.getSinglePersons(gender);

    const genderText = gender ? ` (${gender})` : "";
    return {
      success: true,
      data: persons.map(this.mapPersonToResponse),
      message: `Found ${persons.length} single persons${genderText}`,
    };
  }

  private mapRelationshipToResponse(
    relationship: Relationship
  ): MarriageResponse {
    return {
      id: relationship.id,
      personId: relationship.personId,
      personName: relationship.personName,
      relatedPersonId: relationship.relatedPersonId,
      relatedPersonName: relationship.relatedPersonName,
      type: relationship.type,
      startDate: relationship.startDate
        ? relationship.startDate.toISOString()
        : null,
      endDate: relationship.endDate ? relationship.endDate.toISOString() : null,
    };
  }

  private mapPersonToResponse(person: any): any {
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

  private async validateMarriagePair(fatherId: string, motherId: string): Promise<{
    father: any;
    mother: any;
  }> {
    if (fatherId === motherId) {
      throw new Error("fatherId and motherId must be different");
    }

    const [father, mother] = await Promise.all([
      personRepository.findById(fatherId),
      personRepository.findById(motherId),
    ]);

    if (!father || !mother) {
      throw new Error("One or both persons not found");
    }

    if (father.gender !== "MAN") {
      throw new Error("fatherId must reference a MAN");
    }

    if (mother.gender !== "WOMAN") {
      throw new Error("motherId must reference a WOMAN");
    }

    return { father, mother };
  }
}

export default new MarriageService();
