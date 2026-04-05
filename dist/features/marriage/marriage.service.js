"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const marriage_repository_1 = __importDefault(require("./marriage.repository"));
const person_repository_1 = __importDefault(require("../persons/person.repository"));
class MarriageService {
    async marry(marriageData) {
        const { personId1, personId2, startDate } = marriageData;
        const persons = await person_repository_1.default.findPersonsByIds([personId1, personId2]);
        if (persons.length !== 2) {
            throw new Error("One or both persons not found");
        }
        const person1 = persons.find((p) => p.id === personId1);
        const person2 = persons.find((p) => p.id === personId2);
        if (!person1 || !person2) {
            throw new Error("One or both persons not found");
        }
        if (person1.gender === person2.gender) {
            throw new Error("Persons must have different genders");
        }
        const person1Marriage = await marriage_repository_1.default.findActiveMarriage(personId1);
        const person2Marriage = await marriage_repository_1.default.findActiveMarriage(personId2);
        if (person1Marriage) {
            throw new Error(`person ${person1.name} is already married`);
        }
        if (person2Marriage) {
            throw new Error(`person ${person2.name} is already married`);
        }
        const marriageDate = startDate ? new Date(startDate) : new Date();
        const relationships = await marriage_repository_1.default.createMarriage(personId1, person1.name, personId2, person2.name, marriageDate);
        return {
            success: true,
            data: relationships.map(this.mapRelationshipToResponse),
            message: "Marriage created successfully",
        };
    }
    async divorce(divorceData) {
        const { personId, endDate } = divorceData;
        const person = await person_repository_1.default.findById(personId);
        if (!person) {
            throw new Error("Person not found");
        }
        const divorceDate = endDate ? new Date(endDate) : new Date();
        const relationships = await marriage_repository_1.default.divorceMarriage(personId, divorceDate);
        return {
            success: true,
            data: relationships.map(this.mapRelationshipToResponse),
            message: "Marriage ended successfully",
        };
    }
    async cancelMarriage(cancelData) {
        const { personId } = cancelData;
        const person = await person_repository_1.default.findById(personId);
        if (!person) {
            throw new Error("Person not found");
        }
        await marriage_repository_1.default.cancelMarriage(personId);
        return {
            success: true,
            data: [],
            message: "Marriage cancelled successfully",
        };
    }
    async cancelDivorce(cancelData) {
        const { personId } = cancelData;
        const person = await person_repository_1.default.findById(personId);
        if (!person) {
            throw new Error("Person not found");
        }
        const relationships = await marriage_repository_1.default.cancelDivorce(personId);
        return {
            success: true,
            data: relationships.map(this.mapRelationshipToResponse),
            message: "Divorce cancelled successfully - marriage restored",
        };
    }
    async getPersonsByStatus(status, gender) {
        switch (status) {
            case "married":
                return await this.getMarriedPersons(gender);
            case "divorced":
                return await this.getDivorcedPersons(gender);
            case "single":
                return await this.getSinglePersons(gender);
            default:
                throw new Error("Invalid status. Must be one of: married, single, divorced");
        }
    }
    async getMarriedPersons(gender) {
        const relationships = await marriage_repository_1.default.getMarriedPersons(gender);
        const couples = [];
        const processedIds = new Set();
        for (const rel of relationships) {
            if (!processedIds.has(rel.personId) &&
                !processedIds.has(rel.relatedPersonId)) {
                const husband = rel.person.gender === "MAN" ? rel.person : rel.relatedPerson;
                const wife = rel.person.gender === "WOMAN" ? rel.person : rel.relatedPerson;
                couples.push({
                    husband: this.mapPersonToResponse(husband),
                    wife: this.mapPersonToResponse(wife),
                    startDate: rel.startDate ? rel.startDate.toISOString() : null,
                });
                processedIds.add(rel.personId);
                processedIds.add(rel.relatedPersonId);
            }
        }
        const genderText = gender ? ` (${gender})` : "";
        return {
            success: true,
            data: couples,
            message: `Found ${couples.length} married couples${genderText}`,
        };
    }
    async getDivorcedPersons(gender) {
        const relationships = await marriage_repository_1.default.getDivorcedPersons(gender);
        const couples = [];
        const processedIds = new Set();
        for (const rel of relationships) {
            if (!processedIds.has(rel.personId) &&
                !processedIds.has(rel.relatedPersonId)) {
                const husband = rel.person.gender === "MAN" ? rel.person : rel.relatedPerson;
                const wife = rel.person.gender === "WOMAN" ? rel.person : rel.relatedPerson;
                couples.push({
                    husband: this.mapPersonToResponse(husband),
                    wife: this.mapPersonToResponse(wife),
                    startDate: rel.startDate ? rel.startDate.toISOString() : null,
                    endDate: rel.endDate ? rel.endDate.toISOString() : null,
                });
                processedIds.add(rel.personId);
                processedIds.add(rel.relatedPersonId);
            }
        }
        const genderText = gender ? ` (${gender})` : "";
        return {
            success: true,
            data: couples,
            message: `Found ${couples.length} divorced couples${genderText}`,
        };
    }
    async getSinglePersons(gender) {
        const persons = await marriage_repository_1.default.getSinglePersons(gender);
        const genderText = gender ? ` (${gender})` : "";
        return {
            success: true,
            data: persons.map(this.mapPersonToResponse),
            message: `Found ${persons.length} single persons${genderText}`,
        };
    }
    mapRelationshipToResponse(relationship) {
        return {
            id: relationship.id,
            personId: relationship.personId,
            personName: relationship.personName,
            relatedPersonId: relationship.relatedPersonId,
            relatedPersonName: relationship.relatedPersonName,
            type: relationship.type,
            startDate: relationship.startDate
                ? relationship.startDate.toISOString()
                : null,
            endDate: relationship.endDate ? relationship.endDate.toISOString() : null,
        };
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
exports.default = new MarriageService();
//# sourceMappingURL=marriage.service.js.map