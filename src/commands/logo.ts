import { Context } from 'telegraf';
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

// 🔐 Safe font registration
const fontPath = path.resolve(__dirname, '../assets/fonts/Poppins-Bold.ttf');
if (fs.existsSync(fontPath)) {
  registerFont(fontPath, { family: 'Poppins' });
} else {
  console.warn('❌ Font not found at:', fontPath);
}

const generateLogo = async (text: string): Promise<Buffer> => {
  const width = 800;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f172a'; // dark blue
  ctx.fillRect(0, 0, width, height);

  // Text
  ctx.font = 'bold 80px Poppins';
  ctx.fillStyle = '#facc15'; // yellow
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  return canvas.toBuffer('image/png');
};

const logoCommand = () => async (ctx: Context) => {
  try {
    const message = ctx.message;
    const text = message?.text || '';

    const match = text.match(/^\/gen(?:logo)?\s+(.+)/i);
    if (!match) {
      return ctx.reply('❗ Usage: `/gen LogoName`', { parse_mode: 'Markdown' });
    }

    const logoText = match[1].trim();
    const imageBuffer = await generateLogo(logoText);

    await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `🖼️ Here's your logo for *${logoText}*`, parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Logo command error:', err);
    await ctx.reply('⚠️ Failed to generate logo. Try again.');
  }
};

export { logoCommand };
