-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" SERIAL NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "slotId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "industries" TEXT NOT NULL,
    "expectedSalary" TEXT,
    "painPoints" TEXT NOT NULL,
    "workFormats" TEXT NOT NULL,
    "willingToRelocate" BOOLEAN NOT NULL DEFAULT false,
    "relocateTo" TEXT,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "paymentLink" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "technicalSkills" TEXT,
    "softSkills" TEXT,
    "languages" TEXT,
    "industryExp" TEXT,
    "interviewNotes" TEXT,
    "overallRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateTag" (
    "id" SERIAL NOT NULL,
    "tag" TEXT NOT NULL,
    "profileId" INTEGER NOT NULL,

    CONSTRAINT "CandidateTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE INDEX "TimeSlot_startsAt_idx" ON "TimeSlot"("startsAt");

-- CreateIndex
CREATE INDEX "TimeSlot_isAvailable_idx" ON "TimeSlot"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "Application_slotId_key" ON "Application"("slotId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_email_idx" ON "Application"("email");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_applicationId_key" ON "CandidateProfile"("applicationId");

-- CreateIndex
CREATE INDEX "CandidateTag_tag_idx" ON "CandidateTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateTag_profileId_tag_key" ON "CandidateTag"("profileId", "tag");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateTag" ADD CONSTRAINT "CandidateTag_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
