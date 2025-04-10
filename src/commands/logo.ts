import { Context } from 'telegraf';
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

const fontsDir = path.resolve(__dirname, '../assets/fonts');
const fontFamilies: string[] = [];

// Load all .ttf fonts from the fonts directory
fs.readdirSync(fontsDir).forEach((file) => {
  const filePath = path.join(fontsDir, file);
  if (fs.statSync(filePath).isFile() && file.endsWith('.ttf')) {
    const familyName = path.parse(file).name.replace(/[-_]/g, '');
    try {
      registerFont(filePath, { family: familyName });
      fontFamilies.push(familyName);
    } catch (e) {
      console.warn(`⚠️ Font load error for ${file}:`, e);
    }
  }
});

const generateLogo = async (text: string, height = 600, width = 600): Promise<Buffer> => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const randomFont = fontFamilies[Math.floor(Math.random() * fontFamilies.length)] || 'sans-serif';

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Text
  const fontSize = Math.min(width, height) / text.length < 10 ? 60 : 80;
  ctx.font = `bold ${fontSize}px "${randomFont}"`;
  ctx.fillStyle = '#facc15';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  return canvas.toBuffer('image/png');
};

const logoCommand = () => async (ctx: Context) => {
  try {
    const message = ctx.message;
    const text = message?.text || '';

    // Match pattern: /gen LogoName [#Height] [#Width]
    const match = text.match(/^\/gen(?:logo)?\s+([^\s#]+)(?:\s+#(\d+))?(?:\s+#(\d+))?/i);
    if (!match) {
      return ctx.reply('❗ Usage:\n`/gen Eduhub`\n`/gen Eduhub #400 #800`', {
        parse_mode: 'Markdown',
      });
    }

    const logoText = match[1].trim();
    const height = match[2] ? parseInt(match[2]) : 600;
    const width = match[3] ? parseInt(match[3]) : 600;

    const imageBuffer = await generateLogo(logoText, height, width);

    await ctx.replyWithPhoto({ source: imageBuffer }, {
      caption: `🎨 Logo generated with random font!\nSize: ${height}x${width}px`,
    });
  } catch (err) {
    console.error('Logo generation error:', err);
    await ctx.reply('⚠️ Failed to generate logo. Please try again.');
  }
};

export { logoCommand };
