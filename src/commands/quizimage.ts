import { Context } from 'telegraf';
import { createCanvas, loadImage } from 'canvas';
import quizData from '../data/quiz/014be169-4893-5d08-a744-5ca0749e3c20.json';
import fs from 'fs';
import path from 'path';

export const quizImage = () => async (ctx: Context) => {
  try {
    const questions = quizData.questions;
    if (!questions || questions.length === 0) {
      await ctx.reply('No quiz questions available right now.');
      return;
    }

    // Pick a random question
    const randomIndex = Math.floor(Math.random() * questions.length);
    const question = questions[randomIndex];

    // Create canvas
    const width = 800;
    const height = 1000;
    const canvas = createCanvas(width, height);
    const ctx2d = canvas.getContext('2d');

    // Background
    ctx2d.fillStyle = '#ffffff';
    ctx2d.fillRect(0, 0, width, height);

    // Text styles
    ctx2d.fillStyle = '#000000';
    ctx2d.font = 'bold 28px Sans-serif';
    ctx2d.fillText('Random Quiz Question', 50, 50);

    ctx2d.font = '20px Sans-serif';
    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx2d.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx2d.fillText(line, x, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx2d.fillText(line, x, y);
      return y + lineHeight;
    };

    let currentY = 100;
    currentY = wrapText(question.content.replace(/<[^>]*>/g, '').replace(/\$\$/g, ''), 50, currentY, 700, 30);

    // Options
    ctx2d.font = '18px Sans-serif';
    question.options.forEach((option, index) => {
      const optionText = `${option.identifier}. ${option.content.replace(/<[^>]*>/g, '').replace(/\$\$/g, '')}`;
      currentY = wrapText(optionText, 70, currentY + 10, 660, 25);
    });

    // Save to buffer
    const buffer = canvas.toBuffer('image/png');

    // Save temporarily (optional)
    const tempPath = path.join(__dirname, 'temp_quiz.png');
    fs.writeFileSync(tempPath, buffer);

    // Send photo
    await ctx.replyWithPhoto({ source: tempPath });

    // Clean up file
    fs.unlinkSync(tempPath);

  } catch (error) {
    console.error('Failed to generate quiz image:', error);
    await ctx.reply('❌ Error generating quiz image.');
  }
};
