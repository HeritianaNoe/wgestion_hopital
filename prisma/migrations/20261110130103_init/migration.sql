-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('VIP', 'STANDARD', 'ICU');

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ADMITTED', 'DISCHARGED', 'OUTPATIENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'RECEPTIONIST',
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chambres" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "type" "RoomType" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chambres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lits" (
    "id" TEXT NOT NULL,
    "bedNumber" TEXT NOT NULL,
    "chambreId" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "phone" TEXT,
    "emergencyContact" TEXT,
    "medicalHistory" TEXT,
    "status" "PatientStatus" NOT NULL DEFAULT 'OUTPATIENT',
    "litId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "chambres_number_key" ON "chambres"("number");

-- CreateIndex
CREATE INDEX "chambres_floor_idx" ON "chambres"("floor");

-- CreateIndex
CREATE INDEX "chambres_type_idx" ON "chambres"("type");

-- CreateIndex
CREATE INDEX "lits_status_idx" ON "lits"("status");

-- CreateIndex
CREATE INDEX "lits_chambreId_status_idx" ON "lits"("chambreId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lits_chambreId_bedNumber_key" ON "lits"("chambreId", "bedNumber");

-- CreateIndex
CREATE UNIQUE INDEX "patients_litId_key" ON "patients"("litId");

-- CreateIndex
CREATE INDEX "patients_status_idx" ON "patients"("status");

-- CreateIndex
CREATE INDEX "patients_lastName_firstName_idx" ON "patients"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "patients_createdAt_idx" ON "patients"("createdAt");

-- AddForeignKey
ALTER TABLE "lits" ADD CONSTRAINT "lits_chambreId_fkey" FOREIGN KEY ("chambreId") REFERENCES "chambres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_litId_fkey" FOREIGN KEY ("litId") REFERENCES "lits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
