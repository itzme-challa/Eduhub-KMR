import { Context } from 'telegraf';

const QUOTES_URL =
  'https://github.com/itzfew/Eduhub-KMR/raw/refs/heads/main/quotes.json';

const quote = () => async (ctx: Context) => {
  try {
    const fetch = (...args: any) => import('node-fetch').then(mod => mod.default(...args));
    const res = await fetch(QUOTES_URL);

    if (!res.ok) {
      throw new Error(`Failed to fetch quotes: ${res.statusText}`);
    }

    const data: { quoteText: string; quoteAuthor: string }[] = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      await ctx.reply('Sorry, no quotes found right now.');
      return;
    }

    const random = data[Math.floor(Math.random() * data.length)];
    const message = `_"${random.quoteText}"_\n\n– *${random.quoteAuthor || 'Unknown'}*`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Quote command error:', err);
    await ctx.reply('Oops! Could not fetch a quote at the moment.');
  }
};

export { quote };
