/*
  Warnings:

  - You are about to drop the `Condition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConditionGroup` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `metric` to the `AutomationRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operator` to the `AutomationRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `threshold` to the `AutomationRule` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Condition" DROP CONSTRAINT "Condition_groupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ConditionGroup" DROP CONSTRAINT "ConditionGroup_ruleId_fkey";

-- AlterTable
ALTER TABLE "public"."AutomationRule" ADD COLUMN     "metric" TEXT NOT NULL,
ADD COLUMN     "operator" TEXT NOT NULL,
ADD COLUMN     "threshold" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "public"."Condition";

-- DropTable
DROP TABLE "public"."ConditionGroup";

-- CreateIndex
CREATE INDEX "AutomationRule_metric_idx" ON "public"."AutomationRule"("metric");
