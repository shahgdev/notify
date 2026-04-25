import axios from 'axios';
import type { ProcessedContent } from '@/store/learnStore';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY || '';

const SYSTEM_PROMPT = `You are a learning assistant. Given raw notes, return a JSON object with these keys:
- full_notes: the original content cleaned up, split into sections as an array of {heading, content}
- simplified: the same sections but explained like the user is 16, plain English, no jargon, array of {heading, content}
- key_points: a flat array of the 5-10 most important facts as short strings (max 15 words each)
- flashcards: array of {question, answer} — 6 to 10 cards for Practice mode
- quiz: array of {question, options: [4 strings], correct_index} — 5 questions for Practice mode
- difficulty_score: integer 1-5
Return only valid JSON, no markdown, no explanation.`;

export async function processNotesWithClaude(notes: string): Promise<ProcessedContent> {
  const response = await axios.post(
    CLAUDE_API_URL,
    {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: notes,
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
    }
  );

  const content = response.data.content[0].text;

  try {
    const parsed = JSON.parse(content) as ProcessedContent;
    return parsed;
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ProcessedContent;
    }
    throw new Error('Failed to parse AI response');
  }
}
