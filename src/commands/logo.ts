import { Context } from 'telegraf';
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

const fontsDir = path.resolve(__dirname, '../assets/fonts');
const fontFamilies: string[] = [];

// ✅ Register all .ttf and .otf fonts
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

// 🎨 Logo Generator
const generateLogo = async (text: string): Promise<Buffer> => {
  const width = 1000;
  const height = 350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const randomFont = fontFamilies[Math.floor(Math.random() * fontFamilies.length)] || 'sans-serif';
  const baseFontSize = 80;

  // 🖼️ Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // 🎲 Random decoration emojis
  const emojis = ['✨', '🔥', '💥', '🎯', '🧠', '⚡', '🌟'];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  const decoratedText = `${randomEmoji} ${text.toUpperCase()} ${randomEmoji}`;

  // 📐 Fit font size to width
  let fontSize = baseFontSize;
  do {
    ctx.font = `bold ${fontSize}px "${randomFont}"`;
    fontSize -= 2;
  } while (ctx.measureText(decoratedText).width > width * 0.9 && fontSize > 10);

  // ✨ Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  // 💫 Text style
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 🎨 Gradient or Solid
  const useGradient = Math.random() < 0.5;
  if (useGradient) {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, getRandomTextColor());
    gradient.addColorStop(1, getRandomTextColor());
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = getRandomTextColor();
  }

  // 🔁 Optional text rotation (e.g., ±10 degrees)
  const rotation = (Math.random() * 20 - 10) * (Math.PI / 180); // between -10° to 10°
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(rotation);
  ctx.fillText(decoratedText, 0, 0);
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

// 📦 Command Handler
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
      caption: `🖼️ Here's your fancy logo with random font, style & decoration!`,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    console.error('⚠️ Logo command error:', err);
    await ctx.reply('⚠️ Failed to generate logo. Try again.');
  }
};

export { logoCommand };
