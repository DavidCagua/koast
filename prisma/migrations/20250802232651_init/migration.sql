/*
  Warnings:

  - You are about to drop the column `roas` on the `ActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `roas` on the `Campaign` table. All the data in the column will be lost.
  - Added the required column `clicks` to the `ActionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `costPerInlineLinkClick` to the `ActionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpc` to the `ActionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frequency` to the `ActionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inlineLinkClicks` to the `ActionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reach` to the `ActionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clicks` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `costPerInlineLinkClick` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpc` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frequency` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inlineLinkClicks` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reach` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ActionLog" DROP COLUMN "roas",
ADD COLUMN     "clicks" INTEGER NOT NULL,
ADD COLUMN     "costPerInlineLinkClick" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "cpc" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "frequency" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "inlineLinkClicks" INTEGER NOT NULL,
ADD COLUMN     "reach" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Campaign" DROP COLUMN "roas",
ADD COLUMN     "clicks" INTEGER NOT NULL,
ADD COLUMN     "costPerInlineLinkClick" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "cpc" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "frequency" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "inlineLinkClicks" INTEGER NOT NULL,
ADD COLUMN     "reach" INTEGER NOT NULL;
