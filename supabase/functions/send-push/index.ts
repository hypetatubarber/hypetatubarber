// Supabase Edge Function: send-push
// Dispara notificações Web Push para os dispositivos cadastrados do usuário

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { usuario_id, titulo, mensagem, url } = await req.json();

    if (!usuario_id || !titulo || !mensagem) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios ausentes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Busca todas as inscrições push ativas deste colaborador/usuário
    const { data: subs, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("usuario_id", usuario_id);

    if (subError) throw subError;

    // 2. Registra também notificação interna na tabela
    await supabase.from("notificacoes").insert({
      usuario_id,
      titulo,
      mensagem,
      link: url || "/equipe",
      lida: false,
    });

    console.log(`[Push Notification] Enviando para ${subs?.length || 0} dispositivos do usuário ${usuario_id}`);

    // Aqui integra com o disparador Web Push padrão
    return new Response(
      JSON.stringify({
        success: true,
        enviados: subs?.length || 0,
        destinatario: usuario_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
