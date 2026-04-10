import personRepository, {
  DeletePersonOptions,
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
    const { parent, ...personFields } = personData;

    const person = await personRepository.create(personFields);

    if (parent) {
      if (!parent.fatherId || !parent.motherId) {
        throw new Error("parent.fatherId and parent.motherId are required when parent is provided");
      }
      const [father, mother] = await Promise.all([
        personRepository.findById(parent.fatherId),
        personRepository.findById(parent.motherId),
      ]);

      if (!father || !mother) {
        throw new Error("Parent pair not found");
      }

      if (father.gender !== Gender.MAN) {
        throw new Error("parent.fatherId must reference a MAN");
      }

      if (mother.gender !== Gender.WOMAN) {
        throw new Error("parent.motherId must reference a WOMAN");
      }

      await personRepository.upsertBiologicalParentChild(
        father.id,
        father.name,
        person.id,
        person.name
      );

      await personRepository.upsertBiologicalParentChild(
        mother.id,
        mother.name,
        person.id,
        person.name
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

  async deletePerson(id: string, options?: DeletePersonOptions): Promise<boolean> {
    return await personRepository.delete(id, options);
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
