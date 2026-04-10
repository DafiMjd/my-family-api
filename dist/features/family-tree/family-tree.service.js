"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const family_tree_repository_1 = __importDefault(require("./family-tree.repository"));
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
            const isMarried = spouses.length > 0;
            for (const spouse of spouses) {
                if (rootIds.has(spouse.person.id)) {
                    processedIds.add(spouse.person.id);
                }
            }
            result.push({
                ...this.mapToPersonResponse(root),
                spouses: spouses.map((spouse) => this.mapToSpouseResponse(spouse.person, spouse.startDate, spouse.endDate)),
                isMarried,
            });
        }
        return result;
    }
    async getChildren(personId, withSpouse = false) {
        const exists = await family_tree_repository_1.default.personExists(personId);
        if (!exists) {
            throw new Error(`Person with ID '${personId}' not found`);
        }
        if (withSpouse) {
            const children = await family_tree_repository_1.default.findChildrenWithSpouse(personId);
            if (children === null) {
                throw new Error(`Person with ID '${personId}' not found`);
            }
            return children.map((p) => this.mapToRelativeWithSpousesResponse(p));
        }
        const children = await family_tree_repository_1.default.findChildren(personId);
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
    async addChildren(parentId, children) {
        const result = await family_tree_repository_1.default.addChildren(parentId, children);
        if (result === null) {
            throw new Error(`Person with ID '${parentId}' not found`);
        }
        const { created, parent, spouse } = result;
        const connectedParents = spouse ? [parent, spouse] : [parent];
        return {
            children: created.map((c) => this.mapToPersonResponse(c)),
            connectedParents: connectedParents.map((p) => this.mapToPersonResponse(p)),
        };
    }
    async hasChildren(personId) {
        const hasChildren = await family_tree_repository_1.default.hasChildren(personId);
        if (hasChildren === null) {
            throw new Error(`Person with ID '${personId}' not found`);
        }
        return hasChildren;
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