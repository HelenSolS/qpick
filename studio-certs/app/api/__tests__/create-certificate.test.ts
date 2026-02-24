import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateCertificate = vi.fn();
const mockGetTariffPriceCents = vi.fn();
const mockRecordCertificatePayment = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/certificate", () => ({
  createCertificate: (...args: unknown[]) => mockCreateCertificate(...args),
  getTariffPriceCents: (...args: unknown[]) => mockGetTariffPriceCents(...args),
  recordCertificatePayment: (...args: unknown[]) => mockRecordCertificatePayment(...args),
}));

describe("POST /api/create-certificate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when body is invalid (missing required fields)", async () => {
    const { POST } = await import("../create-certificate/route");
    const req = new Request("http://localhost/api/create-certificate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    expect(mockCreateCertificate).not.toHaveBeenCalled();
  });

  it("returns 400 when tariff_id is invalid", async () => {
    mockCreateCertificate.mockRejectedValueOnce(new Error("INVALID_TARIFF"));
    const { POST } = await import("../create-certificate/route");
    const req = new Request("http://localhost/api/create-certificate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_id: "123",
        tariff_id: 999,
        design_id: 1,
        city_id: 1,
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("INVALID_TARIFF");
  });

  it("returns 200 and certificate when createCertificate succeeds (no recipient/greeting)", async () => {
    mockGetTariffPriceCents.mockResolvedValueOnce(300000);
    mockCreateCertificate.mockResolvedValueOnce({
      id: 1,
      code: "QPIC-ABCD-1234",
      recipient_name: null,
      greeting: null,
      status: "ACTIVE",
      expires_at: new Date(),
      created_at: new Date(),
    });
    const { POST } = await import("../create-certificate/route");
    const req = new Request("http://localhost/api/create-certificate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_id: "123",
        tariff_id: 1,
        design_id: 1,
        city_id: 1,
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.code).toBe("QPIC-ABCD-1234");
    expect(mockCreateCertificate).toHaveBeenCalledWith(
      expect.objectContaining({
        telegram_id: "123",
        tariff_id: 1,
        design_id: 1,
        city_id: 1,
      })
    );
  });
});
