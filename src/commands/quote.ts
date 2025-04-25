import { Context } from 'telegraf';

const QUOTES_URL =
  'https://raw.githubusercontent.com/itzfew/Eduhub-KMR/main/quotes.json';

const quote = () => async (ctx: Context) => {
  try {
    const fetch = (...args: any) => import('node-fetch').then(mod => mod.default(...args));

    const response = await fetch(QUOTES_URL);
    const quotes = await response.json();

    if (!Array.isArray(quotes) || quotes.length === 0) {
      await ctx.reply('No quotes found.');
      return;
    }

    const { quoteText, quoteAuthor } = quotes[Math.floor(Math.random() * quotes.length)];
    const formatted = `_"${quoteText}"_\n\n– *${quoteAuthor || 'Unknown'}*`;

    await ctx.reply(formatted, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Failed to send quote:', err);
    await ctx.reply('Failed to load quote. Try again later.');
  }
};

export { quote };
