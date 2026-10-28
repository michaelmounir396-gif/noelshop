import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router, adminProcedure } from "./_core/trpc.js";
import { createOrder, createProduct, getActiveProduct, getSiteSettings, listOrders, listProducts, updateOrderStatus, updateProduct, updateSiteSettings } from "./db.js";
import { clearLocalAdminSession, setLocalAdminSession, verifyLocalCredentials } from "./_core/localAuth.js";
import { storageCreateUpload } from "./storage.js";

const FALLBACK_PRODUCT = { name: "صندوق ليلة العيد", eyebrow: "هدية Noel الموسمية", price: 799, oldPrice: 999, description: "تفصيلة دافئة، مغلّفة بعناية، وتوصل إحساس العيد من أول لحظة.", stock: 24 };
const FALLBACK_SETTINGS = { announcement: "شحن مجاني للطلبات المؤكدة قبل 15 ديسمبر", heroKicker: "مجموعة شتاء 2026", heroTitle: "خلّي الهدية", heroAccent: "توصل قبل الكلام.", heroDescription: "صندوق ليلة العيد معمول للحظات اللي تستاهل تتغلف بحب — قطعة واحدة، وإحساس كبير.", popupEnabled: 1, popupTitle: "لحظة حلوة\nتستاهل تتعاش.", popupDescription: "مجموعة شوكولاتة دافئة للحظات القريبة.", productImageUrl: "/product-noel.jpg", bannerVideoUrl: "/noel-product-banner.mp4" };
const statusSchema = z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]);
const productInput = z.object({ name: z.string().trim().min(2).max(160), eyebrow: z.string().trim().min(2).max(160), price: z.number().int().positive(), oldPrice: z.number().int().positive().nullable().optional(), description: z.string().trim().min(10).max(2000), stock: z.number().int().min(0).max(100000), active: z.boolean().optional() });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    localLogin: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(1).max(200) })).mutation(({ input, ctx }) => { if (!verifyLocalCredentials(input.email, input.password)) throw new TRPCError({ code: "UNAUTHORIZED", message: "البريد أو كلمة المرور غير صحيحة" }); setLocalAdminSession(ctx.res, ctx.req); return { success: true } as const; }),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); clearLocalAdminSession(ctx.res, ctx.req); return { success: true } as const; }),
  }),
  product: router({
    summary: publicProcedure.query(async () => (await getActiveProduct()) ?? FALLBACK_PRODUCT),
  }),
  settings: router({
    public: publicProcedure.query(async () => (await getSiteSettings()) ?? FALLBACK_SETTINGS),
    get: adminProcedure.query(async () => (await getSiteSettings()) ?? FALLBACK_SETTINGS),
    update: adminProcedure.input(z.object({ announcement: z.string().trim().min(2).max(255), heroKicker: z.string().trim().min(2).max(160), heroTitle: z.string().trim().min(2).max(255), heroAccent: z.string().trim().min(2).max(255), heroDescription: z.string().trim().min(10).max(1000), popupEnabled: z.boolean(), popupTitle: z.string().trim().min(2).max(255), popupDescription: z.string().trim().min(2).max(500), productImageUrl: z.string().min(1).max(1000), bannerVideoUrl: z.string().min(1).max(1000) })).mutation(({ input }) => updateSiteSettings({ ...input, popupEnabled: input.popupEnabled ? 1 : 0 })),
  }),
  media: router({
    createUpload: adminProcedure.input(z.object({ kind: z.enum(["image", "video"]), fileName: z.string().trim().min(1).max(180), mimeType: z.string().regex(/^(image\/(jpeg|png|webp)|video\/mp4)$/) })).mutation(async ({ input }) => {
      if ((input.kind === "image" && !input.mimeType.startsWith("image/")) || (input.kind === "video" && input.mimeType !== "video/mp4")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "نوع الملف لا يتوافق مع التصنيف" });
      }
      const safeName = input.fileName.split(/[\\/]/).pop()!.replace(/[^a-zA-Z0-9._-]/g, "_");
      return storageCreateUpload(`noel/${input.kind}/${safeName}`, input.mimeType);
    }),
  }),
  products: router({
    list: adminProcedure.query(() => listProducts()),
    create: adminProcedure.input(productInput).mutation(({ input }) => createProduct({ ...input, oldPrice: input.oldPrice ?? null, active: input.active === false ? 0 : 1 })),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), data: productInput.partial() })).mutation(({ input }) => updateProduct(input.id, { ...input.data, active: input.data.active === undefined ? undefined : input.data.active ? 1 : 0 })),
  }),
  orders: router({
    create: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(160), phone: z.string().trim().min(8).max(32), address: z.string().trim().min(8).max(1000), note: z.string().trim().max(500).optional().default(""), quantity: z.number().int().min(1).max(10) })).mutation(async ({ input }) => { const product = await getActiveProduct(); const data = product ?? { ...FALLBACK_PRODUCT, id: 0 }; const orderNumber = `NOEL-${Date.now().toString().slice(-8)}`; await createOrder({ orderNumber, customerName: input.name, phone: input.phone, address: input.address, note: input.note, productName: data.name, quantity: input.quantity, unitPrice: data.price, total: data.price * input.quantity, status: "pending" }); return { orderNumber, total: data.price * input.quantity }; }),
    list: adminProcedure.query(() => listOrders()),
    updateStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: statusSchema })).mutation(({ input }) => updateOrderStatus(input.id, input.status)),
    createAdmin: adminProcedure.input(z.object({ name: z.string().trim().min(2).max(160), phone: z.string().trim().min(8).max(32), address: z.string().trim().min(8).max(1000), note: z.string().trim().max(500).optional(), productName: z.string().trim().min(2), quantity: z.number().int().min(1).max(100), unitPrice: z.number().int().positive(), status: statusSchema.default("pending") })).mutation(async ({ input }) => { const orderNumber = `NOEL-${Date.now().toString().slice(-8)}`; await createOrder({ orderNumber, customerName: input.name, phone: input.phone, address: input.address, note: input.note ?? "", productName: input.productName, quantity: input.quantity, unitPrice: input.unitPrice, total: input.quantity * input.unitPrice, status: input.status }); return { orderNumber }; }),
  }),
});
export type AppRouter = typeof appRouter;
