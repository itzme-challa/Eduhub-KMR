import { Telegraf, Markup } from 'telegraf';
import { Context } from 'telegraf/typings/context';
import { Message } from 'telegraf/typings/core/types/typegram';

const QUIZ_BASE_URL = 'https://quizes.pages.dev';
const EXAMS_DATA_URL = 'https://raw.githubusercontent.com/itzfew/Quizes/refs/heads/main/neet/exams.json';

export function quizes() {
    return async (ctx: Context) => {
        if ('text' in ctx.message && ctx.message.text === '/quiz') {
            await showQuizMenu(ctx);
        }
    };
}

async function showQuizMenu(ctx: Context) {
    await ctx.reply(
        '📚 Choose your quiz type:',
        Markup.inlineKeyboard([
            [
                Markup.button.callback('📖 Chapterwise', 'chapterwise'),
                Markup.button.callback('🗓 Yearwise', 'yearwise')
            ]
        ])
    );
}

export function setupQuizHandlers(bot: Telegraf) {
    // Handle quiz type selection
    bot.action('chapterwise', async (ctx) => {
        await ctx.editMessageText('📖 Select a subject for Chapterwise quiz:');
        await ctx.editMessageReplyMarkup({
            inline_keyboard: [
                [
                    Markup.button.callback('🧬 Biology', 'subject_biology'),
                    Markup.button.callback('⚛ Physics', 'subject_physics')
                ],
                [
                    Markup.button.callback('🧪 Chemistry', 'subject_chemistry'),
                    Markup.button.callback('🔙 Back', 'back_to_quiz_menu')
                ]
            ]
        });
    });

    bot.action('yearwise', async (ctx) => {
        try {
            const response = await fetch(EXAMS_DATA_URL);
            const examsData = await response.json();
            
            const buttons = [];
            const exams = examsData.papers;
            
            // Group exams by year
            const examsByYear: {[key: number]: any[]} = {};
            exams.forEach((exam: any) => {
                if (!examsByYear[exam.year]) {
                    examsByYear[exam.year] = [];
                }
                examsByYear[exam.year].push(exam);
            });
            
            // Create buttons for each year
            for (const year in examsByYear) {
                if (examsByYear.hasOwnProperty(year)) {
                    buttons.push([
                        Markup.button.callback(
                            `📅 ${year} (${examsByYear[year].length} papers)`, 
                            `year_${year}`
                        )
                    ]);
                }
            }
            
            // Add back button
            buttons.push([Markup.button.callback('🔙 Back', 'back_to_quiz_menu')]);
            
            await ctx.editMessageText('🗓 Select a year for Yearwise quiz:');
            await ctx.editMessageReplyMarkup({
                inline_keyboard: buttons
            });
        } catch (error) {
            console.error('Error fetching exams data:', error);
            await ctx.reply('❌ Failed to load exam data. Please try again later.');
        }
    });

    // Handle year selection for yearwise
    bot.action(/^year_(\d+)$/, async (ctx) => {
        const year = ctx.match[1];
        try {
            const response = await fetch(EXAMS_DATA_URL);
            const examsData = await response.json();
            const examsForYear = examsData.papers.filter((exam: any) => exam.year.toString() === year);
            
            const buttons = examsForYear.map((exam: any) => {
                return [Markup.button.callback(
                    exam.title,
                    `exam_${exam.metaId}`
                )];
            });
            
            // Add back button
            buttons.push([Markup.button.callback('🔙 Back', 'yearwise')]);
            
            await ctx.editMessageText(`📅 Exams for ${year}:`);
            await ctx.editMessageReplyMarkup({
                inline_keyboard: buttons
            });
        } catch (error) {
            console.error('Error fetching exams data:', error);
            await ctx.reply('❌ Failed to load exam data. Please try again later.');
        }
    });

    // Handle exam selection
    bot.action(/^exam_(.+)$/, async (ctx) => {
        const metaId = ctx.match[1];
        try {
            const response = await fetch(EXAMS_DATA_URL);
            const examsData = await response.json();
            const exam = examsData.papers.find((e: any) => e.metaId === metaId);
            
            if (exam) {
                const url = `${QUIZ_BASE_URL}/play?title=${encodeURIComponent(exam.title)}&metaId=${metaId}`;
                await ctx.editMessageText(`🔗 Opening ${exam.title}...`);
                await ctx.reply(`📝 ${exam.title}\n\nClick below to start the quiz:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [Markup.button.url('📝 Start Quiz', url)]
                        ]
                    }
                });
            } else {
                await ctx.reply('❌ Exam not found.');
            }
        } catch (error) {
            console.error('Error fetching exam data:', error);
            await ctx.reply('❌ Failed to load exam. Please try again later.');
        }
    });

    // Handle subject selection for chapterwise
    bot.action(/^subject_(.+)$/, async (ctx) => {
        const subject = ctx.match[1];
        const subjects = {
            biology: '🧬 Biology',
            physics: '⚛ Physics',
            chemistry: '🧪 Chemistry'
        };
        
        await ctx.editMessageText(`📖 ${subjects[subject as keyof typeof subjects]} chapters:`);
        
        // In a real implementation, you would fetch the chapters for this subject
        // For now, we'll use a placeholder with a link to the web version
        const url = `${QUIZ_BASE_URL}/subject?subject=${subject}`;
        
        await ctx.editMessageReplyMarkup({
            inline_keyboard: [
                [Markup.button.url('📖 View Chapters on Web', url)],
                [Markup.button.callback('🔙 Back', 'chapterwise')]
            ]
        });
    });

    // Back button handlers
    bot.action('back_to_quiz_menu', async (ctx) => {
        await showQuizMenu(ctx);
    });
}
