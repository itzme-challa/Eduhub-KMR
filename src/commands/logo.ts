import { Context } from 'telegraf';
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

const fontsDir = path.resolve(__dirname, '../assets/fonts');

// 🔁 Register all .ttf fonts in the folder and collect their names
const fontFamilies: string[] = [];

fs.readdirSync(fontsDir).forEach((file) => {
  const filePath = path.join(fontsDir, file);
  if (fs.statSync(filePath).isFile() && file.endsWith('.ttf')) {
    const familyName = path.parse(file).name.replace(/-/g, ''); // Clean font name
    try {
      registerFont(filePath, { family: familyName });
      fontFamilies.push(familyName);
    } catch (e) {
      console.warn(`❌ Failed to load font: ${file}`, e);
    }
  }
});

const generateLogo = async (text: string): Promise<Buffer> => {
  const width = 800;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const randomFont = fontFamilies[Math.floor(Math.random() * fontFamilies.length)] || 'sans-serif';

  // 🎨 Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // ✍️ Text config
  ctx.font = `bold 80px "${randomFont}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 🌈 Text color (solid or gradient)
  const useGradient = Math.random() < 0.5; // 50% chance
  if (useGradient) {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, getRandomTextColor());
    gradient.addColorStop(1, getRandomTextColor());
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = getRandomTextColor();
  }

  ctx.fillText(text, width / 2, height / 2);

  return canvas.toBuffer('image/png');
};

function getRandomTextColor(): string {
  const colors = [
    '#facc15', // Yellow
    '#34d399', // Green
    '#60a5fa', // Blue
    '#f472b6', // Pink
    '#c084fc', // Purple
    '#f87171', // Red
    '#fcd34d', // Amber
    '#38bdf8', // Sky Blue
    '#4ade80', // Lime Green
    '#e879f9'  // Fuchsia
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

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

    await ctx.replyWithPhoto({ source: imageBuffer }, {
      caption: `🖼️ Here's your logo with a random font!`,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error('Logo command error:', err);
    await ctx.reply('⚠️ Failed to generate logo. Try again.');
  }
};

export { logoCommand }; 
