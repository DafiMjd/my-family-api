"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const family_repository_1 = __importDefault(require("./family.repository"));
const family_tree_repository_1 = __importDefault(require("../family-tree/family-tree.repository"));
const person_repository_1 = __importDefault(require("../persons/person.repository"));
const client_1 = require("@prisma/client");
const upload_promotion_service_1 = __importDefault(require("../upload/upload-promotion.service"));
class FamilyService {
    async createFamily(data) {
        const fatherIn = this.splitFamilyParentInput(data.father);
        const motherIn = this.splitFamilyParentInput(data.mother);
        const { children: childrenInput, description } = data;
        if (fatherIn.person.gender !== client_1.Gender.MAN) {
            throw new Error("Father must be male");
        }
        if (motherIn.person.gender !== client_1.Gender.WOMAN) {
            throw new Error("Mother must be female");
        }
        if ((fatherIn.parent && (!fatherIn.parent.fatherId || !fatherIn.parent.motherId)) ||
            (motherIn.parent && (!motherIn.parent.fatherId || !motherIn.parent.motherId))) {
            throw new Error("parent.fatherId and parent.motherId are required when parent is provided");
        }
        const grandparentIds = [
            ...new Set([
                fatherIn.parent?.fatherId,
                fatherIn.parent?.motherId,
                motherIn.parent?.fatherId,
                motherIn.parent?.motherId,
            ].filter((id) => Boolean(id))),
        ];
        const grandparentById = new Map();
        if (grandparentIds.length > 0) {
            const grandparents = await person_repository_1.default.findPersonsByIds(grandparentIds);
            for (const p of grandparents) {
                grandparentById.set(p.id, { id: p.id, name: p.name });
            }
            if (grandparentById.size !== grandparentIds.length) {
                throw new Error("Grandparent not found: parent pair must reference existing persons");
            }
        }
        if (fatherIn.parent) {
            const fatherGrandfather = await person_repository_1.default.findById(fatherIn.parent.fatherId);
            const fatherGrandmother = await person_repository_1.default.findById(fatherIn.parent.motherId);
            if (!fatherGrandfather || !fatherGrandmother) {
                throw new Error("Father parent pair not found");
            }
            if (fatherGrandfather.gender !== client_1.Gender.MAN || fatherGrandmother.gender !== client_1.Gender.WOMAN) {
                throw new Error("Father parent pair must be MAN (fatherId) and WOMAN (motherId)");
            }
        }
        if (motherIn.parent) {
            const motherGrandfather = await person_repository_1.default.findById(motherIn.parent.fatherId);
            const motherGrandmother = await person_repository_1.default.findById(motherIn.parent.motherId);
            if (!motherGrandfather || !motherGrandmother) {
                throw new Error("Mother parent pair not found");
            }
            if (motherGrandfather.gender !== client_1.Gender.MAN || motherGrandmother.gender !== client_1.Gender.WOMAN) {
                throw new Error("Mother parent pair must be MAN (fatherId) and WOMAN (motherId)");
            }
        }
        const [father, mother] = await Promise.all([
            person_repository_1.default.create(fatherIn.person),
            person_repository_1.default.create(motherIn.person),
        ]);
        const grandparentLinks = [];
        if (fatherIn.parent) {
            const fatherGrandfather = grandparentById.get(fatherIn.parent.fatherId);
            const fatherGrandmother = grandparentById.get(fatherIn.parent.motherId);
            grandparentLinks.push(person_repository_1.default.upsertBiologicalParentChild(fatherGrandfather.id, fatherGrandfather.name, father.id, father.name));
            grandparentLinks.push(person_repository_1.default.upsertBiologicalParentChild(fatherGrandmother.id, fatherGrandmother.name, father.id, father.name));
        }
        if (motherIn.parent) {
            const motherGrandfather = grandparentById.get(motherIn.parent.fatherId);
            const motherGrandmother = grandparentById.get(motherIn.parent.motherId);
            grandparentLinks.push(person_repository_1.default.upsertBiologicalParentChild(motherGrandfather.id, motherGrandfather.name, mother.id, mother.name));
            grandparentLinks.push(person_repository_1.default.upsertBiologicalParentChild(motherGrandmother.id, motherGrandmother.name, mother.id, mother.name));
        }
        await Promise.all(grandparentLinks);
        const children = await this.resolveFamilyChildrenPersons(childrenInput, father, mother);
        const familyName = data.name !== undefined && String(data.name).trim() !== ""
            ? String(data.name).trim()
            : `${father.name} & ${mother.name}'s Family`;
        const family = await this.createFamilyWithMembers(father, mother, children, familyName, description ?? null);
        await Promise.all([
            upload_promotion_service_1.default.syncPersonProfilePictureUrl(father.id, father.profilePictureUrl),
            upload_promotion_service_1.default.syncPersonProfilePictureUrl(mother.id, mother.profilePictureUrl),
            ...children.map((child) => upload_promotion_service_1.default.syncPersonProfilePictureUrl(child.id, child.profilePictureUrl)),
        ]);
        const refreshedFamily = await family_repository_1.default.findById(family.id);
        if (!refreshedFamily) {
            throw new Error("Family was created but could not be reloaded");
        }
        return this.mapToResponse(refreshedFamily, undefined);
    }
    async resolveFamilyChildrenPersons(childrenInput, father, mother) {
        const seenIds = new Set();
        const children = [];
        for (const item of childrenInput) {
            if ("personId" in item && item.personId) {
                const id = item.personId.trim();
                if (id === father.id || id === mother.id) {
                    throw new Error("Child cannot be the same person as a parent");
                }
                if (seenIds.has(id)) {
                    throw new Error("Duplicate child personId in children list");
                }
                seenIds.add(id);
                const existing = await person_repository_1.default.findById(id);
                if (!existing) {
                    throw new Error(`Child with ID ${id} not found`);
                }
                const eligible = await family_tree_repository_1.default.isChildrenCandidate(id);
                if (!eligible) {
                    throw new Error(`Child ${id} is not eligible (must match GET /api/family-tree/children-candidate rules)`);
                }
                children.push(existing);
                continue;
            }
            if ("newPerson" in item && item.newPerson) {
                const person = await person_repository_1.default.create(item.newPerson);
                children.push(person);
            }
        }
        return children;
    }
    splitFamilyParentInput(input) {
        const { parent, ...person } = input;
        return { parent: parent ?? null, person };
    }
    async createFamilyById(data) {
        const { fatherId, motherId, childrenIds, name, description } = data;
        const father = await person_repository_1.default.findById(fatherId);
        if (!father) {
            throw new Error(`Father with ID ${fatherId} not found`);
        }
        if (father.gender !== client_1.Gender.MAN) {
            throw new Error("Father must be male");
        }
        const mother = await person_repository_1.default.findById(motherId);
        if (!mother) {
            throw new Error(`Mother with ID ${motherId} not found`);
        }
        if (mother.gender !== client_1.Gender.WOMAN) {
            throw new Error("Mother must be female");
        }
        const fatherMarriage = await family_repository_1.default.findActiveMarriage(fatherId);
        if (fatherMarriage && fatherMarriage.relatedPersonId !== motherId) {
            throw new Error(`Father is already married to another person (ID: ${fatherMarriage.relatedPersonId})`);
        }
        const motherMarriage = await family_repository_1.default.findActiveMarriage(motherId);
        if (motherMarriage && motherMarriage.relatedPersonId !== fatherId) {
            throw new Error(`Mother is already married to another person (ID: ${motherMarriage.relatedPersonId})`);
        }
        const children = await Promise.all(childrenIds.map(async (childId) => {
            const child = await person_repository_1.default.findById(childId);
            if (!child) {
                throw new Error(`Child with ID ${childId} not found`);
            }
            return child;
        }));
        const family = await this.createFamilyWithMembers(father, mother, children);
        await Promise.all([
            upload_promotion_service_1.default.syncPersonProfilePictureUrl(father.id, father.profilePictureUrl),
            upload_promotion_service_1.default.syncPersonProfilePictureUrl(mother.id, mother.profilePictureUrl),
            ...children.map((child) => upload_promotion_service_1.default.syncPersonProfilePictureUrl(child.id, child.profilePictureUrl)),
        ]);
        const refreshedFamily = await family_repository_1.default.findById(family.id);
        if (!refreshedFamily) {
            throw new Error("Family was created but could not be reloaded");
        }
        return this.mapToResponse(refreshedFamily, undefined);
    }
    async createFamilyWithMembers(father, mother, children, name, description) {
        const familyName = name || `${father.name} & ${mother.name}'s Family`;
        const family = await family_repository_1.default.createFamily(familyName, description || null, father.id, mother.id, children.map((child) => child.id));
        const existingSpouseRelationship = await family_repository_1.default.findActiveSpouseRelationship(father.id, mother.id);
        if (!existingSpouseRelationship) {
            await family_repository_1.default.createSpouseRelationship(father.id, father.name, mother.id, mother.name, new Date());
        }
        for (const child of children) {
            await family_repository_1.default.createParentChildRelationships(father.id, father.name, child.id, child.name);
            await family_repository_1.default.createParentChildRelationships(mother.id, mother.name, child.id, child.name);
        }
        return family;
    }
    async getFamilyById(familyId) {
        const family = await family_repository_1.default.findById(familyId);
        if (!family) {
            return null;
        }
        return this.mapToResponse(family, undefined);
    }
    async getFamilies(filters) {
        const { data, total } = await family_repository_1.default.findFamilies(filters);
        return {
            data: data.map((family) => this.mapToResponse(family, undefined)),
            total,
        };
    }
    async updateFamilyChildren(familyId, data) {
        const { childrenIds } = data;
        const existingFamily = await family_repository_1.default.findById(familyId);
        if (!existingFamily) {
            throw new Error(`Family with ID ${familyId} not found`);
        }
        const parents = existingFamily.familyMembers.filter((m) => m.role === client_1.FamilyMemberRole.PARENT);
        const father = parents.find((m) => m.person.gender === client_1.Gender.MAN) ?? null;
        const mother = parents.find((m) => m.person.gender === client_1.Gender.WOMAN) ?? null;
        if (!father || !mother) {
            throw new Error("Family must have both father and mother");
        }
        const newChildren = await Promise.all(childrenIds.map(async (childId) => {
            const child = await person_repository_1.default.findById(childId);
            if (!child) {
                throw new Error(`Child with ID ${childId} not found`);
            }
            return child;
        }));
        const oldChildrenIds = existingFamily.familyMembers
            .filter((m) => m.role === client_1.FamilyMemberRole.CHILD)
            .map((m) => m.personId);
        const isDuplicateChildren = oldChildrenIds.some((id) => childrenIds.includes(id));
        if (isDuplicateChildren) {
            throw new Error("Duplicate children IDs are not allowed");
        }
        const parentIds = [father.personId, mother.personId];
        const isDuplicateParentAndChildren = parentIds.some((id) => childrenIds.includes(id));
        if (isDuplicateParentAndChildren) {
            throw new Error("Parent and children IDs must be unique");
        }
        if (oldChildrenIds.length > 0) {
            await family_repository_1.default.deleteParentChildRelationships(parentIds, oldChildrenIds);
        }
        const updatedFamily = await family_repository_1.default.updateFamilyChildren(familyId, childrenIds);
        for (const child of newChildren) {
            await family_repository_1.default.createParentChildRelationships(father.personId, father.person.name, child.id, child.name);
            await family_repository_1.default.createParentChildRelationships(mother.personId, mother.person.name, child.id, child.name);
        }
        return this.mapToResponse(updatedFamily, undefined);
    }
    async updateFamilyFather(familyId, data) {
        const { fatherId } = data;
        const existingFamily = await family_repository_1.default.findById(familyId);
        if (!existingFamily) {
            throw new Error(`Family with ID ${familyId} not found`);
        }
        const newFather = await person_repository_1.default.findById(fatherId);
        if (!newFather) {
            throw new Error(`Father with ID ${fatherId} not found`);
        }
        if (newFather.gender !== client_1.Gender.MAN) {
            throw new Error("Father must be male");
        }
        const parents = existingFamily.familyMembers.filter((m) => m.role === client_1.FamilyMemberRole.PARENT);
        const mother = parents.find((m) => m.person.gender === client_1.Gender.WOMAN) ?? null;
        const oldFather = parents.find((m) => m.person.gender === client_1.Gender.MAN) ?? null;
        const children = existingFamily.familyMembers.filter((m) => m.role === client_1.FamilyMemberRole.CHILD);
        if (!mother) {
            throw new Error("Family must have a mother");
        }
        const newFatherMarriage = await family_repository_1.default.findActiveMarriage(fatherId);
        if (newFatherMarriage &&
            newFatherMarriage.relatedPersonId !== mother.personId) {
            throw new Error(`Father is already married to another person (ID: ${newFatherMarriage.relatedPersonId})`);
        }
        if (oldFather) {
            const childrenIds = children.map((c) => c.personId);
            await family_repository_1.default.deleteParentChildRelationships([oldFather.personId], childrenIds);
            await family_repository_1.default.deleteSpouseRelationship(oldFather.personId, mother.personId);
        }
        const updatedFamily = await family_repository_1.default.updateFamilyFather(familyId, fatherId);
        const existingSpouseRelationship = await family_repository_1.default.findActiveSpouseRelationship(fatherId, mother.personId);
        if (!existingSpouseRelationship) {
            await family_repository_1.default.createSpouseRelationship(fatherId, newFather.name, mother.personId, mother.person.name, new Date());
        }
        for (const child of children) {
            await family_repository_1.default.createParentChildRelationships(fatherId, newFather.name, child.personId, child.person.name);
        }
        return this.mapToResponse(updatedFamily, undefined);
    }
    async updateFamilyMother(familyId, data) {
        const { motherId } = data;
        const existingFamily = await family_repository_1.default.findById(familyId);
        if (!existingFamily) {
            throw new Error(`Family with ID ${familyId} not found`);
        }
        const newMother = await person_repository_1.default.findById(motherId);
        if (!newMother) {
            throw new Error(`Mother with ID ${motherId} not found`);
        }
        if (newMother.gender !== client_1.Gender.WOMAN) {
            throw new Error("Mother must be female");
        }
        const parents = existingFamily.familyMembers.filter((m) => m.role === client_1.FamilyMemberRole.PARENT);
        const father = parents.find((m) => m.person.gender === client_1.Gender.MAN) ?? null;
        const oldMother = parents.find((m) => m.person.gender === client_1.Gender.WOMAN) ?? null;
        const children = existingFamily.familyMembers.filter((m) => m.role === client_1.FamilyMemberRole.CHILD);
        if (!father) {
            throw new Error("Family must have a father");
        }
        const newMotherMarriage = await family_repository_1.default.findActiveMarriage(motherId);
        if (newMotherMarriage &&
            newMotherMarriage.relatedPersonId !== father.personId) {
            throw new Error(`Mother is already married to another person (ID: ${newMotherMarriage.relatedPersonId})`);
        }
        if (oldMother) {
            const childrenIds = children.map((c) => c.personId);
            await family_repository_1.default.deleteParentChildRelationships([oldMother.personId], childrenIds);
            await family_repository_1.default.deleteSpouseRelationship(oldMother.personId, father.personId);
        }
        const updatedFamily = await family_repository_1.default.updateFamilyMother(familyId, motherId);
        const existingSpouseRelationship = await family_repository_1.default.findActiveSpouseRelationship(father.personId, motherId);
        if (!existingSpouseRelationship) {
            await family_repository_1.default.createSpouseRelationship(father.personId, father.person.name, motherId, newMother.name, new Date());
        }
        for (const child of children) {
            await family_repository_1.default.createParentChildRelationships(motherId, newMother.name, child.personId, child.person.name);
        }
        return this.mapToResponse(updatedFamily, undefined);
    }
    async deleteFamily(familyId, options = {}) {
        const { deleteSpouseRelationship = false } = options;
        const existingFamily = await family_repository_1.default.findById(familyId);
        if (!existingFamily) {
            throw new Error(`Family with ID ${familyId} not found`);
        }
        const memberParents = existingFamily.familyMembers.filter((m) => m.role === client_1.FamilyMemberRole.PARENT);
        const father = memberParents.find((m) => m.person.gender === client_1.Gender.MAN) ?? null;
        const mother = memberParents.find((m) => m.person.gender === client_1.Gender.WOMAN) ?? null;
        const children = existingFamily.familyMembers.filter((m) => m.role === client_1.FamilyMemberRole.CHILD);
        if (father && mother && children.length > 0) {
            const parentIds = [father.personId, mother.personId];
            const childrenIds = children.map((c) => c.personId);
            await family_repository_1.default.deleteParentChildRelationships(parentIds, childrenIds);
        }
        if (deleteSpouseRelationship && father && mother) {
            await family_repository_1.default.deleteSpouseRelationship(father.personId, mother.personId);
        }
        return await family_repository_1.default.deleteFamily(familyId);
    }
    mapToResponse(family, childSpouses) {
        const parents = family.familyMembers.filter((m) => m.role === client_1.FamilyMemberRole.PARENT);
        const father = parents.find((m) => m.person.gender === client_1.Gender.MAN) ?? null;
        const mother = parents.find((m) => m.person.gender === client_1.Gender.WOMAN) ?? null;
        const children = family.familyMembers
            .filter((m) => m.role === client_1.FamilyMemberRole.CHILD)
            .map((m) => {
            const spousePerson = childSpouses?.get(m.person.id);
            return {
                id: m.person.id,
                name: m.person.name,
                gender: m.person.gender,
                birthDate: m.person.birthDate,
                deathDate: m.person.deathDate,
                bio: m.person.bio,
                profilePictureUrl: m.person.profilePictureUrl,
                spouse: spousePerson
                    ? {
                        id: spousePerson.id,
                        name: spousePerson.name,
                        gender: spousePerson.gender,
                        birthDate: spousePerson.birthDate,
                        deathDate: spousePerson.deathDate,
                        bio: spousePerson.bio,
                        profilePictureUrl: spousePerson.profilePictureUrl,
                    }
                    : null,
            };
        });
        return {
            id: family.id,
            name: family.name,
            description: family.description,
            father: father
                ? {
                    id: father.person.id,
                    name: father.person.name,
                    gender: father.person.gender,
                    birthDate: father.person.birthDate,
                    deathDate: father.person.deathDate,
                    bio: father.person.bio,
                    profilePictureUrl: father.person.profilePictureUrl,
                }
                : null,
            mother: mother
                ? {
                    id: mother.person.id,
                    name: mother.person.name,
                    gender: mother.person.gender,
                    birthDate: mother.person.birthDate,
                    deathDate: mother.person.deathDate,
                    bio: mother.person.bio,
                    profilePictureUrl: mother.person.profilePictureUrl,
                }
                : null,
            children,
            createdAt: family.createdAt.toISOString(),
            updatedAt: family.updatedAt.toISOString(),
        };
    }
}
exports.default = new FamilyService();
//# sourceMappingURL=family.service.js.map