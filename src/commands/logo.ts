import { Context } from 'telegraf';
import createDebug from 'debug';
import axios from 'axios';

const debug = createDebug('bot:logo');

const logoCommand = () => async (ctx: Context) => {
  try {
    debug('Triggered /gen command');

    const messageText = ctx.message?.text;
    if (!messageText) return;

    const [command, ...args] = messageText.trim().split(' ');
    const logoText = args.join(' ');

    if (!logoText) {
      return ctx.reply('❗ Please provide a name.\nExample: `/gen EduHub`', {
        parse_mode: 'Markdown',
      });
    }

    const encodedText = encodeURIComponent(logoText);
    const imageUrl = `https://flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=sketch-name&text=${encodedText}`;

    await ctx.replyWithChatAction('upload_photo');
    await ctx.replyWithPhoto(
      { url: imageUrl },
      {
        caption: `✨ Here's your generated logo for *${logoText}*`,
        parse_mode: 'Markdown',
      }
    );
  } catch (err) {
    console.error('Logo command error:', err);
    await ctx.reply('⚠️ Failed to generate logo. Try again later.');
  }
};

export { logoCommand };
