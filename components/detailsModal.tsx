"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { User, Clock, FileText, Pencil, Save, Trash, X } from "lucide-react";
import { apiFetch } from "../app/lib/api";

type ModalMode = "create" | "edit" | "view";

interface PatientModalProps {
  id?: number | null;
  open: boolean;
  mode: ModalMode;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const speciesOptions = {
  cat: "Gato",
  dog: "Cachorro",
  bird: "Ave",
} as const;

const speciesReverse = {
  Gato: "cat",
  Cachorro: "dog",
  Ave: "bird",
} as const;

type SpeciesKey = keyof typeof speciesOptions;     // "cat" | "dog" | "bird"
type SpeciesLabel = keyof typeof speciesReverse;   // "Gato" | "Cachorro" | "Ave"

export function PatientModal({ id, open, mode, onOpenChange, onUpdated }: PatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(mode !== "view");
  const [data, setData] = useState<any>({
    priority: "normal",
    arrival_at: "",
    stage: "waiting_for_attendance",
    description: "",
    pet: {
      name: "",
      type: "cat",
      breed: "",
      tutor_name: "",
    },
  });

  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const urgencyColors: Record<string, string> = {
    normal: "bg-green-100 text-green-800 border-green-200",
    urgent: "bg-red-100 text-red-800 border-red-200",
  };

  const urgencyLabels: Record<string, string> = {
    normal: "Normal",
    urgent: "Urgente",
  };

  useEffect(() => {
    setEditMode(mode !== "view");
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    if (mode !== "view" || !id) return;

    setEditMode(false);
    setLoading(true);

    (async () => {
      const res = await apiFetch(`${baseURL}/appointments/${id}`);
      if (!res) return;

      const json = await res.json();
      setData(json);
      setLoading(false);
    })();
  }, [open, id, mode, baseURL]);

  useEffect(() => {
    if (open && mode === "create") {
      const now = new Date();
      now.setHours(now.getHours() - 3); // Ajusta para fuso do Brasil

      setData({
        priority: "normal",
        arrival_at: now.toISOString().slice(0, 16),
        stage: "waiting_for_attendance",
        description: "",
        pet: {
          name: "",
          type: "",
          breed: "",
          tutor_name: "",
        },
      });
    }
  }, [open, mode]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const method = mode === "create" ? "POST" : "PUT";
    const url = mode === "create" ? `${baseURL}/appointments` : `${baseURL}/appointments/${id}`;

    await apiFetch(url, {
      method,
      body: JSON.stringify(data),
    });

    onUpdated();
    setLoading(false);
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Tem certeza que deseja excluir este atendimento?")) return;

    setLoading(true);
    await apiFetch(`${baseURL}/appointments/${id}`, { method: "DELETE" });
    onUpdated();
    setLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-y-auto">
        <form onSubmit={handleSave}>
          <DialogHeader className="p-6 pb-3"> 
            <DialogTitle className="flex items-start justify-between w-full">
              <div>
                {editMode ? "Editar Atendimento" : data.pet?.name}
                {!editMode && (
                  <p className="text-sm text-muted-foreground mt-1">{speciesOptions[data.pet?.type as SpeciesKey]}</p>
                )}
              </div>

              {!editMode && (
                <Badge variant="outline" className={urgencyColors[data.priority]}>
                  {urgencyLabels[data.priority]}
                </Badge>
              )}
            </DialogTitle>

            <DialogDescription>
              {editMode
                ? "Altere as informações e clique em salvar."
                : "Informações completas do atendimento."}
            </DialogDescription>

            <div className="flex gap-2 mt-4">
              {!editMode && (
                <>
                  <Button variant="outline" className="flex items-center gap-2" type="button" onClick={() => setEditMode(true)}>
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>

                  <Button variant="destructive" className="flex items-center gap-2" type="button" onClick={handleDelete}>
                    <Trash className="h-4 w-4" /> Excluir
                  </Button>
                </>
              )}

              {editMode && (
                <>
                  <Button type="submit" disabled={loading} className="flex items-center gap-2">
                    <Save className="h-4 w-4" /> Salvar
                  </Button>

                  {mode !== "create" && (
                    <Button variant="outline" type="button" onClick={() => setEditMode(false)} className="flex items-center gap-2">
                      <X className="h-4 w-4" /> Cancelar
                    </Button>
                  )}
                </>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-180px)] px-6 pb-6">
            {loading ? (
              <p className="text-center py-10">Carregando...</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4" /> Informações do Paciente
                  </h3>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="col-span-2">
                      <Label>Nome</Label>
                      {editMode ? (
                        <Input
                          value={data.pet.name}
                          onChange={(e) => setData({ ...data, pet: { ...data.pet, name: e.target.value } })}
                        />
                      ) : (
                        <p className="text-sm">{data.pet.name}</p>
                      )}
                    </div>

                    <div>
                      <Label>Espécie</Label>
                      {editMode ? (
                        <select
                          className="mt-1 w-full border rounded p-2 bg-background"
                          value={speciesOptions[data.pet.type as SpeciesKey ]}
                          onChange={(e) => setData({ ...data, pet: { ...data.pet, type: speciesReverse[e.target.value as SpeciesLabel] } })}
                        >
                          <option value="">Selecione...</option>
                          {Object.values(speciesOptions).map((label) => (
                            <option key={label} value={label}>
                              {label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm">{speciesOptions[data.pet.type as SpeciesKey ]}</p>
                      )}
                    </div>

                    <div>
                      <Label>Raça</Label>
                      {editMode ? (
                        <Input
                          value={data.pet.breed}
                          onChange={(e) => setData({ ...data, pet: { ...data.pet, breed: e.target.value } })}
                        />
                      ) : (
                        <p className="text-sm">{data.pet.breed}</p>
                      )}
                    </div>

                    <div className="col-span-2 mt-3">
                      <Label>Horário de Chegada</Label>
                      {editMode ? (
                        <Input
                          type="datetime-local"
                          value={data.arrival_at?.slice(0, 16)}
                          onChange={(e) => setData({ ...data, arrival_at: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{new Date(data.arrival_at).toLocaleString("pt-BR")}</p>
                      )}
                    </div>

                    <div>
                      <Label>Prioridade</Label>
                      {editMode ? (
                        <select
                          className="mt-1 w-full border rounded p-2 bg-background"
                          value={data.priority}
                          onChange={(e) => setData({ ...data, priority: e.target.value })}
                        >
                          <option value="normal">Normal</option>
                          <option value="urgent">Urgente</option>
                        </select>
                      ) : (
                        <Badge className={urgencyColors[data.priority]}>{urgencyLabels[data.priority]}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-medium">
                    <User className="h-4 w-4" /> Dados do Tutor
                  </h3>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <Label>Nome do Tutor</Label>
                    {editMode ? (
                      <Input
                        value={data.pet.tutor_name}
                        onChange={(e) => setData({ ...data, pet: { ...data.pet, tutor_name: e.target.value } })}
                      />
                    ) : (
                      <p className="text-sm">{data.pet.tutor_name}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="mb-3 font-medium">Motivo da Consulta</h3>

                  {editMode ? (
                    <Textarea
                      rows={4}
                      value={data.description}
                      onChange={(e) => setData({ ...data, description: e.target.value })}
                    />
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm">{data.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          

            <DialogFooter className="px-6 pb-6 mt-6">
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
            </DialogFooter>
          </ScrollArea>
        </form>
      </DialogContent>
    </Dialog>
  );
}
