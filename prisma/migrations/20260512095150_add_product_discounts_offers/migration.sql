-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountValue" DECIMAL(65,30),
ADD COLUMN     "offerEndDate" TIMESTAMP(3),
ADD COLUMN     "offerStartDate" TIMESTAMP(3);
