# HaraftyDz

منصة حرفتي DZ مكوّنة من تطبيقين Android مستقلين:

- `client-app`: تطبيق الزبائن والحرفيين (`dz.harafty.client`)
- `admin-app`: تطبيق الإدارة (`dz.harafty.admin`)

> هذه نقطة البداية الجديدة بعد حذف محتوى المشروع السابق من الفرع `main`. لا تحتوي المستودعات على أسرار إنتاج أو مفاتيح `service_role`.

## Supabase

المستودع مربوط بمشروع Supabase `HaraftyDz2` عبر [supabase/config.toml](supabase/config.toml). راجع [توثيق الربط](supabase/README.md).

## إعداد اتصال التطبيقات بـ Supabase

انسخ `local.properties.example` إلى `local.properties` محليًا، ثم ضع `SUPABASE_PUBLISHABLE_KEY`. تُحوّل القيم أثناء البناء إلى `BuildConfig` في كل تطبيق. لا تستخدم `service_role` ولا تلتزم بملف `local.properties`.
