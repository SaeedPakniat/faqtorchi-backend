import { prisma } from "../../prisma/client";

export async function getSellerProfileIdOrThrow(userId: number): Promise<number> {
    const seller = await prisma.sellerProfile.findUnique({
        where: { userId },
        select: { id: true },
    });

    if (!seller) {
        throw Object.assign(new Error("Seller profile not found"), { status: 403 });
    }

    return seller.id;
}
