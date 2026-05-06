import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AdminMetrics } from "@/lib/types";
import { eventRepository } from "@/infrastructure/repositories/SupabaseEventRepository";
import { AdminUseCase } from "@/core/application/usecases/AdminUseCase";

const adminUseCase = new AdminUseCase(eventRepository);

export function useAdminController() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchMetrics = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: metricsError } =
        await adminUseCase.getAdminMetrics();

      if (metricsError) {
        throw metricsError;
      }

      setMetrics(data as AdminMetrics);
    } catch (err: any) {
      console.error("Error loading admin metrics:", err);
      setError(
        err.message || "Erro ao carregar métricas. Você é um administrador?",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleMakeMeAdmin = async () => {
    alert(
      "Para testar, atualize a coluna is_admin do seu usuário para true diretamente no banco de dados.",
    );
  };

  return {
    t,
    metrics,
    loading,
    error,
    router,
    handleMakeMeAdmin,
  };
}
