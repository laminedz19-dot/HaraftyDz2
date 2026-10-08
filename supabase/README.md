# Supabase — HaraftyDz2

هذا المجلد مربوط بمشروع Supabase:

- **Project name:** HaraftyDz2
- **Project ref:** `dotmoiorzpowzwlyapbr`
- **API URL:** `https://dotmoiorzpowzwlyapbr.supabase.co`
- **الحالة عند الربط:** ACTIVE_HEALTHY
- **المنطقة:** ap-northeast-2

تم التحقق قبل الربط من أن migration `0001_core_schema` مطبّقة، وأن جداولها الأساسية موجودة وRLS مفعّل عليها. لذلك لم تُنفّذ أي migration إضافية ولم تُعدّل أي بيانات.

## إعداد التطبيقات محليًا

ضع القيم في `local.properties` أو متغيرات بيئة محلية، ولا تضع مفاتيح سرية في Git:

```properties
SUPABASE_URL=https://dotmoiorzpowzwlyapbr.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

يُسمح بتضمين publishable/anon key في تطبيقات العميل، لكن يُمنع تمامًا تضمين `service_role` أو أي مفتاح إداري في APK.

## طبقة الاتصال في Android

كل تطبيق يحتوي على `SupabaseConfig` و`SupabaseClientProvider` ويثبت وحدات Auth وPostgREST وStorage وRealtime. يعتمد البناء على `SUPABASE_URL` و`SUPABASE_PUBLISHABLE_KEY` من `local.properties` أو متغيرات البيئة.
