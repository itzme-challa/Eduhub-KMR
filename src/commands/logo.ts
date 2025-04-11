import { Context } from 'telegraf';
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

const fontsDir = path.resolve(__dirname, '../assets/fonts');
const fontFamilies: string[] = [];

// 📦 Register all .ttf and .otf fonts in the folder
fs.readdirSync(fontsDir).forEach((file) => {
  const filePath = path.join(fontsDir, file);
  if (fs.statSync(filePath).isFile() && /\.(ttf|otf)$/i.test(file)) {
    const familyName = path.parse(file).name.replace(/[-_\s]/g, '');
    try {
      registerFont(filePath, { family: familyName });
      fontFamilies.push(familyName);
    } catch (e) {
      console.warn(`❌ Failed to load font: ${file}`, e);
    }
  }
});

const generateLogo = async (text: string): Promise<Buffer> => {
  const width = 1000;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const randomFont = fontFamilies[Math.floor(Math.random() * fontFamilies.length)] || 'sans-serif';

  // 🎨 Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // 📚 Line splitting logic
  const words = text.trim().split(/\s+/);
  let line1 = '', line2 = '';

  if (words.length === 1) {
    line1 = words[0];
  } else if (words.length === 2) {
    [line1, line2] = words;
  } else {
    line2 = words.pop()!;
    line1 = words.join(' ');
  }

  // 🧠 Auto-fit font size (based on longest line)
  const baseFontSize = 80;
  let fontSize = baseFontSize;
  do {
    ctx.font = `bold ${fontSize}px "${randomFont}"`;
    fontSize -= 2;
  } while (
    Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) > width * 0.85 &&
    fontSize > 10
  );

  ctx.font = `bold ${fontSize}px "${randomFont}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 💎 Text Fill Style
  const useGradient = Math.random() < 0.5;
  if (useGradient) {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, getRandomTextColor());
    gradient.addColorStop(1, getRandomTextColor());
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = getRandomTextColor();
  }

  // 🌑 Multi-layer shadow
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 6;

  // 🔁 Optional rotation
  const angle = (Math.random() * 10 - 5) * (Math.PI / 180);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(angle);

  // 🖊️ Draw text lines
  const lineHeight = fontSize + 20;
  if (line1) ctx.fillText(line1.toUpperCase(), 0, -lineHeight / 2);
  if (line2) ctx.fillText(line2.toUpperCase(), 0, lineHeight / 2);

  ctx.restore();

  return canvas.toBuffer('image/png');
};

function getRandomTextColor(): string {
  const colors = [
    '#facc15', '#34d399', '#60a5fa', '#f472b6', '#c084fc',
    '#f87171', '#fcd34d', '#38bdf8', '#4ade80', '#e879f9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// 🧩 Command
const logoCommand = () => async (ctx: Context) => {
  try {
    const message = ctx.message;
    const text = message?.text || '';
    const match = text.match(/^\/gen(?:logo)?\s+(.+)/i);

    if (!match) {
      return ctx.reply('❗ Usage: `/gen LogoText`', { parse_mode: 'Markdown' });
    }

    const logoText = match[1].trim();
    const imageBuffer = await generateLogo(logoText);

    await ctx.replyWithPhoto({ source: imageBuffer }, {
      caption: `🖼️ Here's your logo with random font, strong shadows, and auto-styling.`,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    console.error('⚠️ Logo command error:', err);
    await ctx.reply('⚠️ Failed to generate logo. Try again.');
  }
};

export { logoCommand };
