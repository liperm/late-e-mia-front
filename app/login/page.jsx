"use client";

export const dynamic = "force-dynamic";
export const runtime = "edge";


import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Ler o parâmetro enviado pelo redirect
  const loginError = params.get("error");

  // Quando a página carregar, se houver ?error=session_expired → toast
  useEffect(() => {
    if (loginError === "session_expired") {
      toast.error("Sessão expirada. Faça login novamente.");
    }
  }, [loginError]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const LOGIN_PATH = "/auth/login";
  const LOGIN_URL = `${API_BASE.replace(/\/$/, "")}${LOGIN_PATH}`;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch(LOGIN_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (res?.status === 200 || res?.status === 201) {
        router.push("/");
        return;
      }

      if (!res) {
        setError("Erro inesperado ao autenticar.");
        return;
      }

      if (res.status === 401 || res.status === 403) {
        setError("Usuário ou senha inválidos.");
      } else {
        try {
          const body = await res.json();
          setError(body?.message || "Erro ao autenticar. Tente novamente.");
        } catch {
          setError("Erro ao autenticar. Tente novamente.");
        }
      }
    } catch (err) {
      console.error("Erro no fetch:", err);
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Login
        </h1>

        <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-800">Username</label>
            <input
              type="text"
              className="mt-1 w-full px-3 py-2 border rounded-lg outline-none 
                         focus:ring-2 focus:ring-blue-500 
                         text-gray-800 placeholder:text-gray-400"
              placeholder="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-label="E-mail"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="text-sm font-medium text-gray-800">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="mt-1 w-full px-3 py-2 border rounded-lg outline-none 
                           focus:ring-2 focus:ring-blue-500 
                           text-gray-800 placeholder:text-gray-400 pr-10"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-800"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {/* Erro */}
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-black hover:bg-white hover:text-black hover:border hover:cursor-pointer text-white py-2 rounded-lg font-semibold transition
                        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
