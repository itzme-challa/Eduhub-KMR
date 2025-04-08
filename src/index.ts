import { Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';

import { about } from './commands';
import { help } from './commands';
import { study } from './commands/study';
import { neet } from './commands/neet';
import { jee } from './commands/jee';
import { groups } from './commands/groups';

import { quizes } from './text';
import { greeting } from './text';

import { development, production } from './core';
import { saveToSheet } from './utils/saveToSheet';
import { saveChatId } from './utils/chatStore';

// Load environment variables
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

// Safety check
if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN not provided!');
}

const bot = new Telegraf(BOT_TOKEN);

// ✅ Register slash commands
bot.command('about', about());
bot.command('help', help());
bot.command('study', study());
bot.command('neet', neet());
bot.command('jee', jee());
bot.command('groups', groups());

// ✅ Handle /start and store user info
bot.start(async (ctx) => {
  const chat = ctx.chat;
  saveChatId(chat.id);
  await saveToSheet(chat);
  await greeting()(ctx);
});

// ✅ Handle text messages (like p1, hello, etc.)
bot.on('text', async (ctx) => {
  try {
    await Promise.all([
      quizes()(ctx),
      greeting()(ctx)
    ]);
  } catch (err) {
    console.error('Error handling text message:', err);
  }
});

// ✅ For Vercel Serverless
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

// ✅ For local development
if (ENVIRONMENT !== 'production') {
  development(bot);
}
