import { prisma } from "../../prisma/client";

export async function getSellerProfileIdOrThrow(userId: number): Promise<number> {
    const seller = await prisma.sellerProfile.findUnique({
        where: { userId },
        select: { id: true },
    });

    if (seller) {
        return seller.id;
    }

    const member = await prisma.sellerMember.findUnique({
        where: { userId },
        include: { user: { select: { isActive: true, role: true } } },
    });

    if (!member || !member.isActive || !member.user.isActive || member.user.role !== "ADMIN") {
        throw Object.assign(new Error("Seller profile not found"), { status: 403 });
    }

    return member.sellerId;
}

export async function getSellerProfileIdForOwner(userId: number): Promise<number> {
    const seller = await prisma.sellerProfile.findUnique({
        where: { userId },
        select: { id: true },
    });

    if (!seller) {
        throw Object.assign(new Error("Seller profile not found"), { status: 403 });
    }

    return seller.id;
}
