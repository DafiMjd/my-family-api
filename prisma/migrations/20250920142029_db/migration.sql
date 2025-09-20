-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MAN', 'WOMAN');

-- CreateEnum
CREATE TYPE "public"."RelationshipType" AS ENUM ('PARENT', 'CHILD', 'SPOUSE');

-- CreateEnum
CREATE TYPE "public"."FamilyMemberRole" AS ENUM ('FATHER', 'MOTHER', 'CHILD');

-- CreateTable
CREATE TABLE "public"."persons" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "deathDate" TIMESTAMP(3),
    "bio" TEXT,
    "profilePictureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."relationships" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "relatedPersonId" TEXT NOT NULL,
    "type" "public"."RelationshipType" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."families" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_members" (
    "familyId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" "public"."FamilyMemberRole" NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("familyId","personId")
);

-- CreateIndex
CREATE UNIQUE INDEX "relationships_personId_relatedPersonId_type_key" ON "public"."relationships"("personId", "relatedPersonId", "type");

-- AddForeignKey
ALTER TABLE "public"."relationships" ADD CONSTRAINT "relationships_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."relationships" ADD CONSTRAINT "relationships_relatedPersonId_fkey" FOREIGN KEY ("relatedPersonId") REFERENCES "public"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_members" ADD CONSTRAINT "family_members_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_members" ADD CONSTRAINT "family_members_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
