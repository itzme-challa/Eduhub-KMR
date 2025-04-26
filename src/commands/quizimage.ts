import { Context } from "telegraf";
import fs from "fs";
import path from "path";
import { createCanvas, loadImage, registerFont } from "canvas";

// Optional: register a custom font if needed
// registerFont('path-to-your-font.ttf', { family: 'CustomFont' });

export async function quizimg(ctx: Context) {
  try {
    // Load the local JSON file
    const filePath = path.join(__dirname, "../data/quiz/014be169-4893-5d08-a744-5ca0749e3c20.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(rawData) as { questions: any[] }[];

    // Pick a random question
    const allQuestions = jsonData.flatMap(q => q.questions);
    const randomQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];

    if (!randomQuestion) {
      await ctx.reply("❌ Error: No questions found.");
      return;
    }

    // Canvas settings
    const width = 1000;
    const margin = 50;
    let textContent = randomQuestion.content.replace(/<br\s*\/?>/gi, "\n").replace(/\$\$/g, ""); // clean HTML
    const optionsText = randomQuestion.options.map(
      (opt: any) => `${opt.identifier}) ${opt.content.replace(/\$\$/g, "").replace(/<br\s*\/?>/gi, "\n")}`
    ).join("\n\n");

    textContent += "\n\n" + optionsText;

    const lines = textContent.split("\n");
    const lineHeight = 40;
    const height = Math.max(400, margin * 2 + lines.length * lineHeight);

    const canvas = createCanvas(width, height);
    const ctx2d = canvas.getContext("2d");

    // Background
    ctx2d.fillStyle = "#ffffff";
    ctx2d.fillRect(0, 0, width, height);

    // Text
    ctx2d.fillStyle = "#000000";
    ctx2d.font = "bold 24px sans-serif";

    let y = margin;
    for (const line of lines) {
      ctx2d.fillText(line.trim(), margin, y);
      y += lineHeight;
    }

    const buffer = canvas.toBuffer();

    // Send the image
    await ctx.replyWithPhoto({ source: buffer }, { caption: `📝 Random Quiz\nSubject: ${randomQuestion.subject}\nChapter: ${randomQuestion.chapter}` });
  } catch (error) {
    console.error(error);
    await ctx.reply("❌ Error fetching quiz image.");
  }
}
