import { PersonFilters } from "./person.repository";
import { CreatePersonRequest, UpdatePersonRequest, PersonResponse } from "@/shared/types/person.types";
export interface PaginatedPersonsResponse {
    data: PersonResponse[];
    total: number;
}
declare class PersonService {
    getAllPersons(filters?: PersonFilters): Promise<PaginatedPersonsResponse>;
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