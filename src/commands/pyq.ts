import { Context } from 'telegraf';
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

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

// Dynamically import node-fetch
const fetch = async () => {
  const { default: fetch } = await import('node-fetch');
  return fetch;
};

export const pyq = () => async (ctx: Context) => {
  try {
    // Fetching the JSON data for the questions
    const fetchFunction = await fetch(); // Import fetch dynamically
    const res = await fetchFunction('https://raw.githubusercontent.com/itzfew/Quizes/master/pyq/014be169-4893-5d08-a744-5ca0749e3c20.json');
    const data = await res.json();

    // Ensure data is in the correct format
    if (!data || !data[0]?.questions || data[0].questions.length === 0) {
      return ctx.reply('❌ No questions found.');
    }

    // Select a random question from the first element of the array
    const randomQuestion: Question = data[0].questions[Math.floor(Math.random() * data[0].questions.length)];

    // Set up canvas size
    const canvasWidth = 800;
    const canvasHeight = 600;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctxCanvas = canvas.getContext('2d');

    // Draw background
    ctxCanvas.fillStyle = '#ffffff';
    ctxCanvas.fillRect(0, 0, canvasWidth, canvasHeight);

    // Set up text styles
    ctxCanvas.font = '20px Arial';
    ctxCanvas.fillStyle = '#000000';

    // Draw the question text
    const questionContent = randomQuestion.content.replace(/<\/?[^>]+(>|$)/g, ""); // Removing any HTML tags
    ctxCanvas.fillText(`Question: ${questionContent}`, 20, 40);

    // Draw options
    let yOffset = 80;
    randomQuestion.options.forEach((opt) => {
      ctxCanvas.fillText(`${opt.identifier}) ${opt.content}`, 20, yOffset);
      yOffset += 40;
    });

    // Save the image to a file
    const outputFilePath = path.join(__dirname, 'question_image.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputFilePath, buffer);

    // Send the image to the user
    await ctx.replyWithPhoto({ source: outputFilePath });

    // Clean up the file after sending
    fs.unlinkSync(outputFilePath);

  } catch (err) {
    console.error('Failed to fetch PYQ:', err);
    await ctx.reply('⚠️ Failed to fetch the question. Try again later.');
  }
};
