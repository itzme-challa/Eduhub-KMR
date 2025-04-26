import { Context } from "telegraf";
import fetch from "node-fetch";
import { createCanvas, loadImage } from "canvas";

interface Option {
  identifier: string;
  content: string;
}

interface Question {
  question_id: string;
  content: string;
  options: Option[];
  correct_options: string[];
  explanation: string;
}

interface QuizData {
  questions: Question[];
}

function cleanHTML(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/\$\$/g, '');
}

export async function quizimg(ctx: Context) {
  try {
    const response = await fetch("https://raw.githubusercontent.com/itzfew/Quizes/refs/heads/main/pyq/014be169-4893-5d08-a744-5ca0749e3c20.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as QuizData[];

    const questions = data[0]?.questions;

    if (!questions || questions.length === 0) {
      await ctx.reply("❌ No questions found.");
      return;
    }

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

    const questionText = cleanHTML(randomQuestion.content);
    const options = randomQuestion.options.map(opt => `${opt.identifier}. ${cleanHTML(opt.content)}`).join('\n');

    const canvas = createCanvas(1080, 1080);
    const ctx2d = canvas.getContext('2d');

    // Background white
    ctx2d.fillStyle = "#ffffff";
    ctx2d.fillRect(0, 0, canvas.width, canvas.height);

    // Text settings
    ctx2d.fillStyle = "#000000";
    ctx2d.font = "bold 30px Arial";

    let y = 60;
    const lineHeight = 40;

    const lines = (questionText + '\n\n' + options).split('\n');

    for (const line of lines) {
      ctx2d.fillText(line.trim(), 50, y);
      y += lineHeight;
    }

    const buffer = canvas.toBuffer();

    await ctx.replyWithPhoto({ source: buffer }, { caption: "Here's your random quiz!" });

  } catch (error) {
    console.error(error);
    await ctx.reply("❌ Error fetching quiz.");
  }
}
