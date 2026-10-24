const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  mode?: string;
  systemPrompt?: string;
  messages?: IncomingMessage[];
}

const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

async function callGemini(
  geminiUrl: string,
  payload: Record<string, unknown>,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; body: string; data?: Record<string, unknown> }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    clearTimeout(timeout);

    let data: Record<string, unknown> | undefined;
    try {
      data = JSON.parse(text);
    } catch {
      // non-JSON response
    }

    return { ok: response.ok, status: response.status, body: text, data };
  } catch (err) {
    clearTimeout(timeout);
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: aborted ? 408 : 0,
      body: aborted ? 'Request timed out' : (err instanceof Error ? err.message : 'Unknown error'),
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key is not configured. Add GEMINI_API_KEY as an edge function secret.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body: RequestBody = await req.json();
    const systemPrompt = body.systemPrompt ?? 'You are a helpful study assistant.';
    const messages = body.messages ?? [];

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    };

    // First attempt
    let result = await callGemini(geminiUrl, payload, 20000);

    // Retry once on 503 (high demand) or 429 (rate limit) — transient errors
    if (result.status === 503 || result.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      result = await callGemini(geminiUrl, payload, 20000);
    }

    if (!result.ok) {
      console.error('Gemini API error:', result.status, result.body);
      if (result.status === 408) {
        return new Response(
          JSON.stringify({ error: 'The AI service took too long to respond. Please try again.' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (result.status === 503 || result.status === 429) {
        return new Response(
          JSON.stringify({ error: 'The AI service is busy right now. Please wait a moment and try again.' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({ error: 'The AI service returned an error. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const geminiData = result.data;
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') ??
      '';

    if (!reply) {
      return new Response(
        JSON.stringify({ error: 'The AI service returned an empty response. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
