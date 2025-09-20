import { CreatePersonRequest, UpdatePersonRequest, PersonResponse } from '@/shared/types/person.types';
declare class PersonService {
    getAllPersons(): Promise<PersonResponse[]>;
    getPersonById(id: string): Promise<PersonResponse | null>;
    createPerson(personData: CreatePersonRequest): Promise<PersonResponse>;
    updatePerson(id: string, personData: UpdatePersonRequest): Promise<PersonResponse | null>;
    deletePerson(id: string): Promise<boolean>;
    getPersonsByGender(gender: string): Promise<PersonResponse[]>;
    getLivingPersons(): Promise<PersonResponse[]>;
    getDeceasedPersons(): Promise<PersonResponse[]>;
    getPersonCount(): Promise<number>;
    private mapPersonToResponse;
}
declare const _default: PersonService;
export default _default;
//# sourceMappingURL=person.service.d.ts.map