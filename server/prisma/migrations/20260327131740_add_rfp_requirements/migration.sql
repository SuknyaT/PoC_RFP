-- CreateTable
CREATE TABLE "rfp_requirements" (
    "id" TEXT NOT NULL,
    "rfp_id" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfp_requirements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rfp_requirements" ADD CONSTRAINT "rfp_requirements_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "rfps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
