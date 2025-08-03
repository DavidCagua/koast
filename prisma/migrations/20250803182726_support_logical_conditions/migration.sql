/*
  Warnings:

  - You are about to drop the column `metric` on the `AutomationRule` table. All the data in the column will be lost.
  - You are about to drop the column `operator` on the `AutomationRule` table. All the data in the column will be lost.
  - You are about to drop the column `threshold` on the `AutomationRule` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AutomationRule" DROP CONSTRAINT "AutomationRule_createdById_fkey";

-- DropIndex
DROP INDEX "public"."AutomationRule_metric_idx";

-- AlterTable
ALTER TABLE "public"."AutomationRule" DROP COLUMN "metric",
DROP COLUMN "operator",
DROP COLUMN "threshold",
ALTER COLUMN "createdById" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."ConditionGroup" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConditionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Condition" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConditionGroup_ruleId_idx" ON "public"."ConditionGroup"("ruleId");

-- CreateIndex
CREATE INDEX "ConditionGroup_order_idx" ON "public"."ConditionGroup"("order");

-- CreateIndex
CREATE INDEX "Condition_groupId_idx" ON "public"."Condition"("groupId");

-- CreateIndex
CREATE INDEX "Condition_order_idx" ON "public"."Condition"("order");

-- AddForeignKey
ALTER TABLE "public"."AutomationRule" ADD CONSTRAINT "AutomationRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConditionGroup" ADD CONSTRAINT "ConditionGroup_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Condition" ADD CONSTRAINT "Condition_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."ConditionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
