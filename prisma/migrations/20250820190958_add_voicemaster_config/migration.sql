-- CreateTable
CREATE TABLE "voicemaster_configs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildId" TEXT NOT NULL,
    "joinChannelId" TEXT NOT NULL,
    "categoryId" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "voicemaster_configs_guildId_key" ON "voicemaster_configs"("guildId");
