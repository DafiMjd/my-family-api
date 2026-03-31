-- CreateEnum
CREATE TYPE "public"."ParentType" AS ENUM ('BIOLOGICAL', 'ADOPTIVE', 'STEP');

-- CreateTable
CREATE TABLE "public"."parent_child" (
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "type" "public"."ParentType" NOT NULL,

    CONSTRAINT "parent_child_pkey" PRIMARY KEY ("parentId","childId")
);

-- CreateIndex
CREATE INDEX "parent_child_childId_idx" ON "public"."parent_child"("childId");

-- AddForeignKey
ALTER TABLE "public"."parent_child" ADD CONSTRAINT "parent_child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parent_child" ADD CONSTRAINT "parent_child_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
