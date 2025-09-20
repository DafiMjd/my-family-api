import { Person, CreatePersonRequest, UpdatePersonRequest } from '@/shared/types/person.types';
declare class PersonRepository {
    findAll(): Promise<Person[]>;
    findById(id: string): Promise<Person | null>;
    findByName(name: string): Promise<Person | null>;
    create(personData: CreatePersonRequest): Promise<Person>;
    update(id: string, personData: UpdatePersonRequest): Promise<Person | null>;
    delete(id: string): Promise<boolean>;
    count(): Promise<number>;
    findByGender(gender: string): Promise<Person[]>;
    findLiving(): Promise<Person[]>;
    findDeceased(): Promise<Person[]>;
}
declare const _default: PersonRepository;
export default _default;
//# sourceMappingURL=person.repository.d.ts.map