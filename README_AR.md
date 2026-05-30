# تشغيل النظام على السيرفر

هذا الملف يشرح طريقة تشغيل النظام على VPS باستخدام Docker Compose. النظام يتكون من:

- `client`: واجهة React يتم بناؤها وتشغيلها عبر Nginx.
- `api`: باك إند NestJS.
- `db`: قاعدة بيانات PostgreSQL مع volume دائم.

## المتطلبات

على السيرفر يجب توفر:

- Docker
- Docker Compose
- دومين يشير إلى عنوان السيرفر، إذا كان التشغيل النهائي عبر HTTPS

## تجهيز المشروع

ادخل إلى السيرفر ثم اجلب المشروع:

```bash
git clone <your-repository-url>
cd internalCommSystem
```

أو إذا كان المشروع موجوداً مسبقاً:

```bash
git pull
```

## إنشاء ملفات البيئة

أنشئ ملف البيئة الرئيسي:

```bash
cp .env.example .env
```

أنشئ ملف بيئة الباك إند:

```bash
cp server/.env.production.example server/.env.production
```

افتح الملفات وعدّل القيم:

```bash
nano .env
nano server/.env.production
```

مثال ملف `.env`:

```env
POSTGRES_USER=ics
POSTGRES_PASSWORD=change_me_db_password
POSTGRES_DB=icsdb
HTTP_PORT=80
VITE_API_BASE_URL=/api/v1
VITE_SOCKET_URL=
```

مثال أهم قيم `server/.env.production`:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://ics:change_me_db_password@db:5432/icsdb?schema=public
CORS_ORIGINS=https://your-domain.com
JWT_ACCESS_SECRET=ضع_سر_قوي_هنا
JWT_REFRESH_SECRET=ضع_سر_قوي_آخر_هنا
REFRESH_COOKIE_SECURE=true
```

يجب أن تكون بيانات قاعدة البيانات في `DATABASE_URL` مطابقة للقيم الموجودة في ملف `.env`.

مهم: داخل Docker نستخدم `db` كاسم السيرفر الخاص بقاعدة البيانات، وليس `localhost`.

## بناء وتشغيل الحاويات

ابنِ الصور:

```bash
docker compose build
```

شغّل النظام:

```bash
docker compose up -d
```

اعرض حالة الحاويات:

```bash
docker compose ps
```

اعرض السجلات:

```bash
docker compose logs -f api
docker compose logs -f client
docker compose logs -f db
```

عند تشغيل حاوية `api` يتم تنفيذ:

```bash
npx prisma migrate deploy
```

ثم يبدأ السيرفر بأمر الإنتاج:

```bash
npm run start:prod
```

## تشغيل seed مرة واحدة فقط

إذا كانت قاعدة البيانات جديدة وتحتاج بيانات أولية، شغّل seed يدوياً مرة واحدة:

```bash
docker compose exec api npx prisma db seed
```

لا تجعل seed يعمل تلقائياً مع كل إعادة تشغيل، حتى لا تتكرر البيانات أو تتغير بدون قصد.

## فتح النظام

إذا كان `HTTP_PORT=80`:

```text
http://server-ip
```

أو بعد ربط الدومين:

```text
https://your-domain.com
```

الواجهة تخدم المسارات التالية:

- `/`: تطبيق React.
- `/api/v1`: يتم تحويله إلى الباك إند.
- `/socket.io`: يتم تحويله إلى Socket.IO لدعم الشات والتحديثات المباشرة.

## إعداد HTTPS

في الإنتاج يفضل تشغيل النظام عبر HTTPS، خصوصاً لأن refresh token يستخدم cookie آمنة.

إذا كنت تستخدم Nginx على السيرفر نفسه مع Certbot:

1. اجعل Docker Compose يعمل على بورت داخلي مثل `8080`:

```env
HTTP_PORT=8080
```

2. اجعل Nginx الخارجي يستقبل `80` و `443`.
3. اجعل Nginx الخارجي يوجه الطلبات إلى:

```text
http://127.0.0.1:8080
```

4. تأكد أن إعداد WebSocket يحتوي على headers الخاصة بالترقية:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

5. استخدم Certbot لإصدار شهادة HTTPS للدومين.

في الإنتاج أبقِ:

```env
REFRESH_COOKIE_SECURE=true
```

إذا كنت تختبر محلياً فقط عبر HTTP يمكن جعلها مؤقتاً:

```env
REFRESH_COOKIE_SECURE=false
```

ثم أعدها إلى `true` قبل النشر النهائي.

## أوامر تشغيل مهمة

إعادة بناء وتشغيل بعد تحديث الكود:

```bash
docker compose build
docker compose up -d
```

إعادة تشغيل خدمة واحدة:

```bash
docker compose restart api
docker compose restart client
```

تشغيل migrations يدوياً:

```bash
docker compose exec api npx prisma migrate deploy
```

فتح PostgreSQL:

```bash
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

أخذ نسخة احتياطية:

```bash
docker compose exec db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backup.sql
```

استعادة نسخة احتياطية:

```bash
cat backup.sql | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

إيقاف النظام:

```bash
docker compose down
```

إيقاف النظام وحذف بيانات قاعدة البيانات:

```bash
docker compose down -v
```

استخدم `-v` بحذر لأنه يحذف volume الخاص بقاعدة البيانات.

