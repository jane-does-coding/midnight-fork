CREATE TABLE "sticker_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "rsvpNumber" INTEGER NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sticker_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sticker_tokens_token_key" ON "sticker_tokens"("token");
CREATE INDEX "sticker_tokens_token_idx" ON "sticker_tokens"("token");
CREATE INDEX "sticker_tokens_email_idx" ON "sticker_tokens"("email");

CREATE TABLE "hackatime_link_otps" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "otp_code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hackatime_link_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hackatime_link_otps_user_id_idx" ON "hackatime_link_otps"("user_id");
CREATE INDEX "hackatime_link_otps_otp_code_idx" ON "hackatime_link_otps"("otp_code");

ALTER TABLE "hackatime_link_otps" ADD CONSTRAINT "hackatime_link_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;


