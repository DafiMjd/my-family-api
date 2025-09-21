import marriageRepository from "./marriage.repository";
import personRepository from "../persons/person.repository";
import {
  MarriageRequest,
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
    const { personId1, personId2, startDate } = marriageData;

    // Validate that both persons exist
    const persons = await personRepository.findPersonsByIds(
      personId1,
      personId2
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

    // Check if either person is already married
    const person1Marriage = await marriageRepository.findActiveMarriage(
      personId1
    );
    const person2Marriage = await marriageRepository.findActiveMarriage(
      personId2
    );

    if (person1Marriage) {
      throw new Error(`person ${person1.name} is already married`);
    }
    if (person2Marriage) {
      throw new Error(`person ${person2.name} is already married`);
    }

    // Create marriage with custom or current date
    const marriageDate = startDate ? new Date(startDate) : new Date();
    const relationships = await marriageRepository.createMarriage(
      personId1,
      person1.name,
      personId2,
      person2.name,
      marriageDate
    );

    return {
      success: true,
      data: relationships.map(this.mapRelationshipToResponse),
      message: "Marriage created successfully",
    };
  }

  async divorce(
    divorceData: DivorceRequest
  ): Promise<MarriageOperationResponse> {
    const { personId, endDate } = divorceData;

    // Validate that person exists
    const person = await personRepository.findById(personId);
    if (!person) {
      throw new Error("Person not found");
    }

    // Process divorce with custom or current date
    const divorceDate = endDate ? new Date(endDate) : new Date();
    const relationships = await marriageRepository.divorceMarriage(
      personId,
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
    const { personId } = cancelData;

    // Validate that person exists
    const person = await personRepository.findById(personId);
    if (!person) {
      throw new Error("Person not found");
    }

    // Cancel marriage (delete relationships)
    await marriageRepository.cancelMarriage(personId);

    return {
      success: true,
      data: [], // No data returned for deletion
      message: "Marriage cancelled successfully",
    };
  }

  async cancelDivorce(
    cancelData: CancelDivorceRequest
  ): Promise<MarriageOperationResponse> {
    const { personId } = cancelData;

    // Validate that person exists
    const person = await personRepository.findById(personId);
    if (!person) {
      throw new Error("Person not found");
    }

    // Cancel divorce (restore marriage by setting end_date = null)
    const relationships = await marriageRepository.cancelDivorce(personId);

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

    // Group relationships into couples (avoid duplicates)
    const couples: MarriedCouple[] = [];
    const processedIds = new Set<string>();

    for (const rel of relationships) {
      if (
        !processedIds.has(rel.personId) &&
        !processedIds.has(rel.relatedPersonId)
      ) {
        const husband =
          rel.person.gender === "MAN" ? rel.person : rel.relatedPerson;
        const wife =
          rel.person.gender === "WOMAN" ? rel.person : rel.relatedPerson;

        couples.push({
          husband: this.mapPersonToResponse(husband),
          wife: this.mapPersonToResponse(wife),
          startDate: rel.startDate ? rel.startDate.toISOString() : null,
        });

        processedIds.add(rel.personId);
        processedIds.add(rel.relatedPersonId);
      }
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

    // Group relationships into couples (avoid duplicates)
    const couples: DivorcedCouple[] = [];
    const processedIds = new Set<string>();

    for (const rel of relationships) {
      if (
        !processedIds.has(rel.personId) &&
        !processedIds.has(rel.relatedPersonId)
      ) {
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

        processedIds.add(rel.personId);
        processedIds.add(rel.relatedPersonId);
      }
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
}

export default new MarriageService();
