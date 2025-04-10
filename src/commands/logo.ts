import { Context } from 'telegraf';
import { createCanvas, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs';

// Optional: Register custom font (make sure this font file exists)
registerFont(path.join(__dirname, '../../assets/fonts/Poppins-Bold.ttf'), {
  family: 'Poppins',
});

const WIDTH = 600;
const HEIGHT = 300;

export const logoCommand = () => async (ctx: Context) => {
  try {
    const messageText = ctx.message?.text;
    if (!messageText) return;

    const [_, ...args] = messageText.trim().split(' ');
    const logoText = args.join(' ').trim();

    if (!logoText) {
      return ctx.reply('❗ Please provide a name.\nExample: `/gen EduHub AI`', {
        parse_mode: 'Markdown',
      });
    }

    // Create canvas and context
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx2d = canvas.getContext('2d');

    // Background: Gradient
    const gradient = ctx2d.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(1, '#2a5298');
    ctx2d.fillStyle = gradient;
    ctx2d.fillRect(0, 0, WIDTH, HEIGHT);

    // Text styles
    ctx2d.font = 'bold 50px Poppins';
    ctx2d.fillStyle = '#ffffff';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';

    // Draw text
    ctx2d.fillText(logoText, WIDTH / 2, HEIGHT / 2);

    // Convert to buffer
    const buffer = canvas.toBuffer('image/png');

    await ctx.replyWithChatAction('upload_photo');
    await ctx.replyWithPhoto({ source: buffer }, {
      caption: `🎨 Logo generated for *${logoText}*`,
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('Logo generation error:', error);
    await ctx.reply('⚠️ Failed to generate logo. Please try again.');
  }
};
