"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export interface ScheduleOrder {
  id: string;
  client_name: string;
  client_phone: string | null;
  cake_name: string;
  diameter_cm: number;
  height_cm: number;
  portions: number;
  delivery_date: string;
  delivery_time?: string | null;
  notes: string | null;
  status: string;
}

interface TaskItem {
  id: string;
  orderId: string;
  stage: "bake" | "assemble" | "finish";
  stageName: string;
  dateStr: string;
  title: string;
  client: string;
  phone: string | null;
  details: string;
  notes: string | null;
  isToday: boolean;
  isPast: boolean;
}

export default function Schedule() {
  const [orders, setOrders] = useState<ScheduleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDayFilter, setSelectedDayFilter] = useState<"all" | "today" | "tomorrow" | "weekend">("all");
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void loadOrders();
    // Odczyt zapamiętanych odhaczeń z localStorage
    try {
      const saved = localStorage.getItem("delice_completed_schedule_tasks");
      if (saved) setCompletedTasks(JSON.parse(saved));
    } catch {}
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchErr } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["nowe", "w_trakcie"])
        .order("delivery_date", { ascending: true });

      if (fetchErr) throw fetchErr;
      setOrders((data || []) as ScheduleOrder[]);
    } catch (err: any) {
      setError(`Błąd wczytywania harmonogramu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function toggleTask(taskId: string) {
    setCompletedTasks((prev) => {
      const updated = { ...prev, [taskId]: !prev[taskId] };
      try {
        localStorage.setItem("delice_completed_schedule_tasks", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }

  // Generowanie zadań na osi czasu dla każdego tortu
  const tasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const generated: TaskItem[] = [];

    orders.forEach((o) => {
      if (!o.delivery_date) return;
      const delivDate = new Date(o.delivery_date);
      delivDate.setHours(0, 0, 0, 0);

      // D-2: Pieczenie i wkładki
      const d2 = new Date(delivDate);
      d2.setDate(d2.getDate() - 2);

      // D-1: Składanie i tynkowanie
      const d1 = new Date(delivDate);
      d1.setDate(d1.getDate() - 1);

      // D-0: Wydanie i finał
      const d0 = new Date(delivDate);

      const makeTask = (
        stage: "bake" | "assemble" | "finish",
        stageName: string,
        dateObj: Date,
        title: string
      ): TaskItem => {
        const dateStr = dateObj.toISOString().slice(0, 10);
        const isToday = dateObj.getTime() === today.getTime();
        const isPast = dateObj.getTime() < today.getTime();
        const id = `${o.id}_${stage}_${dateStr}`;

        return {
          id,
          orderId: o.id,
          stage,
          stageName,
          dateStr,
          title,
          client: o.client_name,
          phone: o.client_phone,
          details: `${o.cake_name} (⌀${o.diameter_cm}cm, ${o.portions}p)`,
          notes: o.notes,
          isToday,
          isPast,
        };
      };

      generated.push(
        makeTask("bake", "1. PIECZENIE I WKŁADKI (D-2)", d2, `Upiec biszkopt, przygotować żelki / chrupki do: ${o.cake_name}`),
        makeTask("assemble", "2. SKŁADANIE W RANCIE (D-1)", d1, `Złożyć tort w rancie, nasączyć i schłodzić: ${o.cake_name}`),
        makeTask("finish", "3. DEKORACJA I WYDANIE (D-0)", d0, `Tynk finałowy, dekoracje, topper i wydanie: ${o.cake_name}`)
      );
    });

    return generated.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [orders]);

  // Filtrowanie zadań
  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    const tmrw = new Date(today);
    tmrw.setDate(tmrw.getDate() + 1);
    const tmrwStr = tmrw.toISOString().slice(0, 10);

    if (selectedDayFilter === "today") {
      return tasks.filter((t) => t.dateStr === todayStr);
    }
    if (selectedDayFilter === "tomorrow") {
      return tasks.filter((t) => t.dateStr === tmrwStr);
    }
    if (selectedDayFilter === "weekend") {
      // Zadania na najbliższy piątek, sobotę i niedzielę
      const dayOfWeek = today.getDay();
      const distToFri = (5 - dayOfWeek + 7) % 7;
      const fri = new Date(today);
      fri.setDate(fri.getDate() + distToFri);
      const sun = new Date(fri);
      sun.setDate(sun.getDate() + 2);

      const friStr = fri.toISOString().slice(0, 10);
      const sunStr = sun.toISOString().slice(0, 10);

      return tasks.filter((t) => t.dateStr >= friStr && t.dateStr <= sunStr);
    }

    return tasks;
  }, [tasks, selectedDayFilter]);

  // Grupowanie zadań po dacie
  const groupedTasks = useMemo(() => {
    const groups: Record<string, TaskItem[]> = {};
    filteredTasks.forEach((t) => {
      if (!groups[t.dateStr]) groups[t.dateStr] = [];
      groups[t.dateStr].push(t);
    });
    return groups;
  }, [filteredTasks]);

  function formatDisplayDate(dateStr: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    const tmrw = new Date(today);
    tmrw.setDate(tmrw.getDate() + 1);
    const tmrwStr = tmrw.toISOString().slice(0, 10);

    const d = new Date(dateStr);
    const dayNames = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
    const dayName = dayNames[d.getDay()];

    if (dateStr === todayStr) return `🌟 DZISIAJ (${dayName}, ${dateStr})`;
    if (dateStr === tmrwStr) return `JUTRO (${dayName}, ${dateStr})`;
    return `${dayName}, ${dateStr}`;
  }

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e9e2da",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
  };

  const getStageBadgeStyle = (stage: TaskItem["stage"]): React.CSSProperties => {
    switch (stage) {
      case "bake":
        return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
      case "assemble":
        return { background: "#e0e7ff", color: "#3730a3", border: "1px solid #c7d2fe" };
      case "finish":
        return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#8a6d4b", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
          ORGANIZACJA PRACY W PRACOWNI
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 28, color: "#292522" }}>
          Harmonogram pracowni krok po kroku
        </h2>
        <p style={{ margin: "6px 0 0", color: "#716b65" }}>
          Automatyczna checklista zadań dzień po dniu wyliczona z terminów aktywnych zamówień.
        </p>
      </div>

      {error && (
        <div style={{ padding: 14, background: "#fee2e2", color: "#b91c1c", borderRadius: 12, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* FILTRY WIDOKU */}
      <div style={{ ...cardStyle, marginBottom: 20, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setSelectedDayFilter("all")}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                background: selectedDayFilter === "all" ? "#8a6d4b" : "#f4f0ec",
                color: selectedDayFilter === "all" ? "#ffffff" : "#716b65",
              }}
            >
              Wszystkie zaplanowane ({tasks.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedDayFilter("today")}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                background: selectedDayFilter === "today" ? "#8a6d4b" : "#f4f0ec",
                color: selectedDayFilter === "today" ? "#ffffff" : "#716b65",
              }}
            >
              🌟 Na dzisiaj
            </button>

            <button
              type="button"
              onClick={() => setSelectedDayFilter("tomorrow")}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                background: selectedDayFilter === "tomorrow" ? "#8a6d4b" : "#f4f0ec",
                color: selectedDayFilter === "tomorrow" ? "#ffffff" : "#716b65",
              }}
            >
              Jutro
            </button>

            <button
              type="button"
              onClick={() => setSelectedDayFilter("weekend")}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                background: selectedDayFilter === "weekend" ? "#8a6d4b" : "#f4f0ec",
                color: selectedDayFilter === "weekend" ? "#ffffff" : "#716b65",
              }}
            >
              Najbliższy weekend (Pt-Nd)
            </button>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            style={{
              border: "1px solid #ddd3c9",
              background: "#ffffff",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              color: "#8a6d4b",
            }}
          >
            Odśwież zamówienia
          </button>
        </div>
      </div>

      {/* PLAN DNIA / DNI */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#716b65" }}>Generowanie harmonogramu...</div>
      ) : Object.keys(groupedTasks).length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: "#8a837d" }}>
          Brak zaplanowanych zadań w tym okresie. Dodaj nowe zamówienia w zakładce „Zamówienia”.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Object.entries(groupedTasks).map(([dateStr, dayTasks]) => {
            const isToday = dayTasks.some((t) => t.isToday);

            return (
              <div
                key={dateStr}
                style={{
                  ...cardStyle,
                  borderLeft: isToday ? "6px solid #8a6d4b" : "1px solid #e9e2da",
                  background: isToday ? "#fffdfa" : "#ffffff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 18, color: isToday ? "#8a6d4b" : "#292522" }}>
                    {formatDisplayDate(dateStr)}
                  </h3>
                  <span style={{ fontSize: 12, color: "#716b65", fontWeight: 600 }}>
                    {dayTasks.filter((t) => completedTasks[t.id]).length} / {dayTasks.length} zrobione
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dayTasks.map((task) => {
                    const done = Boolean(completedTasks[task.id]);

                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        style={{
                          border: "1px solid #eee7e0",
                          borderRadius: 12,
                          padding: "12px 16px",
                          background: done ? "#f9fafb" : "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 14,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          opacity: done ? 0.6 : 1,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => {}} // obsłużone w div onClick
                            style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#8a6d4b" }}
                          />

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <span
                                style={{
                                  ...getStageBadgeStyle(task.stage),
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: "2px 6px",
                                  borderRadius: 5,
                                  textTransform: "uppercase",
                                }}
                              >
                                {task.stageName}
                              </span>
                              <strong
                                style={{
                                  fontSize: 14,
                                  color: "#292522",
                                  textDecoration: done ? "line-through" : "none",
                                }}
                              >
                                {task.title}
                              </strong>
                            </div>

                            <div style={{ fontSize: 12, color: "#716b65" }}>
                              Klient: <strong>{task.client}</strong> {task.phone ? `(${task.phone})` : ""} | Tort: {task.details}
                            </div>

                            {task.notes && (
                              <div style={{ fontSize: 11, color: "#8a6d4b", marginTop: 3 }}>
                                📌 Uwagi: {task.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <span style={{ fontSize: 12, fontWeight: 700, color: done ? "#047857" : "#8a6d4b", whiteSpace: "nowrap" }}>
                          {done ? "✓ Gotowe" : "Do zrobienia"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
