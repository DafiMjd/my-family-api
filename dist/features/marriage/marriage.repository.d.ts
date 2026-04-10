import { Relationship } from '@prisma/client';
declare class MarriageRepository {
    createMarriage(personId1: string, personName1: string, personId2: string, personName2: string, startDate: Date, endDate: Date | null): Promise<Relationship[]>;
    findActiveMarriage(personId: string): Promise<Relationship | null>;
    divorceMarriage(fatherId: string, motherId: string, endDate: Date): Promise<Relationship[]>;
    cancelMarriage(fatherId: string, motherId: string): Promise<Relationship[]>;
    findAnyMarriage(personId: string): Promise<Relationship | null>;
    cancelDivorce(fatherId: string, motherId: string): Promise<Relationship[]>;
    getMarriedPersons(gender?: string): Promise<any[]>;
    getDivorcedPersons(gender?: string): Promise<any[]>;
    getSinglePersons(gender?: string): Promise<any[]>;
}
declare const _default: MarriageRepository;
export default _default;
//# sourceMappingURL=marriage.repository.d.ts.map