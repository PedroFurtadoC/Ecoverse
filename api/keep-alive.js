// Ping que mantém o projeto Supabase free acordado.
//
// O plano gratuito pausa projetos que passam 7 dias sem atividade no banco.
// Health check de serviço não vale: responde 200 sem encostar no Postgres.
// Então o que roda aqui é um SELECT de verdade em profiles, leitura liberada
// pra anon pela policy profiles_select_all, sem expor dado de ninguém.
//
// Quem dispara é o cron da Vercel, agendado no vercel.json. Roda no plano
// Hobby normalmente; cron diário não exige Pro.

const URL_BASE = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // Se CRON_SECRET estiver cadastrado na Vercel, só aceita chamada assinada.
  // Sem ele o endpoint fica aberto, o que não é problema: a resposta não
  // devolve dado nenhum, só o status do ping.
  const segredo = process.env.CRON_SECRET;
  if (segredo && req.headers.authorization !== `Bearer ${segredo}`) {
    return res.status(401).json({ ok: false, erro: 'nao autorizado' });
  }

  if (!URL_BASE || !ANON_KEY) {
    return res.status(500).json({
      ok: false,
      erro: 'SUPABASE_URL e SUPABASE_ANON_KEY precisam estar nas env vars do projeto'
    });
  }

  try {
    const resposta = await fetch(`${URL_BASE}/rest/v1/profiles?select=id&limit=1`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        // Ping que volta de cache não toca o banco e não serve pra nada aqui.
        'Cache-Control': 'no-cache'
      }
    });

    res.setHeader('Cache-Control', 'no-store');

    if (!resposta.ok) {
      const corpo = await resposta.text();
      return res.status(502).json({
        ok: false,
        status: resposta.status,
        corpo: corpo.slice(0, 200)
      });
    }

    return res.status(200).json({ ok: true, status: resposta.status });
  } catch (err) {
    return res.status(502).json({ ok: false, erro: err?.message ?? String(err) });
  }
}
