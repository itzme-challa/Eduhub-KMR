import { Context } from 'telegraf';
import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import quizData from '../data/quiz/014be169-4893-5d08-a744-5ca0749e3c20.json';

// Register fonts if needed (make sure you have the font files)
registerFont(path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf'), { family: 'Roboto' });
registerFont(path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf'), { family: 'Roboto', weight: 'bold' });

export const quizImage = () => async (ctx: Context) => {
    try {
        if (!quizData.questions || quizData.questions.length === 0) {
            await ctx.reply('No quiz questions available at the moment.');
            return;
        }

        // Select a random question
        const randomIndex = Math.floor(Math.random() * quizData.questions.length);
        const question = quizData.questions[randomIndex];

        // Create canvas
        const canvasWidth = 800;
        const canvasHeight = 600;
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctxCanvas = canvas.getContext('2d');

        // Fill background
        ctxCanvas.fillStyle = '#f5f5f5';
        ctxCanvas.fillRect(0, 0, canvasWidth, canvasHeight);

        // Add header
        ctxCanvas.fillStyle = '#4285f4';
        ctxCanvas.fillRect(0, 0, canvasWidth, 80);

        // Add title
        ctxCanvas.font = 'bold 24px Roboto';
        ctxCanvas.fillStyle = '#ffffff';
        ctxCanvas.textAlign = 'center';
        ctxCanvas.fillText('Quiz Question', canvasWidth / 2, 50);

        // Add subject info
        ctxCanvas.font = '16px Roboto';
        ctxCanvas.fillStyle = '#333333';
        ctxCanvas.textAlign = 'left';
        ctxCanvas.fillText(`Subject: ${question.subject} | Chapter: ${question.chapter}`, 30, 120);

        // Add question
        ctxCanvas.font = '18px Roboto';
        const questionText = question.content.replace(/<br>|\$\$.+?\$\$|<\/?[^>]+>/g, '');
        wrapText(ctxCanvas, questionText, 30, 150, canvasWidth - 60, 24);

        // Add options
        ctxCanvas.font = '16px Roboto';
        let optionY = 300;
        question.options.forEach((option: any) => {
            const optionText = `${option.identifier}. ${option.content.replace(/\$\$.+?\$\$|<\/?[^>]+>/g, '')}`;
            wrapText(ctxCanvas, optionText, 50, optionY, canvasWidth - 80, 20);
            optionY += 60;
        });

        // Add footer
        ctxCanvas.fillStyle = '#4285f4';
        ctxCanvas.fillRect(0, canvasHeight - 40, canvasWidth, 40);
        ctxCanvas.font = '14px Roboto';
        ctxCanvas.fillStyle = '#ffffff';
        ctxCanvas.textAlign = 'center';
        ctxCanvas.fillText('Type your answer as A, B, C, or D', canvasWidth / 2, canvasHeight - 15);

        // Save to buffer
        const buffer = canvas.toBuffer('image/png');
        const tempFilePath = path.join(__dirname, '../temp/quiz.png');
        fs.writeFileSync(tempFilePath, buffer);

        // Send image
        await ctx.replyWithPhoto({ source: tempFilePath });

        // Clean up
        fs.unlinkSync(tempFilePath);
    } catch (error) {
        console.error('Failed to generate quiz image:', error);
        await ctx.reply('❌ Error generating quiz image.');
    }
};

// Helper function to wrap text
function wrapText(context: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && i > 0) {
            context.fillText(line, x, currentY);
            line = words[i] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }

    context.fillText(line, x, currentY);
}
