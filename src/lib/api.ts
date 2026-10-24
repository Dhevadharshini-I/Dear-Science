import { MODE_SYSTEM_PROMPTS, type Message, type StudyMode } from '@/types';

interface GeminiResponse {
  reply: string;
}

export async function fetchAIResponse(
  conversation: Message[],
  mode: StudyMode,
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Backend is not configured. Please check your setup.');
  }

  const endpoint = `${supabaseUrl}/functions/v1/gemini-chat`;

  const systemPrompt = MODE_SYSTEM_PROMPTS[mode];
  const history = conversation.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        mode,
        systemPrompt,
        messages: history,
      }),
    });
  } catch {
    throw new Error('Could not reach the server. Please check your connection and try again.');
  }

  if (!response.ok) {
    if (response.status === 503) {
      let detail = '';
      try {
        const body = await response.json();
        detail = body?.error ?? '';
      } catch {
        // response body wasn't JSON
      }
      if (detail.includes('not configured') || detail.includes('API key')) {
        throw new Error('The AI service is not yet configured. Please add a Gemini API key to activate responses.');
      }
      throw new Error(detail || 'The AI service is busy right now. Please wait a moment and try again.');
    }
    if (response.status === 429) {
      throw new Error('You are asking questions too quickly. Please wait a moment and try again.');
    }
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error ?? '';
    } catch {
      // response body wasn't JSON
    }
    throw new Error(detail || `The server returned an error (${response.status}). Please try again.`);
  }

  let data: GeminiResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error('Received an invalid response from the server. Please try again.');
  }

  if (!data || typeof data.reply !== 'string') {
    throw new Error('The response was missing expected content. Please try again.');
  }

  return data.reply;
}
