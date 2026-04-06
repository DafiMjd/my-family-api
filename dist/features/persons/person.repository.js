"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("@/shared/database/prisma"));
class PersonRepository {
    async findAll(filters) {
        const where = {
            ...(filters?.name && { name: { contains: filters.name, mode: "insensitive" } }),
            ...(filters?.gender && { gender: filters.gender }),
        };
        const [data, total] = await prisma_1.default.$transaction([
            prisma_1.default.person.findMany({
                where,
                orderBy: { name: "asc" },
                ...(filters?.limit !== undefined && { take: filters.limit }),
                ...(filters?.offset !== undefined && { skip: filters.offset }),
            }),
            prisma_1.default.person.count({ where }),
        ]);
        return { data, total };
    }
    async findLatestCreated(pagination) {
        const [data, total] = await prisma_1.default.$transaction([
            prisma_1.default.person.findMany({
                orderBy: { createdAt: "desc" },
                ...(pagination?.limit !== undefined && { take: pagination.limit }),
                ...(pagination?.offset !== undefined && { skip: pagination.offset }),
            }),
            prisma_1.default.person.count(),
        ]);
        return { data, total };
    }
    async findById(id) {
        return await prisma_1.default.person.findUnique({
            where: { id },
        });
    }
    async findByName(name) {
        return await prisma_1.default.person.findFirst({
            where: { name },
        });
    }
    async create(personData) {
        return await prisma_1.default.person.create({
            data: {
                ...personData,
                birthDate: new Date(personData.birthDate),
                deathDate: personData.deathDate ? new Date(personData.deathDate) : null,
            },
        });
    }
    async upsertBiologicalParentChild(parentId, parentName, childId, childName) {
        await prisma_1.default.parentChild.upsert({
            where: { parentId_childId: { parentId, childId } },
            update: { parentName, childName },
            create: {
                parentId,
                parentName,
                childId,
                childName,
                type: client_1.ParentType.BIOLOGICAL,
            },
        });
    }
    async linkBiologicalParentsForDesignatedParent(childId, childName, designatedParent) {
        await this.upsertBiologicalParentChild(designatedParent.id, designatedParent.name, childId, childName);
        const marriage = await prisma_1.default.relationship.findFirst({
            where: {
                personId: designatedParent.id,
                type: client_1.RelationshipType.SPOUSE,
                endDate: null,
            },
            select: {
                relatedPersonId: true,
                relatedPersonName: true,
            },
        });
        if (marriage) {
            await this.upsertBiologicalParentChild(marriage.relatedPersonId, marriage.relatedPersonName, childId, childName);
        }
    }
    async createMany(datas) {
        return await prisma_1.default.person.createManyAndReturn({
            data: datas.map((person) => ({
                ...person,
                birthDate: new Date(person.birthDate),
                deathDate: person.deathDate ? new Date(person.deathDate) : null,
            })),
        });
    }
    async update(id, personData) {
        try {
            const updateData = { ...personData };
            if (personData.birthDate) {
                updateData.birthDate = new Date(personData.birthDate);
            }
            if (personData.deathDate !== undefined) {
                updateData.deathDate = personData.deathDate
                    ? new Date(personData.deathDate)
                    : null;
            }
            return await prisma_1.default.person.update({
                where: { id },
                data: updateData,
            });
        }
        catch (error) {
            return null;
        }
    }
    async delete(id) {
        try {
            await prisma_1.default.person.delete({
                where: { id },
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async count() {
        return await prisma_1.default.person.count();
    }
    async findByGender(gender) {
        return await prisma_1.default.person.findMany({
            where: { gender: gender },
            orderBy: { name: "asc" },
        });
    }
    async findLiving() {
        return await prisma_1.default.person.findMany({
            where: { deathDate: null },
            orderBy: { createdAt: "desc" },
        });
    }
    async findDeceased() {
        return await prisma_1.default.person.findMany({
            where: { deathDate: { not: null } },
            orderBy: { createdAt: "desc" },
        });
    }
    async findPersonsByIds(personIds) {
        return await prisma_1.default.person.findMany({
            where: {
                id: { in: personIds },
            },
        });
    }
}
exports.default = new PersonRepository();
//# sourceMappingURL=person.repository.js.map