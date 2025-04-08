import { getAllChatIds, saveChatId } from './utils/chatStore';
import { saveToSheet } from './utils/saveToSheet';
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
import { Message } from 'telegraf/typings/core/types/typegram';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';
const ADMIN_ID = 6930703214;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN not provided!');

const bot = new Telegraf(BOT_TOKEN);

// Commands
bot.command('about', about());
bot.command('help', help());
bot.command('study', study());
bot.command('neet', neet());
bot.command('jee', jee());
bot.command('groups', groups());

bot.command('broadcast', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized to use this command.');
  const msg = ctx.message && 'text' in ctx.message ? ctx.message.text?.split(' ').slice(1).join(' ') : null;
  if (!msg) return ctx.reply('Usage:\n/broadcast Your message here');

  const chatIds = getAllChatIds();
  let success = 0;

  for (const id of chatIds) {
    try {
      await ctx.telegram.sendMessage(id, msg);
      success++;
    } catch {
      console.log(`Failed to send to ${id}`);
    }
  }

  await ctx.reply(`Broadcast sent to ${success} users.`);
});

const notifiedUsers = new Set<number>();

// On any message
bot.on('message', async (ctx) => {
  const chat = ctx.chat;
  const msg = ctx.message;

  if (!chat || typeof chat.id === 'undefined') return;

  // Save to memory and sheet
  saveChatId(chat.id);
  await saveToSheet(chat);

  // Notify admin once
  if (chat.id !== ADMIN_ID && !notifiedUsers.has(chat.id)) {
    notifiedUsers.add(chat.id);

    const firstName = chat.type === 'private' ? chat.first_name || '' : 'Group';
    const username = chat.type === 'private' ? chat.username || 'N/A' : 'N/A';

    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*New user started the bot!*\n\n*Name:* ${firstName}\n*Username:* @${username}\nChat ID: \`${chat.id}\``,
      { parse_mode: 'Markdown' }
    );
  }

  // Handle /contact command
  if ('text' in msg && msg.text?.startsWith('/contact')) {
    const userMessage =
      msg.text.replace('/contact', '').trim() ||
      ('reply_to_message' in msg && 'text' in msg.reply_to_message ? msg.reply_to_message.text : '');

    if (userMessage) {
      const firstName = chat.type === 'private' ? chat.first_name || '' : 'Group';
      const username = chat.type === 'private' ? chat.username || 'N/A' : 'N/A';

      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*Contact Message from ${firstName} (@${username})*\nChat ID: \`${chat.id}\`\n\n*Message:*\n${userMessage}`,
        { parse_mode: 'Markdown' }
      );
      await ctx.reply('Your message has been sent to the admin!');
    } else {
      await ctx.reply('Please provide a message or reply to a message using /contact.');
    }
  } else {
    await Promise.all([quizes()(ctx), greeting()(ctx)]);
  }

  // Admin reply forwarding
  if (ctx.chat.id === ADMIN_ID && 'reply_to_message' in msg && msg.reply_to_message?.text) {
    const match = msg.reply_to_message.text.match(/Chat ID: `(\d+)`/);
    if (match) {
      const targetId = parseInt(match[1], 10);
      await ctx.telegram.sendMessage(
        targetId,
        `*Admin's Reply:*\n${msg.text}`,
        { parse_mode: 'Markdown' }
      );
    }
  }
});

// Webhook for Vercel
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

// Local development
if (ENVIRONMENT !== 'production') {
  development(bot);
}
