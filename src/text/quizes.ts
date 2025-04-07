import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:quizes');

const quizes = () => async (ctx: Context) => {
  debug('Triggered "quizes" handler');

  if (!ctx.message || !('text' in ctx.message)) return;

  const text = ctx.message.text.trim().toLowerCase();

  // Help message for generic commands
  if (
    ['quiz', '/quiz', 'quizes', '/quizes', 'random', '/random', 'question', 'questions', '/question', '/questions'].includes(text)
  ) {
    await ctx.reply(
      `Hey! To get questions, type one of the following:\n\n` +
      `→ For Biology: "bio 1", "/b1", or "biology 1"\n` +
      `→ For Physics: "phy 2", "/p2", or "physics 2"\n` +
      `→ For Chemistry: "chem 3", "/c3", or "chemistry 3"\n\n` +
      `To get multiple random questions:\n` +
      `→ "playbio 5" → 5 random bio questions\n` +
      `→ "playphy 4" → 4 random physics questions\n` +
      `→ "playchem 6" → 6 random chemistry questions`
    );
    return;
  }

  // Match commands like: playbio 5, bio 1, /bio1, /bio 1, etc.
  const match = text.match(/^\/?(play)?(bio|b|biology|phy|p|physics|chem|c|chemistry)\s*([0-9]+)?$/i);
  if (!match) return;

  const isPlay = !!match[1]; // 'play' present
  const rawSubject = match[2];
  const countOrIndex = match[3] ? parseInt(match[3], 10) : 1;

  const subjectMap: Record<string, string> = {
    bio: 'biology',
    b: 'biology',
    biology: 'biology',
    phy: 'physics',
    p: 'physics',
    physics: 'physics',
    chem: 'chemistry',
    c: 'chemistry',
    chemistry: 'chemistry'
  };

  const subject = subjectMap[rawSubject];
  if (!subject) return;

  try {
    const response = await fetch('https://raw.githubusercontent.com/itzme-challa/eduhub-bot/master/quiz.json');
    const allQuestions = await response.json();

    const subjectQuestions = allQuestions.filter((q: any) => q.subject?.toLowerCase() === subject);

    if (!subjectQuestions.length) {
      await ctx.reply(`No ${subject} questions available yet.`);
      return;
    }

    const questionsToSend = [];

    if (isPlay) {
      // Play mode → send random questions
      const shuffled = subjectQuestions.sort(() => 0.5 - Math.random());
      questionsToSend.push(...shuffled.slice(0, Math.min(countOrIndex, subjectQuestions.length)));
    } else {
      // Specific index requested (1-based index)
      const index = countOrIndex - 1;
      if (index >= 0 && index < subjectQuestions.length) {
        questionsToSend.push(subjectQuestions[index]);
      } else {
        await ctx.reply(`Sorry, question ${countOrIndex} is not available in ${subject}.`);
        return;
      }
    }

    for (const question of questionsToSend) {
      const options = [
        question.options.A,
        question.options.B,
        question.options.C,
        question.options.D,
      ];
      const correctOptionIndex = ['A', 'B', 'C', 'D'].indexOf(question.correct_option);

      await ctx.sendPoll(question.question, options, {
        type: 'quiz',
        correct_option_id: correctOptionIndex,
        is_anonymous: false,
        explanation: question.explanation || 'No explanation provided.',
      } as any);
    }

  } catch (err) {
    debug('Error fetching questions:', err);
    await ctx.reply('Oops! Failed to load questions.');
  }
};

export { quizes };
