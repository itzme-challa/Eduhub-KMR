import { Context } from 'telegraf';
import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import chroma from 'chroma-js';

// Configuration interface
interface LogoConfig {
  size: number;
  padding: number;
  background: {
    type: 'gradient' | 'solid' | 'pattern';
    colors: string[];
  };
  text: {
    content: string;
    color: string;
    font: string;
    size: number;
    style: 'normal' | 'bold' | 'italic';
    shadow: {
      enabled: boolean;
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
    };
  };
  effects: {
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    noise: boolean;
    noiseOpacity: number;
  };
}

class LogoGenerator {
  private fontsDir: string;
  private fontFamilies: string[];
  private patternsDir: string;
  private availablePatterns: string[];

  constructor() {
    this.fontsDir = path.resolve(__dirname, '../assets/fonts');
    this.patternsDir = path.resolve(__dirname, '../assets/patterns');
    this.fontFamilies = [];
    this.availablePatterns = [];
    
    this.loadResources();
  }

  private loadResources(): void {
    // Load fonts
    fs.readdirSync(this.fontsDir).forEach((file) => {
      const filePath = path.join(this.fontsDir, file);
      if (fs.statSync(filePath).isFile() && file.endsWith('.ttf')) {
        const familyName = path.parse(file).name.replace(/-/g, ' ');
        try {
          registerFont(filePath, { family: familyName });
          this.fontFamilies.push(familyName);
        } catch (e) {
          console.warn(`Failed to load font: ${file}`, e);
        }
      }
    });

    // Load patterns
    fs.readdirSync(this.patternsDir).forEach((file) => {
      const filePath = path.join(this.patternsDir, file);
      if (fs.statSync(filePath).isFile() && /\.(png|jpg|jpeg)$/.test(file)) {
        this.availablePatterns.push(filePath);
      }
    });
  }

  private getRandomFont(): string {
    return this.fontFamilies.length > 0 
      ? this.fontFamilies[Math.floor(Math.random() * this.fontFamilies.length)]
      : 'Arial';
  }

  private generateRandomGradient(ctx: CanvasRenderingContext2D, width: number, height: number): CanvasGradient {
    const colorSchemes = [
      ['#FF9A8B', '#FF6B95', '#FF8E53'],
      ['#4FACFE', '#00F2FE', '#00E3AE'],
      ['#667EEA', '#764BA2', '#A66BFE'],
      ['#F6D365', '#FDA085', '#FBC2EB'],
      ['#A1C4FD', '#C2E9FB', '#D4FCFC'],
      ['#FFC3A0', '#FFAFBD', '#FFC3A0'],
      ['#6A11CB', '#2575FC', '#48B1BF']
    ];

    const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
    const gradientType = Math.random() > 0.5 ? 'linear' : 'radial';
    
    if (gradientType === 'linear') {
      const angle = Math.random() * Math.PI * 2;
      const gradient = ctx.createLinearGradient(
        width / 2 + Math.cos(angle) * width / 2,
        height / 2 + Math.sin(angle) * height / 2,
        width / 2 - Math.cos(angle) * width / 2,
        height / 2 - Math.sin(angle) * height / 2
      );
      
      scheme.forEach((color, i) => {
        gradient.addColorStop(i / (scheme.length - 1), color);
      });
      
      return gradient;
    } else {
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      
      scheme.forEach((color, i) => {
        gradient.addColorStop(i / (scheme.length - 1), color);
      });
      
      return gradient;
    }
  }

  private async applyPattern(ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> {
    if (this.availablePatterns.length === 0) return;

    const patternPath = this.availablePatterns[Math.floor(Math.random() * this.availablePatterns.length)];
    try {
      const pattern = await loadImage(patternPath);
      const patternFill = ctx.createPattern(pattern, 'repeat');
      if (patternFill) {
        ctx.fillStyle = patternFill;
        ctx.fillRect(0, 0, width, height);
      }
    } catch (err) {
      console.error('Failed to load pattern:', err);
    }
  }

  private addNoise(ctx: CanvasRenderingContext2D, width: number, height: number, opacity: number): void {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = opacity * 255;
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
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

  public async generateLogo(config: Partial<LogoConfig>): Promise<Buffer> {
    const defaultConfig: LogoConfig = {
      size: 1024,
      padding: 50,
      background: {
        type: 'gradient',
        colors: []
      },
      text: {
        content: 'Logo',
        color: '#FFFFFF',
        font: this.getRandomFont(),
        size: 120,
        style: 'bold',
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.4)',
          blur: 15,
          offsetX: 4,
          offsetY: 4
        }
      },
      effects: {
        borderRadius: 20,
        borderWidth: 5,
        borderColor: '#FFFFFF',
        noise: true,
        noiseOpacity: 0.03
      }
    };

    const finalConfig: LogoConfig = { ...defaultConfig, ...config };
    const { size, padding, background, text, effects } = finalConfig;

    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Draw background
    if (background.type === 'gradient') {
      ctx.fillStyle = background.colors.length > 0
        ? this.createCustomGradient(ctx, size, size, background.colors)
        : this.generateRandomGradient(ctx, size, size);
      ctx.fillRect(0, 0, size, size);
    } else if (background.type === 'pattern') {
      await this.applyPattern(ctx, size, size);
    } else {
      ctx.fillStyle = background.colors[0] || '#000000';
      ctx.fillRect(0, 0, size, size);
    }

    // Apply effects
    if (effects.noise) {
      this.addNoise(ctx, size, size, effects.noiseOpacity);
    }

    // Draw border if specified
    if (effects.borderWidth > 0) {
      this.drawRoundedRect(
        ctx,
        effects.borderWidth / 2,
        effects.borderWidth / 2,
        size - effects.borderWidth,
        size - effects.borderWidth,
        effects.borderRadius
      );
      ctx.strokeStyle = effects.borderColor;
      ctx.lineWidth = effects.borderWidth;
      ctx.stroke();
    }

    // Draw text
    ctx.font = `${text.style} ${text.size}px "${text.font}"`;
    ctx.fillStyle = text.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (text.shadow.enabled) {
      ctx.shadowColor = text.shadow.color;
      ctx.shadowBlur = text.shadow.blur;
      ctx.shadowOffsetX = text.shadow.offsetX;
      ctx.shadowOffsetY = text.shadow.offsetY;
    }

    // Calculate text position with padding
    const textX = size / 2;
    const textY = size / 2;
    
    // Handle multi-line text
    const lines = text.content.split('\n');
    const lineHeight = text.size * 1.2;
    const totalHeight = lines.length * lineHeight - (lineHeight - text.size);
    let currentY = textY - totalHeight / 2 + text.size / 2;

    lines.forEach(line => {
      ctx.fillText(line.trim(), textX, currentY);
      currentY += lineHeight;
    });

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    return canvas.toBuffer('image/png');
  }

  private createCustomGradient(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: string[]
  ): CanvasGradient {
    if (colors.length === 1) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, chroma(colors[0]).darken(1).hex());
      return gradient;
    }

    const gradientType = Math.random() > 0.5 ? 'linear' : 'radial';
    
    if (gradientType === 'linear') {
      const angle = Math.random() * Math.PI * 2;
      const gradient = ctx.createLinearGradient(
        width / 2 + Math.cos(angle) * width / 2,
        height / 2 + Math.sin(angle) * height / 2,
        width / 2 - Math.cos(angle) * width / 2,
        height / 2 - Math.sin(angle) * height / 2
      );
      
      colors.forEach((color, i) => {
        gradient.addColorStop(i / (colors.length - 1), color);
      });
      
      return gradient;
    } else {
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      
      colors.forEach((color, i) => {
        gradient.addColorStop(i / (colors.length - 1), color);
      });
      
      return gradient;
    }
  }
}

// Telegram command handler
const logoCommandHandler = (generator: LogoGenerator) => async (ctx: Context) => {
  try {
    // Parse command and options
    const text = ctx.message?.text || '';
    const match = text.match(/^\/gen(?:logo)?(?:\s+([^\n]+))?/i);
    
    if (!match || !match[1]) {
      const helpText = [
        '🎨 *Logo Generator Help* 🎨',
        '',
        'Usage:',
        '`/gen Your Text` - Generate logo with random style',
        '`/gen Your Text | font=Font Name` - Specify font',
        '`/gen Your Text | bg=color1,color2` - Custom background',
        '`/gen Your Text | color=textcolor` - Custom text color',
        '`/gen Your Text | size=100` - Text size',
        '',
        'Example:',
        '`/gen My Brand | font=Roboto | bg=#FF0000,#00FF00 | color=#FFFFFF | size=120`'
      ].join('\n');
      
      return ctx.reply(helpText, { parse_mode: 'Markdown' });
    }

    // Parse input
    const parts = match[1].split('|').map(part => part.trim());
    const logoText = parts[0];
    const options = parts.slice(1).reduce((acc, part) => {
      const [key, value] = part.split('=').map(s => s.trim());
      if (key && value) acc[key.toLowerCase()] = value;
      return acc;
    }, {} as Record<string, string>);

    // Prepare config
    const config: Partial<LogoConfig> = {
      text: {
        content: logoText
      }
    };

    // Apply options
    if (options.font) {
      config.text = config.text || {};
      config.text.font = options.font;
    }
    
    if (options.color) {
      config.text = config.text || {};
      config.text.color = options.color;
    }
    
    if (options.size) {
      const size = parseInt(options.size, 10);
      if (!isNaN(size) && size > 0) {
        config.text = config.text || {};
        config.text.size = size;
      }
    }
    
    if (options.bg) {
      config.background = {
        type: 'gradient',
        colors: options.bg.split(',').map(c => c.trim())
      };
    }

    // Generate and send logo
    const imageBuffer = await generator.generateLogo(config);
    const caption = `🎨 *${logoText}* logo generated!\n` +
                   `🖋️ Font: ${config.text?.font || 'Random'}\n` +
                   `🎨 Colors: ${config.background?.colors?.join(' → ') || 'Random gradient'}`;

    await ctx.replyWithPhoto(
      { source: imageBuffer },
      {
        caption,
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message?.message_id
      }
    );

  } catch (err) {
    console.error('Logo generation error:', err);
    await ctx.reply('⚠️ Failed to generate logo. Please check your input and try again.', {
      reply_to_message_id: ctx.message?.message_id
    });
  }
};

// Initialize and export
const logoGenerator = new LogoGenerator();
const logoCommand = logoCommandHandler(logoGenerator);

export { logoCommand, LogoGenerator };
