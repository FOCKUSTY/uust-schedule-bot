/*
  Warnings:

  - You are about to drop the column `isActived` on the `UserConfig` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `UserConfig` table. All the data in the column will be lost.
  - Added the required column `defaulted` to the `UserConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserConfig" DROP COLUMN "isActived",
DROP COLUMN "isDefault",
ADD COLUMN     "actived" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaulted" BOOLEAN NOT NULL;
