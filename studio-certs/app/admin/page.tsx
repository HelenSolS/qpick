"use client";

import { useState, useEffect, useCallback } from "react";

const ADMIN_KEY_STORAGE = "studio_certs_admin_key";

type CertRow = {
  id: number;
  code: string;
  city_name: string;
  tariff_name: string;
  amount_cents: number;
  status: string;
  created_at: string;
  payer_name: string | null;
  payer_phone: string;
  payer_telegram_id: string | null;
  payer_email: string | null;
  source: "telegram" | "web";
};

function maskCode(code: string): string {
  if (!code || code.length < 8) return "****";
  const parts = code.split("-");
  if (parts.length >= 3) {
    return `${"*".repeat(Math.min(4, parts[0].length))}-${"*".repeat(4)}-${"*".repeat(4)}`;
  }
  return code.replace(/./g, "*");
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [list, setList] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE);
      if (stored) setSavedKey(stored);
    }
  }, []);

  const fetchList = useCallback(async () => {
    const key = savedKey ?? adminKey;
    if (!key.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (sort) params.set("sort", sort);
      params.set("order", order);
      const res = await fetch(`/api/admin/certificates?${params}`, {
        headers: { "x-admin-key": key },
      });
      if (res.status === 401) {
        setError("Неверный ключ доступа");
        setList([]);
        return;
      }
      if (!res.ok) {
        setError("Ошибка загрузки");
        return;
      }
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setError("Ошибка загрузки");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [savedKey, adminKey, search, sort, order]);

  useEffect(() => {
    if (savedKey) fetchList();
  }, [savedKey, sort, order, fetchList]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const key = adminKey.trim();
    if (!key) return;
    sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
    setSavedKey(key);
    setAdminKey("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setSavedKey(null);
    setList([]);
  };

  const toggleReveal = (id: number) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const payerDisplay = (row: CertRow) => {
    if (row.source === "telegram") {
      return (
        <>
          {row.payer_name && <span>{row.payer_name} </span>}
          <span className="text-stone-500">TG: {row.payer_telegram_id ?? "—"}</span>
        </>
      );
    }
    return (
      <>
        {row.payer_name && <span>{row.payer_name} </span>}
        <span className="text-stone-500">{row.payer_phone}</span>
        {row.payer_email && <span className="text-stone-500"> · {row.payer_email}</span>}
      </>
    );
  };

  if (!savedKey) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-6 text-xl font-semibold text-stone-800">Вход для администратора</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="admin_key" className="block text-sm font-medium text-stone-600">
              Ключ доступа
            </label>
            <input
              id="admin_key"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              placeholder="Введите ключ"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="w-full min-h-[44px] rounded-lg bg-stone-800 px-4 py-2 text-white">
            Войти
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-stone-800">Сертификаты (админ)</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-600"
        >
          Выйти
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchList()}
          placeholder="Поиск по коду, городу, ФИО, телефону..."
          className="min-h-[44px] flex-1 min-w-[200px] rounded-lg border border-stone-300 px-3 py-2"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 py-2"
        >
          <option value="created_at">По дате</option>
          <option value="city_name">По городу</option>
          <option value="code">По коду</option>
          <option value="payer">По ФИО</option>
        </select>
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
          className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 py-2"
        >
          <option value="desc">Сначала новые</option>
          <option value="asc">Сначала старые</option>
        </select>
        <button
          type="button"
          onClick={fetchList}
          disabled={loading}
          className="min-h-[44px] rounded-lg bg-stone-800 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Загрузка…" : "Обновить"}
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading && list.length === 0 ? (
        <p className="text-stone-500">Загрузка…</p>
      ) : list.length === 0 ? (
        <p className="text-stone-500">Нет сертификатов</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="p-2 text-left font-medium text-stone-600">Код</th>
                <th className="p-2 text-left font-medium text-stone-600">Дата</th>
                <th className="p-2 text-left font-medium text-stone-600">Город</th>
                <th className="p-2 text-left font-medium text-stone-600">Тариф</th>
                <th className="p-2 text-left font-medium text-stone-600">Сумма</th>
                <th className="p-2 text-left font-medium text-stone-600">Покупатель</th>
                <th className="p-2 text-left font-medium text-stone-600">Источник</th>
                <th className="p-2 text-left font-medium text-stone-600">Статус</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id} className="border-b border-stone-100">
                  <td className="p-2">
                    <span className="font-mono">
                      {revealedIds.has(row.id) ? row.code : maskCode(row.code)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleReveal(row.id)}
                      className="ml-2 text-xs text-stone-500 underline"
                    >
                      {revealedIds.has(row.id) ? "Скрыть" : "Раскрыть"}
                    </button>
                  </td>
                  <td className="p-2 text-stone-600">
                    {new Date(row.created_at).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-2">{row.city_name}</td>
                  <td className="p-2">{row.tariff_name}</td>
                  <td className="p-2">{(row.amount_cents / 100).toFixed(0)} ₽</td>
                  <td className="p-2 max-w-[180px] truncate" title={row.payer_phone}>
                    {payerDisplay(row)}
                  </td>
                  <td className="p-2">{row.source === "telegram" ? "Telegram" : "Сайт"}</td>
                  <td className="p-2">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
