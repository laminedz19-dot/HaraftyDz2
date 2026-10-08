# payment-webhook

Edge Function تستقبل تأكيدات الدفع من مزود خارجي وتكتب المعاملات المكتملة في `financial_transactions`.

## الأسرار المطلوبة

اضبط الأسرار من Supabase Dashboard أو CLI، ولا تضعها في Git:

- `PAYMENT_WEBHOOK_SECRET`: السر المشترك مع مزود الدفع.
- `SUPABASE_SERVICE_ROLE_KEY`: مفتاح الخادم فقط؛ لا يُضمّن في أي APK.
- `SUPABASE_URL`: يضبطه Supabase عادة تلقائيًا.

## التوقيع

أرسل مزود الدفع:

- `x-payment-timestamp`: Unix timestamp بالثواني.
- `x-payment-signature`: Base64 لـ HMAC-SHA256 على النص:
  `<timestamp>.<raw-json-body>`.

تُرفض الطلبات الأقدم من 5 دقائق لتقليل replay attacks.

## الحدث المدعوم

```json
{
  "type": "payment.succeeded",
  "data": {
    "provider_reference": "gateway-tx-123",
    "amount": 2500.00,
    "currency": "DZD",
    "transaction_type": "service_payment",
    "request_id": "optional-uuid",
    "payer_id": "optional-user-uuid",
    "artisan_id": "optional-artisan-uuid"
  }
}
```

الإدخال idempotent عبر `provider_reference` الفريد. الوظيفة لا تنفذ خصمًا أو تحويلًا ماليًا بذاتها؛ الدفع يتم عند مزود الدفع، وهذه الوظيفة تعالج تأكيده الموقّع فقط.
