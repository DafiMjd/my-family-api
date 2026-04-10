"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
const client_1 = require("@prisma/client");
class FamilyTreeRepository {
    getChildrenCandidateWhere() {
        return {
            childOf: { none: {} },
            NOT: {
                OR: [
                    {
                        relationships: {
                            some: {
                                type: client_1.RelationshipType.SPOUSE,
                                relatedPerson: {
                                    childOf: { some: {} },
                                },
                            },
                        },
                    },
                    {
                        relatedRelationships: {
                            some: {
                                type: client_1.RelationshipType.SPOUSE,
                                person: {
                                    childOf: { some: {} },
                                },
                            },
                        },
                    },
                ],
            },
        };
    }
    async isChildrenCandidate(personId) {
        const count = await prisma_1.default.person.count({
            where: { id: personId, ...this.getChildrenCandidateWhere() },
        });
        return count > 0;
    }
    async findRootsWithSpouse() {
        const rows = await prisma_1.default.person.findMany({
            where: {
                childOf: { none: {} },
                NOT: {
                    OR: [
                        {
                            relationships: {
                                some: {
                                    type: client_1.RelationshipType.SPOUSE,
                                    relatedPerson: {
                                        childOf: { some: {} },
                                    },
                                },
                            },
                        },
                        {
                            relatedRelationships: {
                                some: {
                                    type: client_1.RelationshipType.SPOUSE,
                                    person: {
                                        childOf: { some: {} },
                                    },
                                },
                            },
                        },
                    ],
                },
            },
            include: {
                relationships: {
                    where: { type: client_1.RelationshipType.SPOUSE },
                    include: {
                        relatedPerson: {
                            include: { _count: { select: { childOf: true } } },
                        },
                    },
                },
            },
            orderBy: { birthDate: "asc" },
        });
        return rows;
    }
    async findMarriedCouples() {
        const rows = await prisma_1.default.relationship.findMany({
            where: { type: client_1.RelationshipType.SPOUSE },
            include: {
                person: true,
                relatedPerson: true,
            },
        });
        const couples = [];
        for (const row of rows) {
            if (row.personId >= row.relatedPersonId) {
                continue;
            }
            const a = row.person;
            const b = row.relatedPerson;
            if (a.gender === "MAN" && b.gender === "WOMAN") {
                couples.push({ father: a, mother: b });
            }
            else if (a.gender === "WOMAN" && b.gender === "MAN") {
                couples.push({ father: b, mother: a });
            }
        }
        couples.sort((x, y) => {
            const byFather = x.father.name.localeCompare(y.father.name);
            if (byFather !== 0) {
                return byFather;
            }
            return x.mother.name.localeCompare(y.mother.name);
        });
        return couples;
    }
    async areMarriedPair(fatherId, motherId) {
        const relationship = await prisma_1.default.relationship.findFirst({
            where: {
                type: client_1.RelationshipType.SPOUSE,
                OR: [
                    { personId: fatherId, relatedPersonId: motherId },
                    { personId: motherId, relatedPersonId: fatherId },
                ],
            },
        });
        return Boolean(relationship);
    }
    async findChildrenWithSpouseByPair(fatherId, motherId) {
        const rows = await prisma_1.default.parentChild.findMany({
            where: {
                parentId: fatherId,
                child: {
                    childOf: {
                        some: {
                            parentId: motherId,
                        },
                    },
                },
            },
            include: {
                child: {
                    include: {
                        relationships: {
                            where: { type: client_1.RelationshipType.SPOUSE },
                            include: { relatedPerson: true },
                        },
                    },
                },
            },
            orderBy: { child: { birthDate: "asc" } },
        });
        return rows.map((row) => ({
            ...row.child,
            relationshipType: row.type,
            spouses: row.child.relationships.map((relationship) => ({
                person: relationship.relatedPerson,
                startDate: relationship.startDate,
                endDate: relationship.endDate,
            })),
        }));
    }
    async findChildrenByPair(fatherId, motherId) {
        const rows = await prisma_1.default.parentChild.findMany({
            where: {
                parentId: fatherId,
                child: {
                    childOf: {
                        some: {
                            parentId: motherId,
                        },
                    },
                },
            },
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
    async findChildrenWithSpouseByParent(parentId) {
        const rows = await prisma_1.default.parentChild.findMany({
            where: { parentId },
            include: {
                child: {
                    include: {
                        relationships: {
                            where: { type: client_1.RelationshipType.SPOUSE },
                            include: { relatedPerson: true },
                        },
                    },
                },
            },
            orderBy: { child: { birthDate: "asc" } },
        });
        return rows.map((row) => ({
            ...row.child,
            relationshipType: row.type,
            spouses: row.child.relationships.map((relationship) => ({
                person: relationship.relatedPerson,
                startDate: relationship.startDate,
                endDate: relationship.endDate,
            })),
        }));
    }
    async findChildrenByParent(parentId) {
        const rows = await prisma_1.default.parentChild.findMany({
            where: { parentId },
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
    async addChildren(parent, children) {
        const [father, mother] = await Promise.all([
            prisma_1.default.person.findUnique({ where: { id: parent.fatherId } }),
            prisma_1.default.person.findUnique({ where: { id: parent.motherId } }),
        ]);
        if (!father || !mother)
            return null;
        const result = await prisma_1.default.$transaction(async (tx) => {
            const out = [];
            for (const item of children) {
                if ("personId" in item && item.personId) {
                    const existing = await tx.person.findUnique({ where: { id: item.personId } });
                    if (!existing) {
                        throw new Error(`Child person not found: ${item.personId}`);
                    }
                    await tx.parentChild.upsert({
                        where: { parentId_childId: { parentId: father.id, childId: existing.id } },
                        update: { parentName: father.name, childName: existing.name },
                        create: {
                            parentId: father.id,
                            parentName: father.name,
                            childId: existing.id,
                            childName: existing.name,
                            type: client_1.ParentType.BIOLOGICAL,
                        },
                    });
                    await tx.parentChild.upsert({
                        where: { parentId_childId: { parentId: mother.id, childId: existing.id } },
                        update: { parentName: mother.name, childName: existing.name },
                        create: {
                            parentId: mother.id,
                            parentName: mother.name,
                            childId: existing.id,
                            childName: existing.name,
                            type: client_1.ParentType.BIOLOGICAL,
                        },
                    });
                    out.push(existing);
                    continue;
                }
                if ("newPerson" in item && item.newPerson) {
                    const np = item.newPerson;
                    const created = await tx.person.create({
                        data: {
                            name: np.name,
                            gender: np.gender,
                            birthDate: new Date(np.birthDate),
                            deathDate: np.deathDate ? new Date(np.deathDate) : null,
                            bio: np.bio ?? null,
                            profilePictureUrl: np.profilePictureUrl ?? null,
                            childOf: {
                                create: [
                                    {
                                        parentId: father.id,
                                        parentName: father.name,
                                        childName: np.name,
                                        type: client_1.ParentType.BIOLOGICAL,
                                    },
                                    {
                                        parentId: mother.id,
                                        parentName: mother.name,
                                        childName: np.name,
                                        type: client_1.ParentType.BIOLOGICAL,
                                    },
                                ],
                            },
                        },
                    });
                    out.push(created);
                }
            }
            return {
                created: out,
                parents: [father, mother],
            };
        });
        return result;
    }
    async findChildrenCandidates(limit, offset) {
        const where = this.getChildrenCandidateWhere();
        const [data, total] = await prisma_1.default.$transaction([
            prisma_1.default.person.findMany({
                where,
                orderBy: { name: "asc" },
                take: limit,
                skip: offset,
            }),
            prisma_1.default.person.count({ where }),
        ]);
        return { data: data, total };
    }
    async hasChildren(personId) {
        const person = await prisma_1.default.person.findUnique({
            where: { id: personId },
            select: {
                parentsOf: {
                    select: { childId: true },
                    take: 1,
                },
            },
        });
        if (!person) {
            return null;
        }
        return person.parentsOf.length > 0;
    }
}
exports.default = new FamilyTreeRepository();
//# sourceMappingURL=family-tree.repository.js.map