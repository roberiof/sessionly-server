CREATE UNIQUE INDEX "User_email_active_unique" ON "User"(email) WHERE "deletedAt" IS NULL;
