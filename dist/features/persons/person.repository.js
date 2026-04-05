"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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