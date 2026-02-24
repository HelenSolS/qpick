import { NextRequest, NextResponse } from "next/server";
import { getCertificateForPdf } from "@/lib/certificate";
import PDFDocument from "pdfkit";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code || !code.trim()) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }
    const data = await getCertificateForPdf(code);
    if (!data) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    doc.fontSize(20).text("Подарочный сертификат", { align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(12);
    doc.text(`Код: ${data.code}`, { continued: false });
    doc.text(`Тариф: ${data.tariff_name}`);
    doc.text(`Сумма: ${(data.amount_cents / 100).toFixed(0)} ₽`);
    doc.moveDown(1);
    doc.text(`Оплатил (Telegram ID): ${data.payer_telegram_id || "—"}`);
    doc.text(`Дата оплаты: ${new Date(data.paid_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}`);
    doc.moveDown(2);
    doc.text(`Подпись: ${data.city_name}`, { align: "right" });
    doc.end();

    const pdfBuffer = await done;
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${data.code.replace(/\s/g, "-")}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("[certificate/pdf]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
