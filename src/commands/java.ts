import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:java_command');

const javaCommand = () => async (ctx: Context) => {
  try {
    const message = ctx.message;
    const replied = message?.reply_to_message;

    if (!replied || !('text' in replied)) {
      return ctx.reply('❗ Please reply to a message with `/java` or `/script` to convert it into JavaScript.', {
        parse_mode: 'Markdown',
      });
    }

    const inputText = replied.text.trim();
    const jsCode = `// JavaScript generated from your message\nconsole.log(\`${inputText.replace(/`/g, '\\`')}\`);`;

    debug(`Generated JS from message: ${inputText}`);

    await ctx.replyWithMarkdownV2(`\`\`\`js\n${jsCode}\n\`\`\``);
  } catch (err) {
    console.error('⚠️ JavaScript generation error:', err);
    await ctx.reply('⚠️ Could not generate JavaScript. Please try again.');
  }
};

export { javaCommand };
