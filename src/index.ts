import { Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';

import { getAllChatIds, saveChatId, fetchChatIdsFromSheet } from './utils/chatStore';
import { saveToSheet } from './utils/saveToSheet';
import { about, help } from './commands';
import { study } from './commands/study';
import { neet } from './commands/neet';
import { jee } from './commands/jee';
import { groups } from './commands/groups';
import { quizes } from './text';
import { greeting } from './text';
import { development, production } from './core';
import { isPrivateChat } from './utils/groupSettings';
import { me, handleUserInfoRefresh } from './commands/me';
import { quote } from './commands/quote';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';
const ADMIN_ID = 6930703214;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN not provided!');
const bot = new Telegraf(BOT_TOKEN);

// --- COMMANDS ---
bot.command('about', about());
bot.command('help', help());
bot.command('study', study());
bot.command('neet', neet());
bot.command('jee', jee());
bot.command('groups', groups());
bot.command(['me', 'user', 'info'], me());
bot.command('quote', quote);

// Show user count from Google Sheet
bot.command('users', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');

  try {
    const chatIds = await fetchChatIdsFromSheet();
    const totalUsers = chatIds.length;

    await ctx.reply(`📊 Total users: ${totalUsers}`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: 'Refresh', callback_data: 'refresh_users' }]],
      },
    });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    ctx.reply('❌ Could not fetch user count.');
  }
});

bot.action('refresh_users', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.answerCbQuery('Unauthorized');

  try {
    const chatIds = await fetchChatIdsFromSheet();
    await ctx.editMessageText(`📊 Total users: ${chatIds.length} (refreshed)`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: 'Refresh', callback_data: 'refresh_users' }]],
      },
    });
    await ctx.answerCbQuery('Refreshed!');
  } catch (err) {
    console.error('Refresh failed:', err);
    ctx.answerCbQuery('Failed');
  }
});

bot.action('refresh_user_info', handleUserInfoRefresh());

// Broadcast message
bot.command('broadcast', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('Unauthorized.');

  const message = ctx.message.text?.split(' ').slice(1).join(' ');
  if (!message) return ctx.reply('Usage:\n/broadcast Your message');

  try {
    const chatIds = await fetchChatIdsFromSheet();
    let success = 0;

    for (const id of chatIds) {
      try {
        await ctx.telegram.sendMessage(id, message);
        success++;
      } catch (e) {
        console.log(`Fail to send to ${id}`, e);
      }
    }

    ctx.reply(`✅ Broadcast sent to ${success} users.`);
  } catch (err) {
    console.error('Broadcast error:', err);
    ctx.reply('❌ Broadcast failed.');
  }
});

// Admin reply command
bot.command('reply', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('Unauthorized.');

  const parts = ctx.message.text?.split(' ');
  if (!parts || parts.length < 3) return ctx.reply('Usage: /reply <chat_id> <message>');

  const chatId = Number(parts[1]);
  const message = parts.slice(2).join(' ');

  if (isNaN(chatId)) return ctx.reply(`Invalid chat ID: ${parts[1]}`);

  try {
    await ctx.telegram.sendMessage(chatId, `*Admin's Reply:*\n${message}`, { parse_mode: 'Markdown' });
    ctx.reply(`Reply sent to ${chatId}`);
  } catch (err) {
    console.error('Reply error:', err);
    ctx.reply('❌ Could not send reply.');
  }
});

// Handle bot start
bot.start(async (ctx) => {
  if (isPrivateChat(ctx.chat.type)) {
    await ctx.reply('Welcome! Use /help to explore.');
    await greeting()(ctx);
  }
});

// Handle messages
bot.on('message', async (ctx) => {
  const chat = ctx.chat;
  const msg = ctx.message;
  const isPrivate = isPrivateChat(chat.type);

  if (!chat.id) return;

  // Save chat
  saveChatId(chat.id);
  const alreadyNotified = await saveToSheet(chat);

  // Notify admin
  if (!alreadyNotified && chat.id !== ADMIN_ID && isPrivate && 'first_name' in chat) {
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*New user started the bot!*\n\n*Name:* ${chat.first_name}\n*Username:* @${chat.username || 'N/A'}\nChat ID: ${chat.id}`,
      { parse_mode: 'Markdown' }
    );
  }

  // Handle /contact
  if (msg.text?.startsWith('/contact')) {
    const userMessage = msg.text.replace('/contact', '').trim() || msg.reply_to_message?.text;
    if (userMessage) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*Contact from ${chat.first_name} (@${chat.username || 'N/A'})*\nChat ID: ${chat.id}\n\nMessage:\n${userMessage}`,
        { parse_mode: 'Markdown' }
      );
      ctx.reply('Your message was sent to the admin.');
    } else {
      ctx.reply('Please include a message or reply using /contact.');
    }
    return;
  }

  // Admin replies via swipe
  if (chat.id === ADMIN_ID && msg.reply_to_message?.text) {
    const match = msg.reply_to_message.text.match(/Chat ID: (\d+)/);
    if (match) {
      const targetId = parseInt(match[1]);
      await ctx.telegram.sendMessage(targetId, `*Admin's Reply:*\n${msg.text}`, { parse_mode: 'Markdown' });
    }
    return;
  }

  await quizes()(ctx);
  if (isPrivate) await greeting()(ctx);
});

// --- Deployment ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await production(req, res, bot);
}

if (ENVIRONMENT !== 'production') {
  development(bot);
}
