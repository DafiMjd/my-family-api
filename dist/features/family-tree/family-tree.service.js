"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const person_repository_1 = __importDefault(require("../persons/person.repository"));
const upload_promotion_service_1 = __importDefault(require("../upload/upload-promotion.service"));
const family_tree_repository_1 = __importDefault(require("./family-tree.repository"));
const family_tree_types_1 = require("../../shared/types/family-tree.types");
class FamilyTreeService {
    async getRoots() {
        const roots = await family_tree_repository_1.default.findRootsWithSpouse();
        const rootIds = new Set(roots.map((r) => r.id));
        const processedIds = new Set();
        const result = [];
        for (const root of roots) {
            if (processedIds.has(root.id))
                continue;
            processedIds.add(root.id);
            const spouses = root.relationships
                .filter((relationship) => relationship.relatedPerson._count.childOf === 0)
                .map((relationship) => ({
                person: relationship.relatedPerson,
                startDate: relationship.startDate,
                endDate: relationship.endDate,
            }));
            for (const spouse of spouses) {
                if (rootIds.has(spouse.person.id)) {
                    processedIds.add(spouse.person.id);
                }
            }
            result.push({
                ...this.mapToPersonResponse(root),
                spouses: spouses.map((spouse) => this.mapToSpouseResponse(spouse.person, spouse.startDate, spouse.endDate)),
            });
        }
        return result;
    }
    async getMarriedCouples() {
        const couples = await family_tree_repository_1.default.findMarriedCouples();
        return couples.map((c) => ({
            father: this.mapMarriedCouplePerson(c.father),
            mother: this.mapMarriedCouplePerson(c.mother),
        }));
    }
    async getChildren(fatherId, motherId, withSpouse = false) {
        const f = fatherId?.trim();
        const m = motherId?.trim();
        const hasFather = Boolean(f);
        const hasMother = Boolean(m);
        if (!hasFather && !hasMother) {
            throw new Error("At least one of fatherId or motherId is required");
        }
        if (hasFather && hasMother) {
            const [fatherExists, motherExists] = await Promise.all([
                family_tree_repository_1.default.personExists(f),
                family_tree_repository_1.default.personExists(m),
            ]);
            if (!fatherExists || !motherExists) {
                throw new Error("Father or mother not found");
            }
            if (!(await family_tree_repository_1.default.areMarriedPair(f, m))) {
                throw new Error("Father and mother are not an active married pair");
            }
            if (withSpouse) {
                const children = await family_tree_repository_1.default.findChildrenWithSpouseByPair(f, m);
                return children.map((p) => this.mapToRelativeWithSpousesResponse(p));
            }
            const children = await family_tree_repository_1.default.findChildrenByPair(f, m);
            return children.map((p) => this.mapToRelativeResponse(p));
        }
        const parentId = (f ?? m);
        const parentExists = await family_tree_repository_1.default.personExists(parentId);
        if (!parentExists) {
            throw new Error("Person not found");
        }
        if (withSpouse) {
            const children = await family_tree_repository_1.default.findChildrenWithSpouseByParent(parentId);
            return children.map((p) => this.mapToRelativeWithSpousesResponse(p));
        }
        const children = await family_tree_repository_1.default.findChildrenByParent(parentId);
        return children.map((p) => this.mapToRelativeResponse(p));
    }
    async getClosestRelatedPeople(personId) {
        const result = await family_tree_repository_1.default.findClosestRelatedPeople(personId);
        if (result === null) {
            throw new Error(`Person with ID '${personId}' not found`);
        }
        return {
            spouse: result.relationships[0]?.relatedPerson
                ? this.mapToSpouseResponse(result.relationships[0].relatedPerson, result.relationships[0].startDate, result.relationships[0].endDate)
                : null,
            children: result.parentsOf.map((row) => this.mapToRelativeResponse({ ...row.child, relationshipType: row.type })),
            parents: result.childOf.map((row) => this.mapToRelativeResponse({ ...row.parent, relationshipType: row.type })),
        };
    }
    async getParents(personId) {
        const exists = await family_tree_repository_1.default.personExists(personId);
        if (!exists) {
            throw new Error(`Person with ID '${personId}' not found`);
        }
        const parents = await family_tree_repository_1.default.findParents(personId);
        return parents.map((p) => this.mapToRelativeResponse(p));
    }
    async addChildren(request) {
        const { parent, children } = request;
        const existingIds = children
            .filter((c) => "personId" in c && Boolean(c.personId))
            .map((c) => c.personId.trim());
        const seen = new Set();
        for (const id of existingIds) {
            if (seen.has(id)) {
                throw new Error("Duplicate personId in children list");
            }
            seen.add(id);
            if (id === parent.fatherId || id === parent.motherId) {
                throw new Error("A child cannot be the same person as a parent");
            }
            const eligible = await family_tree_repository_1.default.isChildrenCandidate(id);
            if (!eligible) {
                throw new Error("Each existing child must have no parents and match GET /api/family-tree/children-candidate rules");
            }
        }
        const result = await family_tree_repository_1.default.addChildren(parent, children);
        if (result === null) {
            throw new Error("One or both parents not found");
        }
        const { created, parents } = result;
        await Promise.all(created.map((c) => upload_promotion_service_1.default.syncPersonProfilePictureUrl(c.id, c.profilePictureUrl)));
        const parentsMustHaveDifferentGenders = (parents[0].gender !== "MAN" && parents[1].gender !== "WOMAN") ||
            (parents[0].gender !== "WOMAN" && parents[1].gender !== "MAN");
        if (!parentsMustHaveDifferentGenders) {
            throw new Error("Parents must have different genders");
        }
        const createdIds = created.map((c) => c.id);
        const reloaded = await person_repository_1.default.findPersonsByIds(createdIds);
        const byId = new Map(reloaded.map((p) => [p.id, p]));
        const createdAfterPromote = createdIds.map((id) => {
            const p = byId.get(id);
            if (!p) {
                throw new Error(`Child person missing after add-children: ${id}`);
            }
            return p;
        });
        return {
            children: createdAfterPromote.map((c) => this.mapToPersonResponse(c)),
            connectedParents: parents.map((p) => this.mapToPersonResponse(p)),
        };
    }
    async hasChildren(personId) {
        const hasChildren = await family_tree_repository_1.default.hasChildren(personId);
        if (hasChildren === null) {
            throw new Error(`Person with ID '${personId}' not found`);
        }
        return hasChildren;
    }
    async getChildrenCandidates(limit, offset) {
        const { data, total } = await family_tree_repository_1.default.findChildrenCandidates(limit, offset);
        return { data: data.map((p) => this.mapDbPersonToPersonResponse(p)), total };
    }
    mapDbPersonToPersonResponse(person) {
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
    mapMarriedCouplePerson(person) {
        return {
            ...this.mapToPersonResponse(person),
            relationshipType: family_tree_types_1.ParentType.BIOLOGICAL,
            spouses: [],
        };
    }
    mapToPersonResponse(person) {
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
    mapToRelativeResponse(person) {
        return {
            ...this.mapToPersonResponse(person),
            relationshipType: person.relationshipType,
        };
    }
    mapToRelativeWithSpousesResponse(person) {
        return {
            ...this.mapToPersonResponse(person),
            relationshipType: person.relationshipType,
            spouses: person.spouses.map((spouse) => this.mapToSpouseResponse(spouse.person, spouse.startDate, spouse.endDate)),
        };
    }
    mapToSpouseResponse(spouse, startDate, endDate) {
        return {
            ...this.mapToPersonResponse(spouse),
            startMarriageDate: startDate ? startDate.toISOString() : null,
            endMarriageDate: endDate ? endDate.toISOString() : null,
        };
    }
}
exports.default = new FamilyTreeService();
//# sourceMappingURL=family-tree.service.js.map