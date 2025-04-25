import { Context } from 'telegraf';
import fetch from 'node-fetch';

interface Quote {
  quoteText: string;
  quoteAuthor: string;
}

export const quote = () => async (ctx: Context) => {
  try {
    // Fetch the quotes from the JSON file
    const res = await fetch('https://raw.githubusercontent.com/itzfew/Eduhub-KMR/master/quotes.json');
    const quotes: Quote[] = await res.json();  // Assert the type to Quote[] here

    if (!quotes || quotes.length === 0) {
      return ctx.reply('❌ No quotes found.');
    }

    // Pick a random quote
    const random = quotes[Math.floor(Math.random() * quotes.length)];
    const message = `_"${random.quoteText}"_\n\n— *${random.quoteAuthor || 'Unknown'}*`;

    const chatId = ctx.chat?.id;
    if (!chatId) return;

    // Send the message with Markdown formatting
    await ctx.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Failed to fetch quote:', err);
    const chatId = ctx.chat?.id;
    if (chatId) {
      await ctx.telegram.sendMessage(chatId, '⚠️ Failed to fetch quote. Try again later.');
    }
  }
};
