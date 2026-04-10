"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const marriage_repository_1 = __importDefault(require("./marriage.repository"));
const person_repository_1 = __importDefault(require("../persons/person.repository"));
const person_service_1 = __importDefault(require("../persons/person.service"));
class MarriageService {
    async marry(marriageData) {
        return this.createMarriageByIds(marriageData);
    }
    async marryByPersonInput(marriageData) {
        const personId1 = await this.resolvePersonId(marriageData.person1);
        const personId2 = await this.resolvePersonId(marriageData.person2);
        return this.createMarriageByIds({
            personId1,
            personId2,
            startDate: marriageData.startDate,
            endDate: marriageData.endDate,
        });
    }
    async createMarriageByIds(marriageData) {
        const { personId1, personId2, startDate, endDate } = marriageData;
        if (personId1 === personId2) {
            throw new Error("Cannot marry a person to themselves");
        }
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
        const marriageDate = startDate ? new Date(startDate) : new Date();
        const marriageEndDate = endDate ? new Date(endDate) : null;
        if (marriageEndDate && marriageEndDate < marriageDate) {
            throw new Error("endDate cannot be earlier than startDate");
        }
        const relationships = await marriage_repository_1.default.createMarriage(personId1, person1.name, personId2, person2.name, marriageDate, marriageEndDate);
        return {
            success: true,
            data: relationships.map(this.mapRelationshipToResponse),
            message: "Marriage created successfully",
        };
    }
    async resolvePersonId(personInput) {
        if (personInput.personId && personInput.newPerson) {
            throw new Error("Provide only one of personId or newPerson");
        }
        if (!personInput.personId && !personInput.newPerson) {
            throw new Error("Either personId or newPerson is required");
        }
        if (personInput.personId) {
            return personInput.personId;
        }
        const createdPerson = await person_service_1.default.createPerson(personInput.newPerson);
        return createdPerson.id;
    }
    async divorce(divorceData) {
        const { fatherId, motherId, endDate } = divorceData;
        const { father, mother } = await this.validateMarriagePair(fatherId, motherId);
        const divorceDate = endDate ? new Date(endDate) : new Date();
        const now = new Date();
        if (divorceDate > now) {
            throw new Error("endDate cannot be in the future");
        }
        const relationships = await marriage_repository_1.default.divorceMarriage(father.id, mother.id, divorceDate);
        return {
            success: true,
            data: relationships.map(this.mapRelationshipToResponse),
            message: "Marriage ended successfully",
        };
    }
    async cancelMarriage(cancelData) {
        const { fatherId, motherId } = cancelData;
        const { father, mother } = await this.validateMarriagePair(fatherId, motherId);
        await marriage_repository_1.default.cancelMarriage(father.id, mother.id);
        return {
            success: true,
            data: [],
            message: "Marriage cancelled successfully",
        };
    }
    async cancelDivorce(cancelData) {
        const { fatherId, motherId } = cancelData;
        const { father, mother } = await this.validateMarriagePair(fatherId, motherId);
        const relationships = await marriage_repository_1.default.cancelDivorce(father.id, mother.id);
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
        const processedPairs = new Set();
        for (const rel of relationships) {
            const pairKey = [rel.personId, rel.relatedPersonId].sort().join(":");
            if (processedPairs.has(pairKey))
                continue;
            const husband = rel.person.gender === "MAN" ? rel.person : rel.relatedPerson;
            const wife = rel.person.gender === "WOMAN" ? rel.person : rel.relatedPerson;
            couples.push({
                husband: this.mapPersonToResponse(husband),
                wife: this.mapPersonToResponse(wife),
                startDate: rel.startDate ? rel.startDate.toISOString() : null,
            });
            processedPairs.add(pairKey);
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
        const processedPairs = new Set();
        for (const rel of relationships) {
            const pairKey = [rel.personId, rel.relatedPersonId].sort().join(":");
            if (processedPairs.has(pairKey))
                continue;
            const husband = rel.person.gender === "MAN" ? rel.person : rel.relatedPerson;
            const wife = rel.person.gender === "WOMAN" ? rel.person : rel.relatedPerson;
            couples.push({
                husband: this.mapPersonToResponse(husband),
                wife: this.mapPersonToResponse(wife),
                startDate: rel.startDate ? rel.startDate.toISOString() : null,
                endDate: rel.endDate ? rel.endDate.toISOString() : null,
            });
            processedPairs.add(pairKey);
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
    async validateMarriagePair(fatherId, motherId) {
        if (fatherId === motherId) {
            throw new Error("fatherId and motherId must be different");
        }
        const [father, mother] = await Promise.all([
            person_repository_1.default.findById(fatherId),
            person_repository_1.default.findById(motherId),
        ]);
        if (!father || !mother) {
            throw new Error("One or both persons not found");
        }
        if (father.gender !== "MAN") {
            throw new Error("fatherId must reference a MAN");
        }
        if (mother.gender !== "WOMAN") {
            throw new Error("motherId must reference a WOMAN");
        }
        return { father, mother };
    }
}
exports.default = new MarriageService();
//# sourceMappingURL=marriage.service.js.map