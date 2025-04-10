import { Context } from 'telegraf';
import { createCanvas, registerFont, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import axios from 'axios';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Configuration
const CONFIG = {
  CANVAS_SIZE: 1024,
  FONT_DIR: path.resolve(__dirname, '../assets/fonts'),
  TEMP_DIR: path.resolve(__dirname, '../temp'),
  ASSETS_DIR: path.resolve(__dirname, '../assets'),
  MAX_TEXT_LENGTH: 20,
  DEFAULT_FONT_SIZE: 120,
  MIN_FONT_SIZE: 40,
  BACKGROUND_OPACITY: 0.8
};

// Font management
class FontManager {
  private static instance: FontManager;
  private fonts: string[] = [];
  private loaded = false;

  private constructor() {}

  public static getInstance(): FontManager {
    if (!FontManager.instance) {
      FontManager.instance = new FontManager();
    }
    return FontManager.instance;
  }

  public async loadFonts(): Promise<void> {
    if (this.loaded) return;

    try {
      if (!fs.existsSync(CONFIG.FONT_DIR)) {
        fs.mkdirSync(CONFIG.FONT_DIR, { recursive: true });
        return;
      }

      const fontFiles = fs.readdirSync(CONFIG.FONT_DIR);
      for (const file of fontFiles) {
        const filePath = path.join(CONFIG.FONT_DIR, file);
        if (fs.statSync(filePath).isFile() && (file.endsWith('.ttf') || file.endsWith('.otf'))) {
          const familyName = path.parse(file).name.replace(/[^a-zA-Z0-9]/g, '');
          try {
            registerFont(filePath, { family: familyName });
            this.fonts.push(familyName);
          } catch (e) {
            console.warn(`Failed to load font: ${file}`, e);
          }
        }
      }
      this.loaded = true;
    } catch (err) {
      console.error('Error loading fonts:', err);
    }
  }

  public getRandomFont(): string {
    if (this.fonts.length === 0) return 'Arial';
    return this.fonts[Math.floor(Math.random() * this.fonts.length)];
  }

  public getFonts(): string[] {
    return [...this.fonts];
  }
}

// Color utilities
class ColorUtils {
  static gradientPresets = [
    ['#FF416C', '#FF4B2B'],
    ['#4776E6', '#8E54E9'],
    ['#00c6ff', '#0072ff'],
    ['#43cea2', '#185a9d'],
    ['#ff8008', '#ffc837'],
    ['#8E2DE2', '#4A00E0'],
    ['#1A2980', '#26D0CE']
  ];

  static textColors = [
    '#FFFFFF', '#F8F8F8', '#E0E0E0', 
    '#FFD700', '#FFA500', '#FF6347',
    '#7FFFD4', '#ADFF2F', '#FF69B4'
  ];

  static getRandomGradient(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const [start, end] = this.gradientPresets[Math.floor(Math.random() * this.gradientPresets.length)];
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, start);
    gradient.addColorStop(1, end);
    return gradient;
  }

  static getRandomTextColor() {
    return this.textColors[Math.floor(Math.random() * this.textColors.length)];
  }

  static hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

// Shape utilities
class ShapeUtils {
  static drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// Logo Generator
class LogoGenerator {
  private fontManager = FontManager.getInstance();

  constructor() {
    this.fontManager.loadFonts();
  }

  private async loadTemplate(templateName: string): Promise<Buffer | null> {
    try {
      const templatePath = path.join(CONFIG.ASSETS_DIR, 'templates', `${templateName}.png`);
      return await readFile(templatePath);
    } catch {
      return null;
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  }

  private calculateFontSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): number {
    let fontSize = CONFIG.DEFAULT_FONT_SIZE;
    ctx.font = `bold ${fontSize}px ${this.fontManager.getRandomFont()}`;
    
    while (ctx.measureText(text).width > maxWidth && fontSize > CONFIG.MIN_FONT_SIZE) {
      fontSize -= 5;
      ctx.font = `bold ${fontSize}px ${this.fontManager.getRandomFont()}`;
    }
    
    return fontSize;
  }

  public async generateLogo(
    text: string,
    options: {
      template?: string;
      bgColor?: string;
      textColor?: string;
      shape?: 'circle' | 'square' | 'rounded';
      watermark?: boolean;
    } = {}
  ): Promise<Buffer> {
    const canvas = createCanvas(CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Background
    if (options.template) {
      const templateBuffer = await this.loadTemplate(options.template);
      if (templateBuffer) {
        const templateImg = await loadImage(templateBuffer);
        ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = options.bgColor || ColorUtils.getRandomGradient(ctx, canvas.width, canvas.height);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      ctx.fillStyle = options.bgColor || ColorUtils.getRandomGradient(ctx, canvas.width, canvas.height);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Text container shape
    const shapeSize = canvas.width * 0.8;
    const shapeX = centerX - shapeSize / 2;
    const shapeY = centerY - shapeSize / 2;

    ctx.fillStyle = ColorUtils.hexToRgba('#000000', 0.3);
    
    if (options.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(centerX, centerY, shapeSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (options.shape === 'rounded') {
      ShapeUtils.drawRoundedRect(ctx, shapeX, shapeY, shapeSize, shapeSize, 50);
      ctx.fill();
    } else {
      ctx.fillRect(shapeX, shapeY, shapeSize, shapeSize);
    }

    // Text styling
    const fontSize = this.calculateFontSize(ctx, text, shapeSize * 0.9);
    ctx.font = `bold ${fontSize}px ${this.fontManager.getRandomFont()}`;
    ctx.fillStyle = options.textColor || ColorUtils.getRandomTextColor();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Draw text
    ctx.fillText(text, centerX, centerY);

    // Watermark
    if (options.watermark) {
      ctx.font = '20px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.shadowBlur = 0;
      ctx.fillText('Generated by LogoBot', canvas.width - 20, canvas.height - 20);
    }

    return canvas.toBuffer('image/png');
  }

  public async generateLogoFromUrl(text: string, imageUrl: string): Promise<Buffer> {
    const canvas = createCanvas(CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);
    const ctx = canvas.getContext('2d');
    
    try {
      const imageBuffer = await this.downloadImage(imageUrl);
      const img = await loadImage(imageBuffer);
      
      // Draw background image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Add overlay for better text visibility
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add text
      const fontSize = this.calculateFontSize(ctx, text, canvas.width * 0.8);
      ctx.font = `bold ${fontSize}px ${this.fontManager.getRandomFont()}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      
      return canvas.toBuffer('image/png');
    } catch (err) {
      console.error('Error generating logo from URL:', err);
      // Fallback to regular logo if URL fails
      return this.generateLogo(text);
    }
  }
}

// Telegram command handler
const logoCommand = () => {
  const logoGenerator = new LogoGenerator();

  return async (ctx: Context) => {
    try {
      const text = ctx.message?.text || '';
      const match = text.match(/^\/gen(?:logo)?(?:\s+([^\n]+))?/i);
      
      if (!match || !match[1]) {
        const helpText = [
          '🎨 *Logo Generator Help* 🎨',
          '',
          'Usage:',
          '`/gen YourText` - Generate random logo',
          '`/gen YourText -t template1` - Use specific template',
          '`/gen YourText -c #FF5733` - Set custom text color',
          '`/gen YourText -b #FFFFFF` - Set custom background',
          '`/gen YourText -s circle` - Set shape (circle/square/rounded)',
          '',
          'Example:',
          '`/gen MyCompany -t tech -c #FFFFFF -s circle`'
        ].join('\n');
        
        return ctx.reply(helpText, { parse_mode: 'Markdown' });
      }

      const inputText = match[1].trim();
      if (inputText.length > CONFIG.MAX_TEXT_LENGTH) {
        return ctx.reply(`❌ Text too long. Maximum ${CONFIG.MAX_TEXT_LENGTH} characters.`);
      }

      // Parse options (simple version for demo)
      const options: any = {};
      const optionRegex = /-(\w+)\s+([^\s-]+)/g;
      let optionMatch;
      
      while ((optionMatch = optionRegex.exec(inputText)) !== null) {
        const [_, flag, value] = optionMatch;
        switch (flag.toLowerCase()) {
          case 't': options.template = value; break;
          case 'c': options.textColor = value; break;
          case 'b': options.bgColor = value; break;
          case 's': options.shape = value; break;
        }
      }

      // Extract just the text without options
      const logoText = inputText.replace(/-(\w+)\s+([^\s-]+)/g, '').trim();

      // Generate logo
      const imageBuffer = await logoGenerator.generateLogo(logoText, options);

      // Send result
      await ctx.replyWithPhoto(
        { source: imageBuffer },
        {
          caption: `✨ Here's your "${logoText}" logo!`,
          parse_mode: 'Markdown'
        }
      );

    } catch (err) {
      console.error('Logo generation error:', err);
      await ctx.reply('⚠️ An error occurred while generating your logo. Please try again.');
    }
  };
};

export { logoCommand, LogoGenerator, FontManager };
