"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("@/shared/database/prisma"));
const client_1 = require("@prisma/client");
class FamilyTreeRepository {
    async findRootsWithSpouse() {
        const rows = await prisma_1.default.person.findMany({
            where: {
                childOf: { none: {} },
            },
            include: {
                relationships: {
                    where: { type: client_1.RelationshipType.SPOUSE, endDate: null },
                    include: {
                        relatedPerson: {
                            include: { _count: { select: { childOf: true } } },
                        },
                    },
                    take: 1,
                },
            },
            orderBy: { birthDate: "asc" },
        });
        return rows;
    }
    async findChildrenWithSpouse(personId) {
        const person = await prisma_1.default.person.findUnique({
            where: { id: personId },
            select: {
                parentsOf: {
                    include: {
                        child: {
                            include: {
                                relationships: {
                                    where: { type: client_1.RelationshipType.SPOUSE, endDate: null },
                                    include: { relatedPerson: true },
                                    take: 1,
                                },
                            },
                        },
                    },
                    orderBy: { child: { birthDate: "asc" } },
                },
            },
        });
        if (!person)
            return null;
        const raw = person;
        return raw.parentsOf.map((row) => ({
            ...row.child,
            relationshipType: row.type,
            spouse: row.child.relationships[0]?.relatedPerson ?? null,
        }));
    }
    async findChildren(personId) {
        const rows = await prisma_1.default.parentChild.findMany({
            where: { parentId: personId },
            include: {
                child: true,
            },
            orderBy: { child: { birthDate: "asc" } },
        });
        return rows.map((row) => ({
            ...row.child,
            relationshipType: row.type,
        }));
    }
    async findParents(personId) {
        const rows = await prisma_1.default.parentChild.findMany({
            where: { childId: personId },
            include: {
                parent: true,
            },
            orderBy: { parent: { birthDate: "asc" } },
        });
        return rows.map((row) => ({
            ...row.parent,
            relationshipType: row.type,
        }));
    }
    async findClosestRelatedPeople(personId) {
        const result = await prisma_1.default.person.findUnique({
            where: { id: personId },
            select: {
                relationships: {
                    where: { type: client_1.RelationshipType.SPOUSE, endDate: null },
                    include: { relatedPerson: true },
                    take: 1,
                },
                parentsOf: {
                    include: { child: true },
                    orderBy: { child: { birthDate: "asc" } },
                },
                childOf: {
                    include: { parent: true },
                    orderBy: { parent: { birthDate: "asc" } },
                },
            },
        });
        return result;
    }
    async personExists(personId) {
        const count = await prisma_1.default.person.count({ where: { id: personId } });
        return count > 0;
    }
}
exports.default = new FamilyTreeRepository();
//# sourceMappingURL=family-tree.repository.js.map