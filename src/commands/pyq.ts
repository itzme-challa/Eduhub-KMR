import { Context } from 'telegraf';
import fetch from 'node-fetch';

interface Option {
  identifier: string;
  content: string;
}

interface Question {
  question_id: string;
  marks: number;
  negMarks: number;
  subject: string;
  chapter: string;
  content: string;
  options: Option[];
  correct_options: string[];
  explanation: string;
}

interface QuestionsJSON {
  questions: Question[];
}

export const pyq = () => async (ctx: Context) => {
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/itzfew/Quizes/refs/heads/main/pyq/014be169-4893-5d08-a744-5ca0749e3c20.json'
    );
    const data: QuestionsJSON = await res.json();

    if (!data.questions || data.questions.length === 0) {
      return ctx.reply('❌ No questions found.');
    }

    const q = data.questions[Math.floor(Math.random() * data.questions.length)];

    let message = `*PYQ (${q.subject.toUpperCase()} – ${q.chapter})*\n\n`;
    message += `*Q:* ${q.content.replace(/<[^>]+>/g, '')}\n\n`;

    for (const option of q.options) {
      message += `*${option.identifier}.* ${option.content.replace(/<[^>]+>/g, '')}\n`;
    }

    message += `\n_Reply with the correct option (e.g., A, B, C, D) to check the answer._`;

    await ctx.reply(message, { parse_mode: 'Markdown' });

    // Optionally, save the correct answer & explanation in session (or DB) for answer check later
    // Example: ctx.session.lastQuestion = q;

  } catch (err) {
    console.error('Failed to fetch PYQ:', err);
    await ctx.reply('⚠️ Failed to fetch PYQ. Try again later.');
  }
};
