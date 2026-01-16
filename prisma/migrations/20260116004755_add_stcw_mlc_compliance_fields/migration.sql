-- AlterTable
ALTER TABLE "User" ADD COLUMN "cdcNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "cocExpiryDate" DATETIME;
ALTER TABLE "User" ADD COLUMN "cocGrade" TEXT;
ALTER TABLE "User" ADD COLUMN "cocIssueDate" DATETIME;
ALTER TABLE "User" ADD COLUMN "dateOfBirth" DATETIME;
ALTER TABLE "User" ADD COLUMN "issuingAuthority" TEXT;
ALTER TABLE "User" ADD COLUMN "medicalCertExpiry" DATETIME;
ALTER TABLE "User" ADD COLUMN "medicalCertIssue" DATETIME;
ALTER TABLE "User" ADD COLUMN "medicalCertNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "nationality" TEXT;
ALTER TABLE "User" ADD COLUMN "placeOfBirth" TEXT;
ALTER TABLE "User" ADD COLUMN "stcwEndorsements" TEXT;
ALTER TABLE "User" ADD COLUMN "tankerEndorsement" TEXT;

-- AlterTable
ALTER TABLE "Vessel" ADD COLUMN "callSign" TEXT;
ALTER TABLE "Vessel" ADD COLUMN "classificationSociety" TEXT;
ALTER TABLE "Vessel" ADD COLUMN "deadweight" INTEGER;
ALTER TABLE "Vessel" ADD COLUMN "enginePower" INTEGER;
ALTER TABLE "Vessel" ADD COLUMN "engineType" TEXT;
ALTER TABLE "Vessel" ADD COLUMN "lengthOverall" REAL;
ALTER TABLE "Vessel" ADD COLUMN "mmsi" TEXT;
ALTER TABLE "Vessel" ADD COLUMN "netTonnage" INTEGER;
ALTER TABLE "Vessel" ADD COLUMN "officialNumber" TEXT;
ALTER TABLE "Vessel" ADD COLUMN "portOfRegistry" TEXT;
ALTER TABLE "Vessel" ADD COLUMN "propulsionType" TEXT;
ALTER TABLE "Vessel" ADD COLUMN "shipyard" TEXT;
ALTER TABLE "Vessel" ADD COLUMN "yearBuilt" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "registrationNumber" TEXT,
    "docNumber" TEXT,
    "docIssueDate" DATETIME,
    "docExpiryDate" DATETIME,
    "dpaName" TEXT,
    "dpaEmail" TEXT,
    "dpaPhone" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "mlcCertified" BOOLEAN NOT NULL DEFAULT false,
    "mlcCertExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("address", "country", "createdAt", "id", "name", "updatedAt", "userId") SELECT "address", "country", "createdAt", "id", "name", "updatedAt", "userId" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_userId_name_key" ON "Company"("userId", "name");
CREATE TABLE "new_SeatimeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "capacity" TEXT,
    "department" TEXT,
    "watchSchedule" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "computedDurationHours" REAL NOT NULL,
    "computedDurationDays" REAL NOT NULL,
    "voyageType" TEXT,
    "tradingArea" TEXT,
    "cargoType" TEXT,
    "departurePort" TEXT,
    "arrivalPort" TEXT,
    "route" TEXT,
    "serviceLetterNumber" TEXT,
    "dischargeBookPage" TEXT,
    "signoffReason" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifierTitle" TEXT,
    "verifierEmail" TEXT,
    "verifiedAt" DATETIME,
    "companyStamp" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "hasOverlapApproval" BOOLEAN NOT NULL DEFAULT false,
    "overlapReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SeatimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeatimeEntry_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SeatimeEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SeatimeEntry" ("arrivalPort", "companyId", "computedDurationDays", "computedDurationHours", "createdAt", "departurePort", "endAt", "hasOverlapApproval", "id", "isVerified", "notes", "overlapReason", "rank", "route", "startAt", "updatedAt", "userId", "verifiedAt", "verifiedBy", "vesselId", "watchSchedule") SELECT "arrivalPort", "companyId", "computedDurationDays", "computedDurationHours", "createdAt", "departurePort", "endAt", "hasOverlapApproval", "id", "isVerified", "notes", "overlapReason", "rank", "route", "startAt", "updatedAt", "userId", "verifiedAt", "verifiedBy", "vesselId", "watchSchedule" FROM "SeatimeEntry";
DROP TABLE "SeatimeEntry";
ALTER TABLE "new_SeatimeEntry" RENAME TO "SeatimeEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
