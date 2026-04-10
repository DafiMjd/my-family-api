"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
class FamilyRepository {
    async findById(familyId) {
        return await prisma_1.default.family.findUnique({
            where: { id: familyId },
            include: {
                familyMembers: {
                    include: {
                        person: {
                            select: {
                                id: true,
                                name: true,
                                gender: true,
                                birthDate: true,
                                deathDate: true,
                                bio: true,
                                profilePictureUrl: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async findFamilies(filters) {
        const { fatherId, motherId, childrenId, limit, offset } = filters;
        const whereConditions = {};
        if (fatherId || motherId || childrenId) {
            whereConditions.familyMembers = {
                some: {
                    OR: [
                        fatherId
                            ? { personId: fatherId, role: client_1.FamilyMemberRole.PARENT }
                            : undefined,
                        motherId
                            ? { personId: motherId, role: client_1.FamilyMemberRole.PARENT }
                            : undefined,
                        childrenId
                            ? { personId: childrenId, role: client_1.FamilyMemberRole.CHILD }
                            : undefined,
                    ].filter(Boolean),
                },
            };
        }
        const [data, total] = await prisma_1.default.$transaction([
            prisma_1.default.family.findMany({
                where: whereConditions,
                include: {
                    familyMembers: {
                        include: {
                            person: {
                                select: {
                                    id: true,
                                    name: true,
                                    gender: true,
                                    birthDate: true,
                                    deathDate: true,
                                    bio: true,
                                    profilePictureUrl: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                ...(limit !== undefined && { take: limit }),
                ...(offset !== undefined && { skip: offset }),
            }),
            prisma_1.default.family.count({ where: whereConditions }),
        ]);
        return { data, total };
    }
    async createFamily(name, description, fatherId, motherId, childrenIds) {
        return await prisma_1.default.family.create({
            data: {
                name,
                description,
                familyMembers: {
                    create: [
                        { personId: fatherId, role: client_1.FamilyMemberRole.PARENT },
                        { personId: motherId, role: client_1.FamilyMemberRole.PARENT },
                        ...childrenIds.map((childId) => ({
                            personId: childId,
                            role: client_1.FamilyMemberRole.CHILD,
                        })),
                    ],
                },
            },
            include: {
                familyMembers: {
                    include: {
                        person: {
                            select: {
                                id: true,
                                name: true,
                                gender: true,
                                birthDate: true,
                                deathDate: true,
                                bio: true,
                                profilePictureUrl: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async createParentChildRelationships(parentId, parentName, childId, childName, type = client_1.ParentType.BIOLOGICAL) {
        await prisma_1.default.parentChild.upsert({
            where: { parentId_childId: { parentId, childId } },
            update: { parentName, childName },
            create: { parentId, parentName, childId, childName, type },
        });
    }
    async createSpouseRelationship(personId1, personName1, personId2, personName2, startDate) {
        return await prisma_1.default.$transaction([
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
    }
    async findActiveSpouseRelationship(personId1, personId2) {
        return await prisma_1.default.relationship.findFirst({
            where: {
                personId: personId1,
                relatedPersonId: personId2,
                type: client_1.RelationshipType.SPOUSE,
                endDate: null,
            },
        });
    }
    async findActiveMarriage(personId) {
        return await prisma_1.default.relationship.findFirst({
            where: {
                personId,
                type: client_1.RelationshipType.SPOUSE,
                endDate: null,
            },
        });
    }
    async updateFamilyChildren(familyId, newChildrenIds) {
        await prisma_1.default.familyMember.deleteMany({
            where: { familyId, role: client_1.FamilyMemberRole.CHILD },
        });
        await prisma_1.default.familyMember.createMany({
            data: newChildrenIds.map((childId) => ({
                familyId,
                personId: childId,
                role: client_1.FamilyMemberRole.CHILD,
            })),
        });
        return (await this.findById(familyId));
    }
    async updateFamilyFather(familyId, newFatherId) {
        const currentFather = await prisma_1.default.familyMember.findFirst({
            where: { familyId, role: client_1.FamilyMemberRole.PARENT, person: { gender: "MAN" } },
        });
        if (currentFather) {
            await prisma_1.default.familyMember.delete({
                where: { familyId_personId: { familyId, personId: currentFather.personId } },
            });
        }
        await prisma_1.default.familyMember.create({
            data: {
                familyId,
                personId: newFatherId,
                role: client_1.FamilyMemberRole.PARENT,
            },
        });
        return (await this.findById(familyId));
    }
    async updateFamilyMother(familyId, newMotherId) {
        const currentMother = await prisma_1.default.familyMember.findFirst({
            where: { familyId, role: client_1.FamilyMemberRole.PARENT, person: { gender: "WOMAN" } },
        });
        if (currentMother) {
            await prisma_1.default.familyMember.delete({
                where: { familyId_personId: { familyId, personId: currentMother.personId } },
            });
        }
        await prisma_1.default.familyMember.create({
            data: {
                familyId,
                personId: newMotherId,
                role: client_1.FamilyMemberRole.PARENT,
            },
        });
        return (await this.findById(familyId));
    }
    async deleteParentChildRelationships(parentIds, childrenIds) {
        await prisma_1.default.parentChild.deleteMany({
            where: {
                parentId: { in: parentIds },
                childId: { in: childrenIds },
            },
        });
    }
    async deleteSpouseRelationship(personId1, personId2) {
        await prisma_1.default.relationship.deleteMany({
            where: {
                OR: [
                    {
                        personId: personId1,
                        relatedPersonId: personId2,
                        type: client_1.RelationshipType.SPOUSE,
                    },
                    {
                        personId: personId2,
                        relatedPersonId: personId1,
                        type: client_1.RelationshipType.SPOUSE,
                    },
                ],
            },
        });
    }
    async deleteFamily(familyId) {
        try {
            await prisma_1.default.family.delete({
                where: { id: familyId },
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getFamilyMembersByRole(familyId, role) {
        return await prisma_1.default.familyMember.findMany({
            where: {
                familyId,
                role,
            },
            include: {
                person: true,
            },
        });
    }
}
exports.default = new FamilyRepository();
//# sourceMappingURL=family.repository.js.map