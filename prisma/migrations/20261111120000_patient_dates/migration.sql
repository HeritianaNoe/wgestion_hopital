-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "admittedAt" DATE,
ADD COLUMN     "dischargedAt" DATE;

-- Reprise des données existantes : entrée = date d'enregistrement pour les patients
-- hospitalisés ou sortis ; sortie = dernière mise à jour pour les patients sortis.
UPDATE "patients" SET "admittedAt" = "createdAt"::date WHERE "status" IN ('ADMITTED', 'DISCHARGED');
UPDATE "patients" SET "dischargedAt" = "updatedAt"::date WHERE "status" = 'DISCHARGED';

-- CreateIndex
CREATE INDEX "patients_admittedAt_idx" ON "patients"("admittedAt");

-- Règle métier : la sortie ne peut pas précéder l'entrée.
ALTER TABLE "patients" ADD CONSTRAINT "patients_discharge_after_admission"
  CHECK ("dischargedAt" IS NULL OR "admittedAt" IS NULL OR "dischargedAt" >= "admittedAt");
