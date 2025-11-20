"use client";

import { useState } from "react";

export type AppointmentModalMode = "view" | "edit" | "create";

export function useAppointmentModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AppointmentModalMode>("view");
  const [appointmentId, setAppointmentId] = useState<number | null>(null);

  function showView(id: number) {
    setAppointmentId(id);
    setMode("view");
    setOpen(true);
  }

  function showEdit(id: number) {
    setAppointmentId(id);
    setMode("edit");
    setOpen(true);
  }

  function showCreate() {
    setAppointmentId(null);
    setMode("create");
    setOpen(true);
  }

  return {
    open,
    setOpen,
    mode,
    appointmentId,
    showView,
    showEdit,
    showCreate,
  };
}
