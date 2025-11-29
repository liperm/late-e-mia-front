"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useEffect, useState } from "react";
import { apiFetch } from "./lib/api";
import { PatientModal } from "@/components/detailsModal";

// Tipos ---------------------------
type AppointmentStage =
  | "waiting_for_attendance"
  | "in_attendance"
  | "finished";

interface Appointment {
  id: number;
  arrival_at: string;
  stage: AppointmentStage;
  description: string;
  priority: "normal" | "urgent";
  pet: {
    id: number;
    name: string;
    type: string;
    breed: string;
    tutor_name: string;
  };
}

const columnLabels: Record<AppointmentStage, string> = {
  waiting_for_attendance: "Aguardando Atendimento",
  in_attendance: "Em Atendimento",
  finished: "Finalizado",
};

const petTypeLabels: Record<string, string> = {
  dog: "Cachorro",
  cat: "Gato",
  bird: "Ave",
};

const translatePetType = (type: string) =>
  petTypeLabels[type] ?? "Desconhecido";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  function openAppointment(id: number) {
    setSelectedId(id);
    setModalMode("view");
    setModalOpen(true);
  }
  


  // Fetch API
  const loadData = async () => {
    try {
      const apiURL = process.env.API_URL ?? "http://localhost:3000";
      const res = await apiFetch(`${apiURL}/appointments`, {
        credentials: "include",
      });

      if (!res) throw new Error("apiFetch retornou null");
      if (!res.ok) throw new Error("Erro ao carregar dados");

      const data: Appointment[] = await res.json();
      setAppointments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const reloadList = async () => loadData();

  // 🟡 Drag & Drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const id = Number(draggableId);
    const newStage = destination.droppableId as AppointmentStage;

    // UI update
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, stage: newStage } : a))
    );

    // API update
    try {
      const apiURL = process.env.API_URL ?? "http://localhost:3000";
      await apiFetch(`${apiURL}/appointments/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch (err) {
      console.error("Erro ao atualizar estágio:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Header */}
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2 text-gray-800">
            <span className="text-3xl">🩺</span>
            Clínica Veterinária Late & Mia - Atendimentos
          </h1>
          <p className="text-gray-500 text-sm">
            Acompanhe o fluxo de atendimento dos pacientes
          </p>
        </div>

        <button
          className="bg-black text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800 transition"
          onClick={() => {
          setSelectedId(null);
          setModalMode("create");
          setModalOpen(true);
          }}
        >
          <span className="text-lg">+</span> Novo Paciente
        </button>
      </header>

      {/* Kanban */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(columnLabels) as AppointmentStage[]).map(
            (stageKey) => {
              const items = appointments.filter(
                (a) => a.stage === stageKey
              );

              return (
                <Droppable droppableId={stageKey} key={stageKey}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="bg-white p-4 rounded-xl shadow-md"
                    >
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                        {columnLabels[stageKey]}
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                          {items.length}
                        </span>
                      </h2>

                      <div className="flex flex-col gap-4">
                        {items.map((item, index) => (
                          <Draggable
                            key={item.id}
                            draggableId={String(item.id)}
                            index={index}
                          >
                            {(prov) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className="border p-4 rounded-xl shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition"
                                onClick={() => openAppointment(item.id)}
                              >
                                <h3 className="text-lg font-semibold text-gray-800">
                                  {item.pet.name}
                                </h3>

                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                  👤 {item.pet.tutor_name}
                                </p>

                                <p className="mt-3 text-sm text-gray-700">
                                  <span className="font-semibold">Espécie:</span>{" "}
                                  {translatePetType(item.pet.type)} -{" "}
                                  {item.pet.breed}
                                </p>

                                <p className="text-sm text-gray-700">
                                  <span className="font-semibold">Motivo:</span>{" "}
                                  {item.description}
                                </p>

                                <div className="flex items-center justify-between mt-4">
                                  <p className="text-sm text-gray-600">
                                    ⏰{" "}
                                    {new Date(
                                      item.arrival_at
                                    ).toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>

                                  <span
                                    className={`text-xs px-3 py-1 rounded-full ${
                                      item.priority === "urgent"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-200 text-gray-700"
                                    }`}
                                  >
                                    {item.priority === "urgent"
                                      ? "Urgente"
                                      : "Normal"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}

                        {items.length === 0 && (
                          <p className="text-sm text-gray-400 italic text-center">
                            Nenhum registro
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            }
          )}
        </div>
      </DragDropContext>
      <PatientModal
        id={selectedId}
        open={modalOpen}
        mode={modalMode}
        onOpenChange={setModalOpen}
        onUpdated={reloadList}
      />
    </div>
  );
}
