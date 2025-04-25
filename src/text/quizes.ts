import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:quizes');

const quizes = () => async (ctx: Context) => {
  debug('Triggered "quizes" handler');

  if (!ctx.message || !('text' in ctx.message)) return;

  const text = ctx.message.text.trim().toLowerCase();

  // Match random commands: /pyqb 2, /pyqc 3, /pyqp, /pyq 4
  const randomMatch = text.match(/^\/pyq(b|c|p)?\s*([0-9]+)?$/);
  // Match direct question access: /b1, /c2, /p4
  const indexMatch = text.match(/^\/(b|c|p)([0-9]+)$/);

  const subjectMap: Record<string, string> = {
    b: 'biology',
    c: 'chemistry',
    p: 'physics'
  };

  try {
    const response = await fetch('https://raw.githubusercontent.com/itzfew/Eduhub-KMR/master/quiz.json');
    const allQuestions = await response.json();

    // Handle /pyq(b|c|p)? [count] → random mode
    if (randomMatch) {
      const rawSub = randomMatch[1];
      const count = randomMatch[2] ? parseInt(randomMatch[2], 10) : 1;

      const subject = rawSub ? subjectMap[rawSub] : null;
      let filtered = subject ? allQuestions.filter((q: any) => q.subject?.toLowerCase() === subject) : allQuestions;

      if (!filtered.length) {
        await ctx.reply(`No ${subject || 'NEET'} PYQs available.`);
        return;
      }

      const shuffled = filtered.sort(() => 0.5 - Math.random()).slice(0, count);

      for (const question of shuffled) {
        await sendQuestion(ctx, question);
      }
      return;
    }

    // Handle /b1, /p2, /c5 → direct index
    if (indexMatch) {
      const rawSub = indexMatch[1];
      const index = parseInt(indexMatch[2], 10) - 1;
      const subject = subjectMap[rawSub];
      const filtered = allQuestions.filter((q: any) => q.subject?.toLowerCase() === subject);

      if (index >= 0 && index < filtered.length) {
        await sendQuestion(ctx, filtered[index]);
      } else {
        await ctx.reply(`Question ${index + 1} not found in ${subject}.`);
      }
    }

  } catch (err) {
    debug('Error fetching questions:', err);
    await ctx.reply('Oops! Failed to load questions.');
  }
};

const sendQuestion = async (ctx: Context, question: any) => {
  const options = [
    question.options.A,
    question.options.B,
    question.options.C,
    question.options.D,
  ];
  const correctOptionIndex = ['A', 'B', 'C', 'D'].indexOf(question.correct_option);

  if (question.image) {
    await ctx.replyWithPhoto({ url: question.image });
  }

  await ctx.sendPoll(question.question, options, {
    type: 'quiz',
    correct_option_id: correctOptionIndex,
    is_anonymous: false,
    explanation: question.explanation || 'No explanation provided.',
  } as any);
};

export { quizes };
