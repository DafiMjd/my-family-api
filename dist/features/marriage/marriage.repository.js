"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
class MarriageRepository {
    async createMarriage(personId1, personName1, personId2, personName2, startDate, endDate) {
        const relationships = await prisma_1.default.$transaction([
            prisma_1.default.relationship.create({
                data: {
                    personId: personId1,
                    personName: personName1,
                    relatedPersonId: personId2,
                    relatedPersonName: personName2,
                    type: client_1.RelationshipType.SPOUSE,
                    startDate,
                    endDate,
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
                    endDate,
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
    async divorceMarriage(fatherId, motherId, endDate) {
        const activeMarriage = await prisma_1.default.relationship.findFirst({
            where: {
                type: client_1.RelationshipType.SPOUSE,
                endDate: null,
                OR: [
                    { personId: fatherId, relatedPersonId: motherId },
                    { personId: motherId, relatedPersonId: fatherId },
                ],
            },
        });
        if (!activeMarriage) {
            throw new Error('Persons are not currently married');
        }
        await prisma_1.default.$transaction([
            prisma_1.default.relationship.updateMany({
                where: {
                    personId: fatherId,
                    relatedPersonId: motherId,
                    type: client_1.RelationshipType.SPOUSE,
                    endDate: null,
                },
                data: { endDate },
            }),
            prisma_1.default.relationship.updateMany({
                where: {
                    personId: motherId,
                    relatedPersonId: fatherId,
                    type: client_1.RelationshipType.SPOUSE,
                    endDate: null,
                },
                data: { endDate },
            }),
        ]);
        return await prisma_1.default.relationship.findMany({
            where: {
                OR: [
                    { personId: fatherId, relatedPersonId: motherId, type: client_1.RelationshipType.SPOUSE },
                    { personId: motherId, relatedPersonId: fatherId, type: client_1.RelationshipType.SPOUSE },
                ],
            },
        });
    }
    async cancelMarriage(fatherId, motherId) {
        const marriage = await prisma_1.default.relationship.findFirst({
            where: {
                type: client_1.RelationshipType.SPOUSE,
                OR: [
                    { personId: fatherId, relatedPersonId: motherId },
                    { personId: motherId, relatedPersonId: fatherId },
                ],
            },
        });
        if (!marriage) {
            throw new Error("Persons have no marriage to cancel");
        }
        await prisma_1.default.$transaction([
            prisma_1.default.relationship.deleteMany({
                where: {
                    personId: fatherId,
                    relatedPersonId: motherId,
                    type: client_1.RelationshipType.SPOUSE,
                },
            }),
            prisma_1.default.relationship.deleteMany({
                where: {
                    personId: motherId,
                    relatedPersonId: fatherId,
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
    async cancelDivorce(fatherId, motherId) {
        const divorcedMarriage = await prisma_1.default.relationship.findFirst({
            where: {
                type: client_1.RelationshipType.SPOUSE,
                endDate: { not: null },
                OR: [
                    { personId: fatherId, relatedPersonId: motherId },
                    { personId: motherId, relatedPersonId: fatherId },
                ],
            },
        });
        if (!divorcedMarriage) {
            throw new Error("Persons are not currently divorced");
        }
        await prisma_1.default.$transaction([
            prisma_1.default.relationship.updateMany({
                where: {
                    personId: fatherId,
                    relatedPersonId: motherId,
                    type: client_1.RelationshipType.SPOUSE,
                    endDate: { not: null },
                },
                data: { endDate: null },
            }),
            prisma_1.default.relationship.updateMany({
                where: {
                    personId: motherId,
                    relatedPersonId: fatherId,
                    type: client_1.RelationshipType.SPOUSE,
                    endDate: { not: null },
                },
                data: { endDate: null },
            }),
        ]);
        return await prisma_1.default.relationship.findMany({
            where: {
                OR: [
                    { personId: fatherId, relatedPersonId: motherId, type: client_1.RelationshipType.SPOUSE },
                    { personId: motherId, relatedPersonId: fatherId, type: client_1.RelationshipType.SPOUSE },
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