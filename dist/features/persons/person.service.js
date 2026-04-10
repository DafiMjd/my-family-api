"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const person_repository_1 = __importDefault(require("./person.repository"));
class PersonService {
    async getAllPersons(filters) {
        const { data, total } = await person_repository_1.default.findAll(filters);
        return { data: data.map(this.mapPersonToResponse), total };
    }
    async getLatestPersons(pagination) {
        const { data, total } = await person_repository_1.default.findLatestCreated(pagination);
        return { data: data.map(this.mapPersonToResponse), total };
    }
    async getPersonById(id) {
        const person = await person_repository_1.default.findById(id);
        return person ? this.mapPersonToResponse(person) : null;
    }
    async createPerson(personData) {
        const { parentId, ...personFields } = personData;
        let parent = null;
        if (parentId) {
            parent = await person_repository_1.default.findById(parentId);
            if (!parent) {
                throw new Error(`Parent person with ID ${parentId} not found`);
            }
        }
        const person = await person_repository_1.default.create(personFields);
        if (parent) {
            await person_repository_1.default.linkBiologicalParentsForDesignatedParent(person.id, person.name, { id: parent.id, name: parent.name });
        }
        return this.mapPersonToResponse(person);
    }
    async updatePerson(id, personData) {
        const updatedPerson = await person_repository_1.default.update(id, personData);
        return updatedPerson ? this.mapPersonToResponse(updatedPerson) : null;
    }
    async deletePerson(id, options) {
        return await person_repository_1.default.delete(id, options);
    }
    async getPersonsByGender(gender) {
        const persons = await person_repository_1.default.findByGender(gender);
        return persons.map(this.mapPersonToResponse);
    }
    async getLivingPersons() {
        const persons = await person_repository_1.default.findLiving();
        return persons.map(this.mapPersonToResponse);
    }
    async getDeceasedPersons() {
        const persons = await person_repository_1.default.findDeceased();
        return persons.map(this.mapPersonToResponse);
    }
    async getPersonCount() {
        return await person_repository_1.default.count();
    }
    mapPersonToResponse(person) {
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
exports.default = new PersonService();
//# sourceMappingURL=person.service.js.map