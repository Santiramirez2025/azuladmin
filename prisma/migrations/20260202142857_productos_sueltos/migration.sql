-- DropForeignKey
ALTER TABLE "document_items" DROP CONSTRAINT "document_items_variantId_fkey";

-- AlterTable
ALTER TABLE "document_items" ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "variantId" DROP NOT NULL,
ALTER COLUMN "source" SET DEFAULT 'CATALOGO';

-- AddForeignKey
ALTER TABLE "document_items" ADD CONSTRAINT "document_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
