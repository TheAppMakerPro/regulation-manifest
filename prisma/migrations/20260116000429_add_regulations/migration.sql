-- CreateTable
CREATE TABLE "RegulationCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Convention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "adoptionDate" DATETIME,
    "effectiveDate" DATETIME,
    "imoLink" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conventionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Chapter_conventionId_fkey" FOREIGN KEY ("conventionId") REFERENCES "Convention" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Regulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "keyPoints" TEXT,
    "applicableTo" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastAmended" DATETIME,
    "effectiveDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Regulation_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Regulation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RegulationCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegulationCrossRef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromRegulationId" TEXT NOT NULL,
    "toRegulationId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL DEFAULT 'related',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegulationCrossRef_fromRegulationId_fkey" FOREIGN KEY ("fromRegulationId") REFERENCES "Regulation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RegulationCrossRef_toRegulationId_fkey" FOREIGN KEY ("toRegulationId") REFERENCES "Regulation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RegulationCategory_name_key" ON "RegulationCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Convention_code_key" ON "Convention"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_conventionId_code_key" ON "Chapter"("conventionId", "code");

-- CreateIndex
CREATE INDEX "Regulation_categoryId_idx" ON "Regulation"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Regulation_chapterId_code_key" ON "Regulation"("chapterId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "RegulationCrossRef_fromRegulationId_toRegulationId_key" ON "RegulationCrossRef"("fromRegulationId", "toRegulationId");
