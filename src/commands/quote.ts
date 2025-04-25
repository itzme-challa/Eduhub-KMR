import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:quotes');

const quotes = () => async (ctx: Context) => {
  debug('Triggered "quotes" handler');

  if (!ctx.message || !('text' in ctx.message)) return;

  const text = ctx.message.text.trim().toLowerCase();

  // Help message for quote command
  if (
    ['quote', '/quote', 'quotes', '/quotes'].includes(text)
  ) {
    await ctx.reply(
      `Hey! To get a random quote, just type "/quote" or "quotes".`
    );
    return;
  }

  try {
    const response = await fetch('https://raw.githubusercontent.com/itzfew/Eduhub-KMR/raw/refs/heads/main/quotes.json');
    const allQuotes = await response.json();

    // Randomly pick a quote from the list
    const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)];

    const quoteText = randomQuote.quoteText;
    const quoteAuthor = randomQuote.quoteAuthor;

    await ctx.reply(
      `"${quoteText}"\n\n— ${quoteAuthor}`
    );
  } catch (err) {
    debug('Error fetching quotes:', err);
    await ctx.reply('Oops! Failed to load quotes.');
  }
};

export { quote };
