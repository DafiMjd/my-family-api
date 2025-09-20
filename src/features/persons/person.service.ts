import personRepository from "./person.repository";
import {
  Person,
  CreatePersonRequest,
  UpdatePersonRequest,
  PersonResponse,
  Gender,
} from "@/shared/types/person.types";

class PersonService {
  async getAllPersons(): Promise<PersonResponse[]> {
    const persons = await personRepository.findAll();
    return persons.map(this.mapPersonToResponse);
  }

  async getPersonById(id: string): Promise<PersonResponse | null> {
    const person = await personRepository.findById(id);
    return person ? this.mapPersonToResponse(person) : null;
  }

  async createPerson(personData: CreatePersonRequest): Promise<PersonResponse> {
    const person = await personRepository.create(personData);
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
