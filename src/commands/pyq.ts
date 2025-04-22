import { Context } from 'telegraf';
import fetch from 'node-fetch';

interface Question {
  question_id: string;
  marks: number;
  negMarks: number;
  subject: string;
  chapter: string;
  content: string;
  options: { identifier: string; content: string }[];
  correct_options: string[];
  explanation: string;
}

export const pyq = () => async (ctx: Context) => {
  try {
    // Fetching the JSON data for the questions
    const res = await fetch('https://raw.githubusercontent.com/itzfew/Quizes/refs/heads/main/pyq/014be169-4893-5d08-a744-5ca0749e3c20.json');
    const data = await res.json();

    if (!data || !data.questions || data.questions.length === 0) {
      return ctx.reply('❌ No questions found.');
    }

    // Select a random question
    const randomQuestion: Question = data.questions[Math.floor(Math.random() * data.questions.length)];

    // Preparing question text and options
    const questionText = `*Question:* ${randomQuestion.content}\n\n*Options:*`;
    const optionsText = randomQuestion.options.map(
      (opt) => `\n${opt.identifier}) ${opt.content}`
    ).join('');

    // Send the question to the user
    const message = `${questionText}${optionsText}\n\n*Choose the correct option.*`;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('Failed to fetch PYQ:', err);
    await ctx.reply('⚠️ Failed to fetch the question. Try again later.');
  }
};
