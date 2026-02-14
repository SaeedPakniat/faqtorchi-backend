import { prisma } from "../../prisma/client";
import type { Prisma } from "@prisma/client";
import { hashPassword } from "../common/security/password";
import type { CreateSellerMemberInput, SellerPermissionsInput, SetSellerMemberPasswordInput, UpdateSellerMemberInput } from "./sellerMember.schemas";

export type SellerPermissions = {
    invoices: boolean;
    customers: boolean;
    products: boolean;
    settings: boolean;
    warehouse: boolean;
    reports: boolean;
};

export type SellerContext = {
    sellerId: number;
    isOwner: boolean;
    memberId?: number;
    permissions?: SellerPermissions;
    warehouseIds?: number[];
};

function toPermissions(member: {
    canInvoices: boolean;
    canCustomers: boolean;
    canProducts: boolean;
    canSettings: boolean;
    canWarehouse: boolean;
    canReports: boolean;
}): SellerPermissions {
    return {
        invoices: member.canInvoices,
        customers: member.canCustomers,
        products: member.canProducts,
        settings: member.canSettings,
        warehouse: member.canWarehouse,
        reports: member.canReports,
    };
}

function mapMember(member: {
    id: number;
    sellerId: number;
    userId: number;
    isActive: boolean;
    canInvoices: boolean;
    canCustomers: boolean;
    canProducts: boolean;
    canSettings: boolean;
    canWarehouse: boolean;
    canReports: boolean;
    user: { id: number; phone: string; email: string | null; name: string | null; isActive: boolean };
    warehouses: { warehouseId: number }[];
}) {
    return {
        id: member.id,
        sellerId: member.sellerId,
        userId: member.userId,
        name: member.user.name,
        phone: member.user.phone,
        email: member.user.email,
        isActive: member.isActive && member.user.isActive,
        permissions: toPermissions(member),
        warehouseIds: member.warehouses.map((w: { warehouseId: number }) => w.warehouseId),
    };
}

export async function getSellerContextOrThrow(userId: number): Promise<SellerContext> {
    const seller = await prisma.sellerProfile.findUnique({
        where: { userId },
        select: { id: true },
    });

    if (seller) {
        return { sellerId: seller.id, isOwner: true };
    }

    const member = await prisma.sellerMember.findUnique({
        where: { userId },
        include: {
            user: { select: { isActive: true, role: true } },
            warehouses: { select: { warehouseId: true } },
        },
    });

    if (!member || !member.isActive || !member.user.isActive || member.user.role !== "ADMIN") {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    return {
        sellerId: member.sellerId,
        isOwner: false,
        memberId: member.id,
        permissions: toPermissions(member),
        warehouseIds: member.warehouses.map((w) => w.warehouseId),
    };
}

export async function assertSellerPermission(userId: number, permission: keyof SellerPermissions) {
    const ctx = await getSellerContextOrThrow(userId);
    if (ctx.isOwner) return ctx;

    if (!ctx.permissions?.[permission]) {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    return ctx;
}

export async function assertWarehouseAccess(userId: number, warehouseId: number) {
    const ctx = await getSellerContextOrThrow(userId);
    if (ctx.isOwner) return ctx;

    if (!ctx.permissions?.warehouse) {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    if (!ctx.warehouseIds?.includes(warehouseId)) {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    return ctx;
}

async function validateWarehouses(sellerId: number, warehouseIds: number[]) {
    if (warehouseIds.length === 0) return;
    const count = await prisma.warehouse.count({
        where: { id: { in: warehouseIds }, sellerId },
    });
    if (count !== warehouseIds.length) {
        throw Object.assign(new Error("Invalid warehouse selection"), { status: 400 });
    }
}

export async function listSellerMembers(sellerId: number) {
    const members = await prisma.sellerMember.findMany({
        where: { sellerId },
        orderBy: { id: "desc" },
        include: {
            user: { select: { id: true, phone: true, email: true, name: true, isActive: true } },
            warehouses: { select: { warehouseId: true } },
        },
    });

    return { members: members.map(mapMember) };
}

export async function getSellerMemberById(params: { sellerId: number; memberId: number }) {
    const member = await prisma.sellerMember.findFirst({
        where: { id: params.memberId, sellerId: params.sellerId },
        include: {
            user: { select: { id: true, phone: true, email: true, name: true, isActive: true } },
            warehouses: { select: { warehouseId: true } },
        },
    });

    if (!member) {
        throw Object.assign(new Error("Not found"), { status: 404 });
    }

    return { member: mapMember(member) };
}

export async function createSellerMember(params: { sellerId: number; input: CreateSellerMemberInput }) {
    await validateWarehouses(params.sellerId, params.input.warehouseIds ?? []);

    const passwordHash = await hashPassword(params.input.password);

    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                phone: params.input.phone,
                email: params.input.email ?? null,
                name: params.input.name,
                passwordHash,
                role: "ADMIN",
                isActive: params.input.isActive ?? true,
            },
            select: { id: true },
        });

        const member = await tx.sellerMember.create({
            data: {
                sellerId: params.sellerId,
                userId: user.id,
                isActive: params.input.isActive ?? true,
                canInvoices: params.input.permissions.invoices,
                canCustomers: params.input.permissions.customers,
                canProducts: params.input.permissions.products,
                canSettings: params.input.permissions.settings,
                canWarehouse: params.input.permissions.warehouse,
                canReports: params.input.permissions.reports,
                warehouses:
                    params.input.warehouseIds && params.input.warehouseIds.length > 0
                        ? {
                              createMany: {
                                  data: params.input.warehouseIds.map((warehouseId) => ({
                                      warehouseId,
                                  })),
                              },
                          }
                        : undefined,
            },
            include: {
                user: { select: { id: true, phone: true, email: true, name: true, isActive: true } },
                warehouses: { select: { warehouseId: true } },
            },
        });

        return member;
    });

    return { member: mapMember(result) };
}

export async function updateSellerMember(params: { sellerId: number; memberId: number; input: UpdateSellerMemberInput }) {
    const member = await prisma.sellerMember.findFirst({
        where: { id: params.memberId, sellerId: params.sellerId },
        include: {
            user: { select: { id: true, phone: true, email: true, name: true, isActive: true } },
            warehouses: { select: { warehouseId: true } },
        },
    });

    if (!member) {
        throw Object.assign(new Error("Not found"), { status: 404 });
    }

    if (params.input.warehouseIds) {
        await validateWarehouses(params.sellerId, params.input.warehouseIds);
    }

    const permissionUpdates: Partial<Record<keyof SellerPermissions, boolean>> = {};
    if (params.input.permissions) {
        if (params.input.permissions.invoices !== undefined) permissionUpdates.invoices = params.input.permissions.invoices;
        if (params.input.permissions.customers !== undefined) permissionUpdates.customers = params.input.permissions.customers;
        if (params.input.permissions.products !== undefined) permissionUpdates.products = params.input.permissions.products;
        if (params.input.permissions.settings !== undefined) permissionUpdates.settings = params.input.permissions.settings;
        if (params.input.permissions.warehouse !== undefined) permissionUpdates.warehouse = params.input.permissions.warehouse;
        if (params.input.permissions.reports !== undefined) permissionUpdates.reports = params.input.permissions.reports;
    }

    const updated = await prisma.$transaction(async (tx) => {
        if (
            params.input.name !== undefined ||
            params.input.phone !== undefined ||
            params.input.email !== undefined ||
            params.input.isActive !== undefined
        ) {
            await tx.user.update({
                where: { id: member.userId },
                data: {
                    name: params.input.name ?? undefined,
                    phone: params.input.phone ?? undefined,
                    email: params.input.email === undefined ? undefined : params.input.email,
                    isActive: params.input.isActive ?? undefined,
                },
            });
        }

        const memberData: any = {};
        if (params.input.isActive !== undefined) memberData.isActive = params.input.isActive;
        if (permissionUpdates.invoices !== undefined) memberData.canInvoices = permissionUpdates.invoices;
        if (permissionUpdates.customers !== undefined) memberData.canCustomers = permissionUpdates.customers;
        if (permissionUpdates.products !== undefined) memberData.canProducts = permissionUpdates.products;
        if (permissionUpdates.settings !== undefined) memberData.canSettings = permissionUpdates.settings;
        if (permissionUpdates.warehouse !== undefined) memberData.canWarehouse = permissionUpdates.warehouse;
        if (permissionUpdates.reports !== undefined) memberData.canReports = permissionUpdates.reports;

        if (Object.keys(memberData).length > 0) {
            await tx.sellerMember.update({
                where: { id: member.id },
                data: memberData,
            });
        }

        if (params.input.warehouseIds) {
            await tx.sellerMemberWarehouse.deleteMany({ where: { sellerMemberId: member.id } });
            if (params.input.warehouseIds.length > 0) {
                await tx.sellerMemberWarehouse.createMany({
                    data: params.input.warehouseIds.map((warehouseId) => ({
                        sellerMemberId: member.id,
                        warehouseId,
                    })),
                });
            }
        }

        const refreshed = await tx.sellerMember.findFirstOrThrow({
            where: { id: member.id },
            include: {
                user: { select: { id: true, phone: true, email: true, name: true, isActive: true } },
                warehouses: { select: { warehouseId: true } },
            },
        });

        return refreshed;
    });

    return { member: mapMember(updated) };
}

export async function setSellerMemberPassword(params: { sellerId: number; memberId: number; input: SetSellerMemberPasswordInput }) {
    const member = await prisma.sellerMember.findFirst({
        where: { id: params.memberId, sellerId: params.sellerId },
        select: { userId: true },
    });

    if (!member) {
        throw Object.assign(new Error("Not found"), { status: 404 });
    }

    const passwordHash = await hashPassword(params.input.password);
    await prisma.user.update({
        where: { id: member.userId },
        data: { passwordHash },
    });

    return { ok: true };
}

export async function recordSellerMemberAudit(params: {
    sellerId: number;
    memberId: number;
    userId: number;
    action: string;
    method: string;
    path: string;
    statusCode?: number;
    ipAddress?: string;
    userAgent?: string;
    meta?: Prisma.InputJsonValue | null;
}) {
    await prisma.sellerMemberAuditLog.create({
        data: {
            sellerId: params.sellerId,
            memberId: params.memberId,
            userId: params.userId,
            action: params.action,
            method: params.method,
            path: params.path,
            statusCode: params.statusCode ?? null,
            ipAddress: params.ipAddress ?? null,
            userAgent: params.userAgent ?? null,
            meta: params.meta ?? undefined,
        },
    });
}

export async function listSellerMemberAuditLogs(params: { sellerId: number; memberId: number; page: number; pageSize: number }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
        prisma.sellerMemberAuditLog.findMany({
            where: { sellerId: params.sellerId, memberId: params.memberId },
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
        }),
        prisma.sellerMemberAuditLog.count({
            where: { sellerId: params.sellerId, memberId: params.memberId },
        }),
    ]);

    return { page, pageSize, total, logs };
}
