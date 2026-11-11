-- AlterTable
ALTER TABLE "chambres" ADD COLUMN     "serviceId" TEXT;

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- CreateIndex
CREATE INDEX "chambres_serviceId_idx" ON "chambres"("serviceId");

-- AddForeignKey
ALTER TABLE "chambres" ADD CONSTRAINT "chambres_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Règle métier : seules les chambres STANDARD appartiennent à un service (VIP et ICU : aucun service).
ALTER TABLE "chambres" ADD CONSTRAINT "chambres_service_only_standard"
  CHECK ("type" = 'STANDARD' OR "serviceId" IS NULL);
