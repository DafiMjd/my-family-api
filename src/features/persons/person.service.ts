import personRepository, {
  PersonFilters,
  PaginationQuery,
} from "./person.repository";
import {
  Person,
  CreatePersonApiRequest,
  UpdatePersonRequest,
  PersonResponse,
  Gender,
} from "@/shared/types/person.types";

export interface PaginatedPersonsResponse {
  data: PersonResponse[];
  total: number;
}

class PersonService {
  async getAllPersons(filters?: PersonFilters): Promise<PaginatedPersonsResponse> {
    const { data, total } = await personRepository.findAll(filters);
    return { data: data.map(this.mapPersonToResponse), total };
  }

  async getLatestPersons(
    pagination?: PaginationQuery
  ): Promise<PaginatedPersonsResponse> {
    const { data, total } = await personRepository.findLatestCreated(pagination);
    return { data: data.map(this.mapPersonToResponse), total };
  }

  async getPersonById(id: string): Promise<PersonResponse | null> {
    const person = await personRepository.findById(id);
    return person ? this.mapPersonToResponse(person) : null;
  }

  async createPerson(personData: CreatePersonApiRequest): Promise<PersonResponse> {
    const { parentId, ...personFields } = personData;

    let parent: Person | null = null;
    if (parentId) {
      parent = await personRepository.findById(parentId);
      if (!parent) {
        throw new Error(`Parent person with ID ${parentId} not found`);
      }
    }

    const person = await personRepository.create(personFields);

    if (parent) {
      await personRepository.linkBiologicalParentsForDesignatedParent(
        person.id,
        person.name,
        { id: parent.id, name: parent.name }
      );
    }

    return this.mapPersonToResponse(person);
  }

  async updatePerson(
    id: string,
    personData: UpdatePersonRequest
  ): Promise<PersonResponse | null> {
    const updatedPerson = await personRepository.update(id, personData);
    return updatedPerson ? this.mapPersonToResponse(updatedPerson) : null;
  }

  async deletePerson(id: string): Promise<boolean> {
    return await personRepository.delete(id);
  }

  async getPersonsByGender(gender: string): Promise<PersonResponse[]> {
    const persons = await personRepository.findByGender(gender);
    return persons.map(this.mapPersonToResponse);
  }

  async getLivingPersons(): Promise<PersonResponse[]> {
    const persons = await personRepository.findLiving();
    return persons.map(this.mapPersonToResponse);
  }

  async getDeceasedPersons(): Promise<PersonResponse[]> {
    const persons = await personRepository.findDeceased();
    return persons.map(this.mapPersonToResponse);
  }

  async getPersonCount(): Promise<number> {
    return await personRepository.count();
  }

  private mapPersonToResponse(person: Person): PersonResponse {
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

export default new PersonService();
