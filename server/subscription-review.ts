import { invokeLLM } from "./_core/llm";

export type ReceiptScreening = {
  verdict: "likely_valid" | "needs_review" | "likely_forged";
  confidence: number;
  notes: string;
};

export async function screenSubscriptionReceipt(input: { signedUrl: string; mimeType: string; amount: number; planLabel: string; destinationAccount: string; paymentKey: string }): Promise<ReceiptScreening> {
  const attachment = input.mimeType === "application/pdf"
    ? { type: "file_url" as const, file_url: { url: input.signedUrl, mime_type: "application/pdf" as const } }
    : { type: "image_url" as const, image_url: { url: input.signedUrl, detail: "high" as const } };
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "أنت أداة فحص أولي لإيصالات الدفع. لا تؤكد أبداً أن الوصل حقيقي بشكل قاطع؛ استخرج البيانات المرئية فقط، واعتبر النتيجة إشارة للمراجعة اليدوية. افحص وجود تناقضات واضحة مثل تعديل رقمي، قص غير طبيعي، خط غير متسق، أو عدم تطابق المبلغ والحساب. أخرج JSON فقط." },
        { role: "user", content: [
          { type: "text", text: `افحص هذا الوصل لفترة ${input.planLabel}. المبلغ المتوقع ${input.amount} دج. الحساب المستلم المفترض ${input.destinationAccount}. المفتاح المفترض ${input.paymentKey}. أرجع verdict من likely_valid أو needs_review أو likely_forged، وconfidence بين 0 و100، وملاحظات عربية قصيرة. حتى لو بدا الوصل صحيحاً اجعل التوصية بحاجة إلى مراجعة بشرية قبل التفعيل.` },
          attachment,
        ] },
      ],
      response_format: { type: "json_schema", json_schema: { name: "receipt_screening", strict: true, schema: { type: "object", properties: { verdict: { type: "string", enum: ["likely_valid", "needs_review", "likely_forged"] }, confidence: { type: "integer", minimum: 0, maximum: 100 }, notes: { type: "string" } }, required: ["verdict", "confidence", "notes"], additionalProperties: false } } },
      maxTokens: 700,
    });
    const raw = response.choices[0]?.message?.content;
    const text = typeof raw === "string" ? raw : JSON.stringify(raw);
    const parsed = JSON.parse(text) as ReceiptScreening;
    if (!["likely_valid", "needs_review", "likely_forged"].includes(parsed.verdict)) throw new Error("Invalid screening verdict");
    return { verdict: parsed.verdict, confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)), notes: String(parsed.notes || "لم يتمكن الفحص الآلي من إنتاج ملاحظات.") };
  } catch (error) {
    console.warn("[Subscription] Receipt screening unavailable; keeping manual review", error);
    return { verdict: "needs_review", confidence: 0, notes: "تعذر إكمال الفحص الآلي. يلزم التحقق اليدوي من الوصل قبل التفعيل." };
  }
}
