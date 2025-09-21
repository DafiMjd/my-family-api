/*
  Warnings:

  - Added the required column `personName` to the `relationships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relatedPersonName` to the `relationships` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."relationships" ADD COLUMN     "personName" VARCHAR(100) NOT NULL,
ADD COLUMN     "relatedPersonName" VARCHAR(100) NOT NULL;
