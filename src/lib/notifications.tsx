import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { notifications as seed, Notice } from "@/data/mockData";

type Ctx = {
  items: Notice[];
  unreadCount: number;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notice[]>(() => seed.map((n) => ({ ...n })));

  const value = useMemo<Ctx>(() => ({
    items,
    unreadCount: items.filter((n) => !n.read).length,
    markRead: (id) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
    markUnread: (id) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n))),
    markAllRead: () => setItems((prev) => prev.map((n) => ({ ...n, read: true }))),
    remove: (id) => setItems((prev) => prev.filter((n) => n.id !== id)),
  }), [items]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}