import { Person, CreatePersonRequest, UpdatePersonRequest } from "@/shared/types/person.types";
export interface PersonFilters {
    name?: string;
    gender?: string;
    limit?: number;
    offset?: number;
}
export interface PaginatedPersons {
    data: Person[];
    total: number;
}
declare class PersonRepository {
    findAll(filters?: PersonFilters): Promise<PaginatedPersons>;
    findById(id: string): Promise<Person | null>;
    findByName(name: string): Promise<Person | null>;
    create(personData: CreatePersonRequest): Promise<Person>;
    upsertBiologicalParentChild(parentId: string, parentName: string, childId: string, childName: string): Promise<void>;
    linkBiologicalParentsForDesignatedParent(childId: string, childName: string, designatedParent: {
        id: string;
        name: string;
    }): Promise<void>;
    createMany(datas: CreatePersonRequest[]): Promise<Person[]>;
    update(id: string, personData: UpdatePersonRequest): Promise<Person | null>;
    delete(id: string): Promise<boolean>;
    count(): Promise<number>;
    findByGender(gender: string): Promise<Person[]>;
    findLiving(): Promise<Person[]>;
    findDeceased(): Promise<Person[]>;
    findPersonsByIds(personIds: string[]): Promise<Person[]>;
}
declare const _default: PersonRepository;
export default _default;
//# sourceMappingURL=person.repository.d.ts.map