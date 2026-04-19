-- DropIndex
DROP INDEX "Application_email_idx";

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "telegram" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CandidateTag" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'other';

-- CreateTable
CREATE TABLE "TelegramChat" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "telegramChatId" TEXT,
    "telegramUsername" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "fromAdmin" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramChat_applicationId_key" ON "TelegramChat"("applicationId");

-- CreateIndex
CREATE INDEX "ChatMessage_applicationId_idx" ON "ChatMessage"("applicationId");

-- AddForeignKey
ALTER TABLE "TelegramChat" ADD CONSTRAINT "TelegramChat_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
