"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const TELEGRAM_ID_STORAGE = "studio_certs_telegram_id";

type VaultItem = {
  id: number;
  code: string;
  tariff_name: string;
  city_name: string;
  design_name: string;
  status: string;
  expires_at: string;
  recipient_name: string;
  created_at: string;
};

export default function VaultPage() {
  const [telegramId, setTelegramId] = useState("");
  const [list, setList] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(TELEGRAM_ID_STORAGE);
      if (stored) setTelegramId(stored);
    }
  }, []);

  useEffect(() => {
    if (!telegramId.trim()) {
      setLoading(false);
      setList([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/get-vault?telegram_id=${encodeURIComponent(telegramId.trim())}`)
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Не удалось загрузить сертификаты");
          setList([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [telegramId]);

  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-xl font-semibold text-stone-800">
        Мои сертификаты
      </h1>

      <div className="mb-6">
        <label htmlFor="vault_telegram_id" className="block text-sm font-medium text-stone-600">
          Telegram ID
        </label>
        <input
          id="vault_telegram_id"
          type="text"
          value={telegramId}
          onChange={(e) => setTelegramId(e.target.value)}
          placeholder="123456789"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900"
        />
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-stone-500">Загрузка…</p>
      ) : list.length === 0 ? (
        <p className="text-stone-500">
          {telegramId.trim() ? "Нет сертификатов" : "Введите Telegram ID"}
        </p>
      ) : (
        <ul className="space-y-4">
          {list.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
            >
              <p className="font-mono font-medium text-stone-800">{item.code}</p>
              <p className="mt-1 text-sm text-stone-600">{item.recipient_name}</p>
              <p className="mt-1 text-sm text-stone-500">
                {item.tariff_name} · {item.city_name} · {item.design_name}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Статус: {item.status}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Действует до: {new Date(item.expires_at).toLocaleDateString("ru-RU")}
              </p>
              <a
                href={`/api/certificate/pdf?code=${encodeURIComponent(item.code)}`}
                download
                className="mt-3 inline-block min-h-[44px] rounded-lg bg-stone-800 px-4 py-2 text-sm text-white no-underline"
              >
                Скачать PDF
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6">
        <Link href="/" className="text-stone-600 underline">
          Купить сертификат
        </Link>
      </p>
    </main>
  );
}
