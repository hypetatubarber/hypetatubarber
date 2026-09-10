// Deno Edge Function para Webhook do WhatsApp (Evolution API)
// Caminho: supabase/functions/webhook-whatsapp/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ status: "online", endpoint: "webhook-whatsapp" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  try {
    const payload = await req.json();
    console.log("[Webhook WhatsApp] Evento recebido:", payload.event);

    if (payload.event === "messages.upsert" || payload.event === "MESSAGES_UPSERT") {
      const data = payload.data;
      const key = data?.key;

      // Ignora mensagens enviadas pelo próprio bot/estúdio
      if (key?.fromMe) {
        return new Response(JSON.stringify({ status: "ignored_from_me" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }

      const remoteJid = key?.remoteJid || "";
      const numero = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
      const nomeRemetente = data?.pushName || "";
      const conteudo =
        data?.message?.conversation ||
        data?.message?.extendedTextMessage?.text ||
        data?.message?.imageMessage?.caption ||
        "[Mídia ou áudio recebido via WhatsApp]";

      const messageId = key?.id || `msg-${Date.now()}`;
      const timestamp = data?.messageTimestamp
        ? new Date(Number(data.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      if (!numero || !conteudo) {
        return new Response(JSON.stringify({ status: "missing_fields" }), {
          headers: { "Content-Type": "application/json" },
          status: 400,
        });
      }

      // 1. Verifica se já existe conversa com esse número
      const cleanNum = numero.replace(/\D/g, "");
      const { data: convData } = await supabase
        .from("conversas")
        .select("*")
        .or(`numero.eq.${numero},numero.eq.${cleanNum}`)
        .maybeSingle();

      let conversaId = convData?.id;

      if (!conversaId) {
        // Tenta vincular com cliente existente pelo final do telefone
        const { data: cliente } = await supabase
          .from("clientes")
          .select("id, nome, avatar_url")
          .ilike("telefone", `%${cleanNum.slice(-8)}%`)
          .maybeSingle();

        const { data: novaConv, error: errConv } = await supabase
          .from("conversas")
          .insert({
            numero,
            nome: nomeRemetente || cliente?.nome || `WhatsApp ${numero.slice(-4)}`,
            cliente_id: cliente?.id,
            avatar_url: cliente?.avatar_url,
            ultima_mensagem: conteudo,
            ultima_mensagem_em: timestamp,
            nao_lidas: 1,
            status: "ativa",
          })
          .select()
          .single();

        if (errConv) throw errConv;
        conversaId = novaConv.id;
      } else {
        // Atualiza conversa existente
        await supabase
          .from("conversas")
          .update({
            ultima_mensagem: conteudo,
            ultima_mensagem_em: timestamp,
            nao_lidas: (convData.nao_lidas || 0) + 1,
            atualizado_em: timestamp,
          })
          .eq("id", conversaId);
      }

      // 2. Salva a mensagem recebida
      const { error: errMsg } = await supabase.from("mensagens").insert({
        id: messageId,
        conversa_id: conversaId,
        numero,
        conteudo,
        direcao: "recebida",
        status: "entregue",
        criado_em: timestamp,
      });

      if (errMsg) throw errMsg;

      return new Response(JSON.stringify({ success: true, conversaId, messageId }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ status: "event_unhandled", event: payload.event }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[Webhook Error]:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
