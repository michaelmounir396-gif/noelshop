# Noël Shop

واجهة React مع خادم Express/tRPC وقاعدة PostgreSQL عبر Drizzle.

- `pnpm dev`: تشغيل التطوير المحلي على المنفذ `3000` افتراضيًا.
- `pnpm build` / `pnpm start`: بناء المشروع وتشغيله محليًا.
- `pnpm db:generate`: إنشاء ترحيل PostgreSQL جديد من تغييرات المخطط.
- `pnpm db:migrate`: تطبيق الترحيلات الموجودة في `drizzle/postgres`.
- `pnpm check`: فحص TypeScript.

`vercel.json` يضبط بناء الواجهة الثابتة، بينما `api/[...path].ts` يمرر مسارات API إلى Express. متغيرات الأسرار لا تُرسل إلى المتصفح.

## النشر على Vercel مع Supabase

### ربط Supabase من Vercel

من لوحة Vercel افتح **Marketplace**، اختر **Supabase** ثم **Install**، واربطه بفريقك ومشروع Vercel. تكامل Marketplace ينشئ مشروع Supabase ويزامن متغيرات الاتصال تلقائيًا إلى مشروع Vercel. يستخدم التطبيق `POSTGRES_URL` وقت التشغيل؛ أما ملف Drizzle migrations فيفضّل `POSTGRES_URL_NON_POOLING` إذا كان متاحًا. يظل `DATABASE_URL` مقبولًا للتطوير المحلي أو الإعداد اليدوي.

### إنشاء الجداول

بعد ربط التكامل، اسحب متغيرات Vercel إلى نسخة العمل المحلية أو أضف عنوان اتصال PostgreSQL محليًا في `.env`. للترحيلات استخدم عنوان الاتصال المباشر غير pooled إن توفر، ثم شغّل مرة واحدة:

```bash
pnpm db:migrate
```

لا تستخدم ملفات SQL القديمة في `drizzle/mysql-legacy/`؛ هذه ترحيلات MySQL الأصلية. الترحيلات المتوافقة مع Supabase موجودة في `drizzle/postgres/`. الترحيل الأول ينشئ جداول `users` و`products` و`siteSettings` و`orders` ويضيف المنتج وإعدادات الصفحة الافتراضية. إذا تغيّر المخطط لاحقًا، شغّل `pnpm db:generate` لمراجعة ترحيل جديد ثم `pnpm db:migrate` لتطبيقه.

### متغيرات المشروع

بعد تثبيت Supabase من Vercel، تأكد من وجود `POSTGRES_URL` و`POSTGRES_URL_NON_POOLING` في إعدادات البيئة المطلوبة. يمكن إضافة متغير `DATABASE_URL` محليًا فقط بدلًا منهما. لا تضع أي connection string في كود الواجهة أو متغير يبدأ بـ`VITE_`.

أضف أيضًا أسرار مدير المتجر (`NOEL_ADMIN_EMAIL`، `NOEL_ADMIN_PASSWORD_SALT`، `NOEL_ADMIN_PASSWORD_HASH`، `NOEL_ADMIN_SESSION_SECRET`). أنشئ الملح والبصمة بكلمة مرور تختارها باستخدام:

```bash
node scripts/hash-admin-password.mjs
```

أضف القيم الناتجة إلى Vercel Environment Variables ولا ترفعها إلى Git. من دون هذه الإعدادات يظل تسجيل دخول الإدارة المحلية مغلقًا.

رفع الصور والفيديو يستخدم مخزن S3-compatible معتمدًا منفصلًا (مثل AWS S3 أو Cloudflare R2)، وليس Supabase Database. أضف قيم `S3_BUCKET` و`S3_REGION` و`S3_ACCESS_KEY_ID` و`S3_SECRET_ACCESS_KEY` و`S3_PUBLIC_URL`، وكذلك `S3_ENDPOINT` عند الحاجة. اضبط CORS للمخزن ليسمح برفع `PUT` وheader `Content-Type` من نطاق موقعك، واجعل الملفات قابلة للقراءة عبر `S3_PUBLIC_URL` أو CDN.

أضف أي متغيرات `MANUS_*` فقط إذا كنت تستخدم تسجيل Manus OAuth. تغييرات Environment Variables في Vercel تتطلب إعادة نشر لتصبح فعالة. بعد الإعداد، اختبر `/api/health`، وتسجيل الدخول، وإنشاء طلب تجريبي.
