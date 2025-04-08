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
import { development, production } from './core';

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

// /broadcast (admin only)
bot.command('broadcast', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized to use this command.');
  const msg = ctx.message.text?.split(' ').slice(1).join(' ');
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

// /reply <chat_id> <message> (admin only)
bot.command('reply', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');
  const args = ctx.message.text?.split(' ').slice(1);
  const targetId = args?.[0];
  const replyMsg = args?.slice(1).join(' ');

  if (!targetId || !replyMsg) {
    return ctx.reply('Usage:\n/reply <chat_id> <your message>');
  }

  try {
    await ctx.telegram.sendMessage(
      Number(targetId),
      `*Admin's Reply:*\n${replyMsg}`,
      { parse_mode: 'Markdown' }
    );
    await ctx.reply('Message sent successfully.');
  } catch {
    await ctx.reply('Failed to send message.');
  }
});

// /users (admin only)
bot.command('users', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return;
  const ids = getAllChatIds();
  const userList = ids.map(id => `\`Chat ID:\` ${id}`).join('\n');
  ctx.reply(`*Users:*\n${userList}`, { parse_mode: 'Markdown' });
});

const notifiedUsers = new Set<number>();

// Start command with custom keyboard
bot.start(async (ctx) => {
  saveChatId(ctx.chat.id);
  await saveToSheet(ctx.chat);

  if (ctx.chat.id !== ADMIN_ID && !notifiedUsers.has(ctx.chat.id)) {
    notifiedUsers.add(ctx.chat.id);
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*New user started the bot!*\n\n*Name:* ${ctx.chat.first_name || ''}\n*Username:* @${ctx.chat.username || 'N/A'}\nChat ID: \`${ctx.chat.id}\``,
      { parse_mode: 'Markdown' }
    );
  }

  await ctx.reply(`Welcome ${ctx.from.first_name}!`, {
    reply_markup: {
      keyboard: [['NEET PYQs', 'JEE PYQs'], ['Contact Admin']],
      resize_keyboard: true,
    },
  });
});

// Message handler
bot.on('message', async (ctx) => {
  const chat = ctx.chat;
  const msg = ctx.message;

  if (chat?.id && msg) {
    saveChatId(chat.id);
    await saveToSheet(chat);

    // Notify admin on first interaction
    if (chat.id !== ADMIN_ID && !notifiedUsers.has(chat.id)) {
      notifiedUsers.add(chat.id);
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*New user started the bot!*\n\n*Name:* ${chat.first_name || ''}\n*Username:* @${chat.username || 'N/A'}\nChat ID: \`${chat.id}\``,
        { parse_mode: 'Markdown' }
      );
    }

    // Handle contact message
    if (msg.text?.startsWith('/contact')) {
      const userMessage = msg.text.replace('/contact', '').trim() || msg.reply_to_message?.text;
      if (userMessage) {
        await ctx.telegram.sendMessage(
          ADMIN_ID,
          `*Contact Message from ${chat.first_name} (@${chat.username || 'N/A'})*\nChat ID: \`${chat.id}\`\n\n*Message:*\n${userMessage}`,
          { parse_mode: 'Markdown' }
        );
        await ctx.reply('Your message has been sent to the admin!');
      } else {
        await ctx.reply('Please provide a message or reply to a message using /contact.');
      }
      return;
    }

    // Quick actions from custom keyboard
    if (msg.text === 'NEET PYQs') {
      return await ctx.reply('Coming soon: NEET PYQ practice!');
    }

    if (msg.text === 'JEE PYQs') {
      return await ctx.reply('Coming soon: JEE PYQ practice!');
    }

    if (msg.text === 'Contact Admin') {
      return await ctx.reply('Type your message and send it with /contact.');
    }

    // Only run quizzes now (greeting removed)
    await quizes()(ctx);
  }
});

// Webhook for Vercel
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

// Local dev
if (ENVIRONMENT !== 'production') {
  development(bot);
}
