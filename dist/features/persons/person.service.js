"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const person_repository_1 = __importDefault(require("./person.repository"));
const person_types_1 = require("@/shared/types/person.types");
class PersonService {
    async getAllPersons() {
        const persons = await person_repository_1.default.findAll();
        return persons.map(this.mapPersonToResponse);
    }
    async getPersonById(id) {
        const person = await person_repository_1.default.findById(id);
        return person ? this.mapPersonToResponse(person) : null;
    }
    async createPerson(personData) {
        if (!personData.name || !personData.gender || !personData.birthDate) {
            throw new Error('Name, gender, and birth date are required');
        }
        const validGenders = Object.values(person_types_1.Gender);
        if (!validGenders.includes(personData.gender)) {
            throw new Error('Invalid gender. Must be MAN or WOMAN');
        }
        const birthDate = new Date(personData.birthDate);
        if (isNaN(birthDate.getTime())) {
            throw new Error('Invalid birth date format');
        }
        if (personData.deathDate) {
            const deathDate = new Date(personData.deathDate);
            if (isNaN(deathDate.getTime())) {
                throw new Error('Invalid death date format');
            }
            if (deathDate <= birthDate) {
                throw new Error('Death date must be after birth date');
            }
        }
        if (personData.name.length > 100) {
            throw new Error('Name must be 100 characters or less');
        }
        if (personData.bio && personData.bio.length > 1000) {
            throw new Error('Bio must be 1000 characters or less');
        }
        const person = await person_repository_1.default.create(personData);
        return this.mapPersonToResponse(person);
    }
    async updatePerson(id, personData) {
        const existingPerson = await person_repository_1.default.findById(id);
        if (!existingPerson) {
            return null;
        }
        if (personData.gender) {
            const validGenders = Object.values(person_types_1.Gender);
            if (!validGenders.includes(personData.gender)) {
                throw new Error('Invalid gender. Must be MAN or WOMAN');
            }
        }
        if (personData.birthDate) {
            const birthDate = new Date(personData.birthDate);
            if (isNaN(birthDate.getTime())) {
                throw new Error('Invalid birth date format');
            }
        }
        if (personData.deathDate !== undefined) {
            if (personData.deathDate) {
                const deathDate = new Date(personData.deathDate);
                if (isNaN(deathDate.getTime())) {
                    throw new Error('Invalid death date format');
                }
                const birthDate = personData.birthDate ? new Date(personData.birthDate) : existingPerson.birthDate;
                if (deathDate <= birthDate) {
                    throw new Error('Death date must be after birth date');
                }
            }
        }
        if (personData.name && personData.name.length > 100) {
            throw new Error('Name must be 100 characters or less');
        }
        if (personData.bio && personData.bio.length > 1000) {
            throw new Error('Bio must be 1000 characters or less');
        }
        const updatedPerson = await person_repository_1.default.update(id, personData);
        return updatedPerson ? this.mapPersonToResponse(updatedPerson) : null;
    }
    async deletePerson(id) {
        return await person_repository_1.default.delete(id);
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
            updatedAt: person.updatedAt.toISOString()
        };
    }
}
exports.default = new PersonService();
//# sourceMappingURL=person.service.js.map