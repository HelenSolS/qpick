import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindOrCreateClient = vi.fn();
vi.mock("@/lib/db", () => ({
  getDb: vi.fn(),
}));
vi.mock("@/lib/certificate", () => ({
  findOrCreateClient: (...args: unknown[]) => mockFindOrCreateClient(...args),
}));

describe("findOrCreateClient (identify-client behaviour)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("identify-client API returns 400 when telegram_id is missing", async () => {
    const { POST } = await import("@/app/api/identify-client/route");
    const req = new Request("http://localhost/api/identify-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    expect(mockFindOrCreateClient).not.toHaveBeenCalled();
  });

  it("identify-client API returns client when telegram_id provided (reuse same id)", async () => {
    const client = {
      id: 1,
      telegram_id: "12345",
      created_at: new Date("2024-01-01"),
    };
    mockFindOrCreateClient.mockResolvedValueOnce(client);
    const { POST } = await import("@/app/api/identify-client/route");
    const req = new Request("http://localhost/api/identify-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: "12345" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockFindOrCreateClient).toHaveBeenCalledWith("12345");
    const data = await res.json();
    expect(data.id).toBe(1);
    expect(data.telegram_id).toBe("12345");
  });
});
