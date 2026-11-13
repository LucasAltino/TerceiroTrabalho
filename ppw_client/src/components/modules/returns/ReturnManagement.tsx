"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  RotateCcw,
  Plus,
  Search,
  Edit3,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Box,
  FileCheck,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  LogOut,
} from "lucide-react";
import {
  authApi,
  returnsApi,
  ReturnRequest,
  CreateReturnPayload,
  UpdateReturnPayload,
  ReturnStatusValue,
} from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_CONFIG: Record<
  ReturnStatusValue,
  { label: string; bg: string; color: string; icon: any }
> = {
  REQUESTED: {
    label: "Solicitado",
    bg: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    color: "text-amber-600",
    icon: Clock,
  },
  POSTED: {
    label: "Postado",
    bg: "bg-sky-500/10 border-sky-500/20 text-sky-600",
    color: "text-sky-600",
    icon: Truck,
  },
  RECEIVED: {
    label: "Recebido",
    bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600",
    color: "text-indigo-600",
    icon: Box,
  },
  INSPECTING: {
    label: "Em Inspeção",
    bg: "bg-purple-500/10 border-purple-500/20 text-purple-600",
    color: "text-purple-600",
    icon: FileCheck,
  },
  ADJUSTMENT_REQUESTED: {
    label: "Ajuste solicitado",
    bg: "bg-orange-500/10 border-orange-500/20 text-orange-600",
    color: "text-orange-600",
    icon: AlertTriangle,
  },
  APPROVED: {
    label: "Aprovado",
    bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    color: "text-emerald-600",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejeitado",
    bg: "bg-rose-500/10 border-rose-500/20 text-rose-600",
    color: "text-rose-600",
    icon: XCircle,
  },
  COMPLETED: {
    label: "Concluído",
    bg: "bg-blue-500/10 border-blue-500/20 text-blue-600",
    color: "text-blue-600",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelado",
    bg: "bg-muted text-muted-foreground",
    color: "text-muted-foreground",
    icon: XCircle,
  },
};

export function ReturnManagement() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "DEVOLUTION" | "EXCHANGE"
  >("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ReturnStatusValue>(
    "all",
  );

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<ReturnRequest | null>(
    null,
  );
  const [inspectingReturn, setInspectingReturn] =
    useState<ReturnRequest | null>(null);
  const [deletingReturn, setDeletingReturn] = useState<ReturnRequest | null>(
    null,
  );

  // Form state for Create
  const [createForm, setCreateForm] = useState<CreateReturnPayload>({
    orderId: "",
    productId: "",
    type: "DEVOLUTION",
    reason: "Defeito de fabricação",
    description: "",
    items: [{ orderItemId: "", quantity: 1 }],
  });

  // Form state for Edit
  const [editForm, setEditForm] = useState<UpdateReturnPayload>({
    reason: "",
    description: "",
    trackingCode: "",
  });

  const [inspectForm, setInspectForm] = useState({
    approved: true,
    result: "Produto inspecionado e conforme para troca/estorno.",
    rejectionReason: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch returns
  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await returnsApi.list();
      setReturns(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Erro ao buscar devoluções:", err);
      setError(err.message || "Falha ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = authApi.getToken();
    setIsAuthenticated(Boolean(token));
    if (token) void fetchReturns();
    else setIsLoading(false);
  }, [fetchReturns]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.login(loginEmail.trim(), loginPassword);
      setIsAuthenticated(true);
      setLoginPassword("");
      await fetchReturns();
    } catch (err: any) {
      setError(err.message || "Falha ao entrar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setReturns([]);
  };

  // Filtered returns
  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      const matchesSearch =
        r.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.trackingCode &&
          r.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === "all" ? true : r.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" ? true : r.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [returns, searchQuery, typeFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = returns.length;
    const requested = returns.filter((r) => r.status === "REQUESTED").length;
    const inProgress = returns.filter(
      (r) =>
        r.status === "POSTED" ||
        r.status === "RECEIVED" ||
        r.status === "INSPECTING" ||
        r.status === "ADJUSTMENT_REQUESTED",
    ).length;
    const approvedOrDone = returns.filter(
      (r) => r.status === "APPROVED" || r.status === "COMPLETED",
    ).length;
    const rejected = returns.filter((r) => r.status === "REJECTED").length;
    return { total, requested, inProgress, approvedOrDone, rejected };
  }, [returns]);

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requestedItem = createForm.items[0];
    if (
      !createForm.orderId.trim() ||
      !createForm.productId.trim() ||
      !requestedItem?.orderItemId.trim() ||
      !Number.isInteger(requestedItem.quantity) ||
      requestedItem.quantity < 1
    ) {
      alert(
        "Informe o pedido, produto, item do pedido e uma quantidade válida.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await returnsApi.create({
        ...createForm,
        orderId: createForm.orderId.trim(),
        productId: createForm.productId.trim(),
        reason: createForm.reason.trim(),
        description: createForm.description.trim(),
        items: [
          {
            orderItemId: requestedItem.orderItemId.trim(),
            quantity: requestedItem.quantity,
          },
        ],
      });
      if (created.reverseCode) {
        alert(
          `Solicitação criada. Código reverso (válido por 7 dias): ${created.reverseCode}`,
        );
      }
      setIsCreateOpen(false);
      setCreateForm({
        orderId: "",
        productId: "",
        type: "DEVOLUTION",
        reason: "Defeito de fabricação",
        description: "",
        items: [{ orderItemId: "", quantity: 1 }],
      });
      await fetchReturns();
    } catch (err: any) {
      alert(`Erro ao criar solicitação: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (ret: ReturnRequest) => {
    setEditingReturn(ret);
    setEditForm({
      reason: ret.reason,
      description: ret.description,
      trackingCode: ret.trackingCode || "",
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReturn) return;

    setIsSubmitting(true);
    try {
      await returnsApi.update(editingReturn.id, {
        reason: editForm.reason?.trim(),
        description: editForm.description?.trim(),
        trackingCode: editForm.trackingCode?.trim() || null,
      });
      setEditingReturn(null);
      await fetchReturns();
    } catch (err: any) {
      alert(`Erro ao atualizar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenInspection = (ret: ReturnRequest) => {
    setInspectingReturn(ret);
    setInspectForm({
      approved: true,
      result:
        ret.inspectionResult ||
        "Produto inspecionado e conforme para troca/estorno.",
      rejectionReason: ret.rejectionReason || "",
    });
  };

  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingReturn) return;
    const result = inspectForm.result.trim();
    const rejectionReason = inspectForm.rejectionReason.trim();
    if (
      (inspectForm.approved && !result) ||
      (!inspectForm.approved && !rejectionReason)
    ) {
      alert("Informe o laudo para aprovação ou a justificativa para rejeição.");
      return;
    }

    try {
      if (inspectForm.approved) {
        await returnsApi.approve(inspectingReturn.id, result);
      } else {
        await returnsApi.reject(inspectingReturn.id, rejectionReason);
      }
      setInspectingReturn(null);
      await fetchReturns();
    } catch (err: any) {
      alert(`Erro ao registrar inspeção: ${err.message}`);
    }
  };

  const performTransition = async (
    errorLabel: string,
    transition: () => Promise<ReturnRequest>,
  ) => {
    try {
      await transition();
      await fetchReturns();
    } catch (err: any) {
      alert(`Erro ao ${errorLabel}: ${err.message}`);
    }
  };

  const handlePost = (ret: ReturnRequest) => {
    const trackingCode = window
      .prompt("Informe o código de rastreamento:")
      ?.trim();
    if (!trackingCode) return;
    const reverseCode = window
      .prompt("Informe o código reverso recebido:")
      ?.trim();
    if (!reverseCode) return;
    void performTransition("registrar postagem", () =>
      returnsApi.post(ret.id, { trackingCode, reverseCode }),
    );
  };

  const handleAdjustment = (ret: ReturnRequest) => {
    const reason = window.prompt("Informe o ajuste solicitado:")?.trim();
    if (reason)
      void performTransition("solicitar ajuste", () =>
        returnsApi.requestAdjustment(ret.id, reason),
      );
  };

  const handleCancelConfirm = async () => {
    if (!deletingReturn) return;
    const justification = window
      .prompt("Informe a justificativa do cancelamento:")
      ?.trim();
    if (!justification) return;
    setIsSubmitting(true);
    try {
      await performTransition("cancelar devolução", async () => {
        const result = await returnsApi.cancel(
          deletingReturn.id,
          justification,
        );
        setDeletingReturn(null);
        return result;
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md py-12">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-xl font-bold">Entrar em Devoluções</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use sua conta para acessar as solicitações.
            </p>
            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold"
                  htmlFor="returns-email"
                >
                  E-mail
                </label>
                <Input
                  id="returns-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold"
                  htmlFor="returns-password"
                >
                  Senha
                </label>
                <Input
                  id="returns-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
            <RotateCcw className="h-4 w-4" />
            <span>Módulo de E-commerce & Logística Reversa</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Devoluções e Trocas de Mercadorias
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle do fluxo de logística reversa, triagem, inspeção técnica e
            laudos de produtos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReturns}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Atualizar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Solicitação</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Total
              </p>
              <h3 className="text-xl font-bold mt-0.5 text-foreground">
                {stats.total}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <RotateCcw className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                Solicitados
              </p>
              <h3 className="text-xl font-bold mt-0.5 text-amber-600 dark:text-amber-400">
                {stats.requested}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                Em Andamento
              </p>
              <h3 className="text-xl font-bold mt-0.5 text-purple-600 dark:text-purple-400">
                {stats.inProgress}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Aprovados/Concluídos
              </p>
              <h3 className="text-xl font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">
                {stats.approvedOrDone}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                Rejeitados
              </p>
              <h3 className="text-xl font-bold mt-0.5 text-rose-600 dark:text-rose-400">
                {stats.rejected}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <XCircle className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido, cliente, produto, motivo ou rastreio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/80"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tipo */}
          <div className="flex items-center rounded-lg border border-border p-1 bg-background/80 text-xs">
            <span className="px-2 text-muted-foreground font-medium">
              Tipo:
            </span>
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                typeFilter === "all"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter("DEVOLUTION")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                typeFilter === "DEVOLUTION"
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Devolução
            </button>
            <button
              onClick={() => setTypeFilter("EXCHANGE")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                typeFilter === "EXCHANGE"
                  ? "bg-cyan-600 text-white font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Troca
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center rounded-lg border border-border p-1 bg-background/80 text-xs">
            <span className="px-2 text-muted-foreground font-medium">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent font-medium text-foreground outline-none cursor-pointer pr-1"
            >
              <option value="all">Todos</option>
              <option value="REQUESTED">Solicitado</option>
              <option value="POSTED">Postado</option>
              <option value="RECEIVED">Recebido</option>
              <option value="INSPECTING">Em Inspeção</option>
              <option value="ADJUSTMENT_REQUESTED">Ajuste solicitado</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REJECTED">Rejeitado</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content / List of Returns */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 flex items-center justify-between text-sm">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchReturns}>
            Tentar Novamente
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-border/50 bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-muted/20">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
            <RotateCcw className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Nenhuma solicitação encontrada
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery || typeFilter !== "all" || statusFilter !== "all"
              ? "Tente ajustar os filtros ou o termo de pesquisa."
              : "Nenhuma devolução ou troca foi registrada ainda."}
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-5 gap-2">
            <Plus className="h-4 w-4" />
            <span>Criar Solicitação</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((ret) => {
            const statusInfo = STATUS_CONFIG[ret.status] || {
              label: ret.status,
              bg: "bg-muted text-muted-foreground",
              color: "text-muted-foreground",
              icon: Clock,
            };
            const StatusIcon = statusInfo.icon;
            const isDevolution = ret.type === "DEVOLUTION";

            return (
              <Card
                key={ret.id}
                className="group border-border/70 hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Main details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            isDevolution
                              ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                              : "bg-cyan-500/10 text-cyan-600 border-cyan-500/20"
                          }`}
                        >
                          {isDevolution ? "Devolução" : "Troca"}
                        </span>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${statusInfo.bg}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{statusInfo.label}</span>
                        </span>

                        <span className="font-mono text-xs text-muted-foreground">
                          Pedido:{" "}
                          <strong className="text-foreground">
                            {ret.orderId}
                          </strong>
                        </span>

                        <span className="text-muted-foreground/60">•</span>

                        <span className="font-mono text-xs text-muted-foreground">
                          Cliente:{" "}
                          <strong className="text-foreground">
                            {ret.customerId}
                          </strong>
                        </span>

                        <span className="text-muted-foreground/60">•</span>

                        <span className="font-mono text-xs text-muted-foreground">
                          Produto:{" "}
                          <strong className="text-foreground">
                            {ret.productId}
                          </strong>
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-foreground">
                          Motivo: {ret.reason}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {ret.description}
                        </p>
                      </div>

                      {/* Optional inspection / tracking info */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        {ret.trackingCode && (
                          <div className="flex items-center gap-1 text-muted-foreground bg-muted/60 px-2 py-1 rounded-md border border-border/50">
                            <Truck className="h-3 w-3 text-sky-500" />
                            <span>Rastreio:</span>
                            <span className="font-mono font-medium text-foreground">
                              {ret.trackingCode}
                            </span>
                          </div>
                        )}

                        {ret.inspectionResult && (
                          <div className="flex items-center gap-1 text-muted-foreground bg-muted/60 px-2 py-1 rounded-md border border-border/50">
                            <FileCheck className="h-3 w-3 text-purple-500" />
                            <span>Laudo:</span>
                            <span className="font-medium text-foreground">
                              {ret.inspectionResult}
                            </span>
                          </div>
                        )}

                        {ret.rejectionReason && (
                          <div className="flex items-center gap-1 text-rose-600 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                            <ShieldAlert className="h-3 w-3" />
                            <span>Motivo Recusa:</span>
                            <span className="font-medium">
                              {ret.rejectionReason}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50">
                      {ret.status === "REQUESTED" && (
                        <Button
                          size="sm"
                          onClick={() => handlePost(ret)}
                          className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
                        >
                          Postar
                        </Button>
                      )}
                      {ret.status === "POSTED" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            void performTransition(
                              "registrar recebimento",
                              () => returnsApi.receive(ret.id),
                            )
                          }
                        >
                          Receber
                        </Button>
                      )}
                      {(ret.status === "RECEIVED" ||
                        ret.status === "ADJUSTMENT_REQUESTED") && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            void performTransition("iniciar inspeção", () =>
                              returnsApi.startInspection(ret.id),
                            )
                          }
                          className="h-8 text-xs font-semibold gap-1.5"
                        >
                          <FileCheck className="h-3.5 w-3.5 text-purple-600" />
                          <span>Iniciar inspeção</span>
                        </Button>
                      )}
                      {ret.status === "INSPECTING" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleOpenInspection(ret)}
                          >
                            Inspecionar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdjustment(ret)}
                          >
                            Solicitar ajuste
                          </Button>
                        </>
                      )}
                      {ret.status === "APPROVED" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            void performTransition("concluir devolução", () =>
                              returnsApi.complete(ret.id),
                            )
                          }
                        >
                          Concluir
                        </Button>
                      )}
                      {(
                        [
                          "REQUESTED",
                          "POSTED",
                          "RECEIVED",
                          "INSPECTING",
                          "ADJUSTMENT_REQUESTED",
                          "APPROVED",
                        ] as ReturnStatusValue[]
                      ).includes(ret.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingReturn(ret)}
                        >
                          Cancelar
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(ret)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Alterar Solicitação"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL 1: INCLUIR (NOVA SOLICITAÇÃO DE DEVOLUÇÃO/TROCA) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Registrar Devolução / Troca"
        description="Abra uma solicitação de logística reversa vinculada a um pedido de e-commerce."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                ID do Pedido <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="Ex: PED-10294"
                value={createForm.orderId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, orderId: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                ID do Produto <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="Ex: PROD-441"
                value={createForm.productId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, productId: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                ID do Item no Pedido <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="ID do item comprado"
                value={createForm.items[0]?.orderItemId || ""}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    items: [
                      {
                        ...createForm.items[0],
                        orderItemId: e.target.value,
                        quantity: createForm.items[0]?.quantity || 1,
                      },
                    ],
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Quantidade <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                type="number"
                min={1}
                step={1}
                value={createForm.items[0]?.quantity || 1}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    items: [
                      {
                        ...createForm.items[0],
                        orderItemId: createForm.items[0]?.orderItemId || "",
                        quantity: Number(e.target.value),
                      },
                    ],
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tipo de Solicitação
              </label>
              <select
                value={createForm.type}
                onChange={(e) =>
                  setCreateForm({ ...createForm, type: e.target.value as any })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="DEVOLUTION">Devolução (Estorno de Valor)</option>
                <option value="EXCHANGE">
                  Troca (Substituição de Produto)
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Motivo
              </label>
              <select
                value={createForm.reason}
                onChange={(e) =>
                  setCreateForm({ ...createForm, reason: e.target.value })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Defeito de fabricação">
                  Defeito de fabricação
                </option>
                <option value="Arrependimento de compra">
                  Arrependimento de compra (7 dias)
                </option>
                <option value="Tamanho ou modelo incorreto">
                  Tamanho ou modelo incorreto
                </option>
                <option value="Produto avariado no transporte">
                  Produto avariado no transporte
                </option>
                <option value="Item divergente da nota fiscal">
                  Item divergente da nota fiscal
                </option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Descrição do Problema / Relato do Cliente{" "}
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explique o estado da mercadoria ou relato recebido..."
              value={createForm.description}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Registrar Solicitação"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ALTERAR DADOS DA SOLICITAÇÃO */}
      <Modal
        isOpen={!!editingReturn}
        onClose={() => setEditingReturn(null)}
        title="Alterar Solicitação"
        description={`Atualizando solicitação #${editingReturn?.id.slice(0, 8)}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Motivo
            </label>
            <Input
              required
              value={editForm.reason || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, reason: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Descrição
            </label>
            <textarea
              required
              rows={3}
              value={editForm.description || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Código de Rastreamento
            </label>
            <Input
              value={editForm.trackingCode || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, trackingCode: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingReturn(null)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: INSPEÇÃO TÉCNICA DO PRODUTO */}
      <Modal
        isOpen={!!inspectingReturn}
        onClose={() => setInspectingReturn(null)}
        title="Inspeção Técnica de Mercadoria"
        description={`Laudo e parecer de qualidade para solicitação #${inspectingReturn?.id.slice(0, 8)}`}
      >
        <form onSubmit={handleInspectSubmit} className="space-y-4">
          <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/10 text-xs text-purple-700 dark:text-purple-300">
            A inspeção técnica define se o item atende às políticas de
            troca/devolução. A decisão definirá o status final como{" "}
            <strong>Aprovado</strong> ou <strong>Rejeitado</strong>.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Parecer da Inspeção
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setInspectForm({ ...inspectForm, approved: true })
                }
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-sm transition-all ${
                  inspectForm.approved
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 ring-2 ring-emerald-500/30"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Aprovar Solicitação</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setInspectForm({ ...inspectForm, approved: false })
                }
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-sm transition-all ${
                  !inspectForm.approved
                    ? "border-rose-500 bg-rose-500/15 text-rose-600 ring-2 ring-rose-500/30"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <XCircle className="h-4 w-4" />
                <span>Rejeitar Solicitação</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Resultado / Laudo da Inspeção{" "}
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              required={inspectForm.approved}
              rows={3}
              value={inspectForm.result}
              onChange={(e) =>
                setInspectForm({ ...inspectForm, result: e.target.value })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {!inspectForm.approved && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="text-xs font-semibold text-rose-600">
                Motivo Detalhado da Rejeição{" "}
                <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="Ex: Produto com marcas severas de mau uso ou lacre violado"
                value={inspectForm.rejectionReason || ""}
                onChange={(e) =>
                  setInspectForm({
                    ...inspectForm,
                    rejectionReason: e.target.value,
                  })
                }
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInspectingReturn(null)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Concluir Laudo"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        isOpen={!!deletingReturn}
        onClose={() => setDeletingReturn(null)}
        title="Confirmar cancelamento"
        description="A solicitação será cancelada e os efeitos financeiros pendentes serão revertidos."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Deseja realmente cancelar?</p>
              <p className="mt-0.5 text-muted-foreground">
                Pedido: #{deletingReturn?.orderId} • Produto:{" "}
                {deletingReturn?.productId}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingReturn(null)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cancelando..." : "Cancelar Solicitação"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
