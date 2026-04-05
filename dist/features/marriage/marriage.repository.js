"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("@/shared/database/prisma"));
class MarriageRepository {
    async createMarriage(personId1, personName1, personId2, personName2, startDate) {
        const relationships = await prisma_1.default.$transaction([
            prisma_1.default.relationship.create({
                data: {
                    personId: personId1,
                    personName: personName1,
                    relatedPersonId: personId2,
                    relatedPersonName: personName2,
                    type: client_1.RelationshipType.SPOUSE,
                    startDate,
                    endDate: null,
                },
            }),
            prisma_1.default.relationship.create({
                data: {
                    personId: personId2,
                    personName: personName2,
                    relatedPersonId: personId1,
                    relatedPersonName: personName1,
                    type: client_1.RelationshipType.SPOUSE,
                    startDate,
                    endDate: null,
                },
            }),
        ]);
        return relationships;
    }
    async findActiveMarriage(personId) {
        return await prisma_1.default.relationship.findFirst({
            where: {
                personId,
                type: client_1.RelationshipType.SPOUSE,
                endDate: null,
            },
            include: {
                relatedPerson: true,
            },
        });
    }
    async divorceMarriage(personId, endDate) {
        const activeMarriage = await this.findActiveMarriage(personId);
        if (!activeMarriage) {
            throw new Error('Person is not currently married');
        }
        const spouseId = activeMarriage.relatedPersonId;
        const relationships = await prisma_1.default.$transaction([
            prisma_1.default.relationship.updateMany({
                where: {
                    personId,
                    relatedPersonId: spouseId,
                    type: client_1.RelationshipType.SPOUSE,
                    endDate: null,
                },
                data: { endDate },
            }),
            prisma_1.default.relationship.updateMany({
                where: {
                    personId: spouseId,
                    relatedPersonId: personId,
                    type: client_1.RelationshipType.SPOUSE,
                    endDate: null,
                },
                data: { endDate },
            }),
        ]);
        return await prisma_1.default.relationship.findMany({
            where: {
                OR: [
                    { personId, relatedPersonId: spouseId, type: client_1.RelationshipType.SPOUSE },
                    { personId: spouseId, relatedPersonId: personId, type: client_1.RelationshipType.SPOUSE },
                ],
            },
        });
    }
    async cancelMarriage(personId) {
        const marriage = await prisma_1.default.relationship.findFirst({
            where: {
                personId,
                type: client_1.RelationshipType.SPOUSE,
            },
        });
        if (!marriage) {
            throw new Error('Person has no marriage to cancel');
        }
        const spouseId = marriage.relatedPersonId;
        await prisma_1.default.$transaction([
            prisma_1.default.relationship.deleteMany({
                where: {
                    personId,
                    relatedPersonId: spouseId,
                    type: client_1.RelationshipType.SPOUSE,
                },
            }),
            prisma_1.default.relationship.deleteMany({
                where: {
                    personId: spouseId,
                    relatedPersonId: personId,
                    type: client_1.RelationshipType.SPOUSE,
                },
            }),
        ]);
        return [];
    }
    async findAnyMarriage(personId) {
        return await prisma_1.default.relationship.findFirst({
            where: {
                personId,
                type: client_1.RelationshipType.SPOUSE,
            },
        });
    }
    async cancelDivorce(personId) {
        const divorcedMarriage = await prisma_1.default.relationship.findFirst({
            where: {
                personId,
                type: client_1.RelationshipType.SPOUSE,
                endDate: { not: null },
            },
            include: {
                relatedPerson: true,
            },
        });
        if (!divorcedMarriage) {
            throw new Error('Person is not currently divorced');
        }
        const spouseId = divorcedMarriage.relatedPersonId;
        await prisma_1.default.$transaction([
            prisma_1.default.relationship.updateMany({
                where: {
                    personId,
                    relatedPersonId: spouseId,
                    type: client_1.RelationshipType.SPOUSE,
                    endDate: { not: null },
                },
                data: { endDate: null },
            }),
            prisma_1.default.relationship.updateMany({
                where: {
                    personId: spouseId,
                    relatedPersonId: personId,
                    type: client_1.RelationshipType.SPOUSE,
                    endDate: { not: null },
                },
                data: { endDate: null },
            }),
        ]);
        return await prisma_1.default.relationship.findMany({
            where: {
                OR: [
                    { personId, relatedPersonId: spouseId, type: client_1.RelationshipType.SPOUSE },
                    { personId: spouseId, relatedPersonId: personId, type: client_1.RelationshipType.SPOUSE },
                ],
            },
        });
    }
    async getMarriedPersons(gender) {
        const whereClause = {
            type: client_1.RelationshipType.SPOUSE,
            endDate: null,
        };
        if (gender) {
            whereClause.OR = [
                { person: { gender } },
                { relatedPerson: { gender } },
            ];
        }
        return await prisma_1.default.relationship.findMany({
            where: whereClause,
            include: {
                person: true,
                relatedPerson: true,
            },
        });
    }
    async getDivorcedPersons(gender) {
        const whereClause = {
            type: client_1.RelationshipType.SPOUSE,
            endDate: { not: null },
        };
        if (gender) {
            whereClause.OR = [
                { person: { gender } },
                { relatedPerson: { gender } },
            ];
        }
        return await prisma_1.default.relationship.findMany({
            where: whereClause,
            include: {
                person: true,
                relatedPerson: true,
            },
        });
    }
    async getSinglePersons(gender) {
        const marriedPersonIds = await prisma_1.default.relationship.findMany({
            where: {
                type: client_1.RelationshipType.SPOUSE,
            },
            select: {
                personId: true,
                relatedPersonId: true,
            },
        });
        const marriedIds = new Set();
        marriedPersonIds.forEach(rel => {
            marriedIds.add(rel.personId);
            marriedIds.add(rel.relatedPersonId);
        });
        const whereClause = {
            id: {
                notIn: Array.from(marriedIds),
            },
        };
        if (gender) {
            whereClause.gender = gender;
        }
        return await prisma_1.default.person.findMany({
            where: whereClause,
        });
    }
}
exports.default = new MarriageRepository();
//# sourceMappingURL=marriage.repository.js.map