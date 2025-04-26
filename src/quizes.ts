import { Context } from 'telegraf';
import axios from 'axios';

interface Paper {
  exam: string;
  examGroup: string;
  metaId: string;
  title: string;
  year: number;
  languages?: string[];
}

interface ExamCategory {
  title: string;
  papers: Paper[];
}

let examsData: ExamCategory[] = [];

export function quizes() {
  return async (ctx: Context) => {
    const text = ctx.message?.text;

    if (text?.startsWith('/quiz')) {
      try {
        if (examsData.length === 0) {
          const response = await axios.get<ExamCategory[]>('https://raw.githubusercontent.com/itzfew/Quizes/refs/heads/main/neet/exams.json');
          examsData = response.data;
        }

        const keyboard = examsData.map((exam) => {
          return [{ text: exam.title, callback_data: `exam_${exam.title}` }];
        });

        await ctx.reply('📝 Choose an exam:', {
          reply_markup: {
            inline_keyboard: keyboard
          }
        });

      } catch (err) {
        console.error('Failed to fetch exams.json', err);
        await ctx.reply('❌ Failed to load exams. Please try again later.');
      }
    }
  };
}

export function handleQuizActions() {
  return async (ctx: Context) => {
    const callbackData = ctx.callbackQuery?.data;

    if (!callbackData) return;

    // If user selects an exam
    if (callbackData.startsWith('exam_')) {
      const examTitle = callbackData.replace('exam_', '');

      const exam = examsData.find(e => e.title === examTitle);
      if (!exam) {
        await ctx.answerCbQuery('Exam not found.');
        return;
      }

      const papersKeyboard = exam.papers.map(paper => {
        return [{
          text: `${paper.title}`,
          callback_data: `paper_${paper.metaId}`
        }];
      });

      await ctx.editMessageText(`📚 Choose a paper for *${examTitle}*`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: papersKeyboard
        }
      });
      await ctx.answerCbQuery();
    }

    // If user selects a paper
    else if (callbackData.startsWith('paper_')) {
      const metaId = callbackData.replace('paper_', '');

      let selectedPaper: Paper | undefined;
      for (const exam of examsData) {
        const paper = exam.papers.find(p => p.metaId === metaId);
        if (paper) {
          selectedPaper = paper;
          break;
        }
      }

      if (!selectedPaper) {
        await ctx.answerCbQuery('Paper not found.');
        return;
      }

      const playLink = `https://quizes.pages.dev/play?title=${encodeURIComponent(selectedPaper.title)}&metaId=${selectedPaper.metaId}`;

      await ctx.reply(`▶️ [Start ${selectedPaper.title}](${playLink})`, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      await ctx.answerCbQuery();
    }
  };
}
