import { Context } from 'telegraf';
import { createCanvas } from 'canvas';

interface Question {
  content: string;
  options: { identifier: string; content: string }[];
}

export const quizimg = () => async (ctx: Context) => {
  try {
    // Dynamic import of fetch
    const fetch = (await import('node-fetch')).default;

    const response = await fetch('https://raw.githubusercontent.com/itzfew/Quizes/refs/heads/main/pyq/014be169-4893-5d08-a744-5ca0749e3c20.json');
    const data = await response.json();

    const questions: Question[] = data[0]?.questions;
    if (!questions || questions.length === 0) {
      await ctx.reply('❌ No questions available.');
      return;
    }

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

    // Create canvas
    const width = 1000;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx2d = canvas.getContext('2d');

    // White background
    ctx2d.fillStyle = 'white';
    ctx2d.fillRect(0, 0, width, height);

    // Text style
    ctx2d.fillStyle = 'black';
    ctx2d.font = '20px sans-serif';
    ctx2d.textBaseline = 'top';

    let textY = 20;

    // Draw question
    const questionText = randomQuestion.content.replace(/<br>/g, '\n').replace(/<\/?[^>]+(>|$)/g, '').replace(/\$\$/g, '');
    wrapText(ctx2d, "Q. " + questionText, 20, textY, width - 40, 28);

    // Draw options
    randomQuestion.options.forEach((option, idx) => {
      textY += 120 + idx * 60;
      wrapText(ctx2d, `${option.identifier}. ${option.content.replace(/\$\$/g, '')}`, 40, textY, width - 80, 26);
    });

    // Send the image
    const buffer = canvas.toBuffer();
    await ctx.replyWithPhoto({ source: buffer }, { caption: '🧪 Random Quiz' });

  } catch (error) {
    console.error('Error sending quiz image:', error);
    await ctx.reply('❌ Error fetching quiz.');
  }
};

// Helper function for wrapping text
function wrapText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
