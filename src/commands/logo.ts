import { Context } from 'telegraf';
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

const fontsDir = path.resolve(__dirname, '../assets/fonts');
const fontFamilies: string[] = [];

// 🔁 Load all fonts
fs.readdirSync(fontsDir).forEach((file) => {
  const filePath = path.join(fontsDir, file);
  if (fs.statSync(filePath).isFile() && file.endsWith('.ttf')) {
    const familyName = path.parse(file).name.replace(/-/g, '');
    try {
      registerFont(filePath, { family: familyName });
      fontFamilies.push(familyName);
    } catch (e) {
      console.warn(`❌ Failed to load font: ${file}`, e);
    }
  }
});

// 🎨 Utility for random gradients and colors
const getRandomGradient = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const colors = [
    ['#ff6b6b', '#f06595'],
    ['#3b82f6', '#06b6d4'],
    ['#22c55e', '#84cc16'],
    ['#a855f7', '#ec4899'],
    ['#f59e0b', '#ef4444'],
    ['#0ea5e9', '#9333ea'],
    ['#14b8a6', '#f97316']
  ];
  const [start, end] = colors[Math.floor(Math.random() * colors.length)];
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);
  return gradient;
};

const getRandomTextColor = () => {
  const colors = ['#ffffff', '#facc15', '#e2e8f0', '#f1f5f9', '#cbd5e1'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const generateLogo = async (text: string): Promise<Buffer> => {
  const size = 800;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const font = fontFamilies[Math.floor(Math.random() * fontFamilies.length)] || 'sans-serif';
  const gradient = getRandomGradient(ctx, size, size);

  // 🔲 Background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // ✍️ Text Styling
  ctx.font = `bold 90px "${font}"`;
  ctx.fillStyle = getRandomTextColor();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 🕶️ Optional shadow for better visibility
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  ctx.fillText(text, size / 2, size / 2);

  return canvas.toBuffer('image/png');
};

// 🎯 Telegram Logo Command
const logoCommand = () => async (ctx: Context) => {
  try {
    const text = ctx.message?.text || '';
    const match = text.match(/^\/gen(?:logo)?\s+(.+)/i);
    if (!match) {
      return ctx.reply('❗ Usage: `/gen LogoName`', { parse_mode: 'Markdown' });
    }

    const logoText = match[1].trim();
    const imageBuffer = await generateLogo(logoText);

    await ctx.replyWithPhoto({ source: imageBuffer }, {
      caption: `🎨 Here's your stylish logo!`,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    console.error('⚠️ Logo generation error:', err);
    await ctx.reply('⚠️ Failed to generate logo. Try again.');
  }
};

export { logoCommand };
