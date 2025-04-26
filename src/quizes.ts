import { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';

// Function to handle the /quiz command
export function quizes() {
    return async (ctx: any) => {
        if (ctx.message?.text?.startsWith('/quiz') {
            try {
                // Show main quiz menu with Chapterwise and Yearwise options
                await ctx.reply(
                    '📚 Select Quiz Type:',
                    Markup.inlineKeyboard([
                        [
                            Markup.button.callback('📖 Chapterwise', 'quiz_chapterwise'),
                            Markup.button.callback('🗓 Yearwise', 'quiz_yearwise')
                        ]
                    ])
                );
            } catch (error) {
                console.error('Error sending quiz menu:', error);
            }
        }
    };
}

// Function to handle Chapterwise quiz selection
export async function handleChapterwiseQuiz(ctx: any) {
    try {
        // Show subject selection menu
        await ctx.editMessageText(
            '📚 Select Subject:',
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('🧬 Biology', 'chapterwise_biology'),
                    Markup.button.callback('⚛ Physics', 'chapterwise_physics')
                ],
                [
                    Markup.button.callback('🧪 Chemistry', 'chapterwise_chemistry'),
                    Markup.button.callback('🔙 Back', 'quiz_back')
                ]
            ])
        );
    } catch (error) {
        console.error('Error handling chapterwise quiz:', error);
    }
}

// Function to handle Yearwise quiz selection
export async function handleYearwiseQuiz(ctx: any) {
    try {
        // Fetch exams data from GitHub
        const examsUrl = 'https://raw.githubusercontent.com/itzfew/Quizes/refs/heads/main/neet/exams.json';
        const response = await fetch(examsUrl);
        const examsData = await response.json();

        // Create buttons for each exam
        const examButtons = examsData.papers.map((exam: any) => {
            return [Markup.button.callback(
                `${exam.title} (${exam.year})`, 
                `yearwise_${exam.metaId}`
            )];
        });

        // Add back button
        examButtons.push([Markup.button.callback('🔙 Back', 'quiz_back')]);

        await ctx.editMessageText(
            '📅 Select Exam:',
            Markup.inlineKeyboard(examButtons)
        );
    } catch (error) {
        console.error('Error handling yearwise quiz:', error);
        await ctx.editMessageText(
            '❌ Failed to load exams. Please try again later.',
            Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Back', 'quiz_back')]
            ])
        );
    }
}

// Function to handle subject selection for Chapterwise quiz
export async function handleSubjectSelection(ctx: any, subject: string) {
    try {
        // These metaIds would be the same as in your HTML example
        const metaIds = [
            "3c48616f-298a-5f69-91d2-bcd59444c455", "cbfbed57-d7d8-5a07-9957-478e4cb62f17", 
            "8dd253c6-09a8-5875-b127-a0c00a165a1b", "c7fb1fc7-cb24-58d1-99f5-4ced0111082d", 
            "2ff56f11-0061-566e-aeca-9cc14246e8fb", "27ba990b-5085-5196-87dd-9727f95fc228",
            "c3ae87e9-4094-514a-b2a4-b6e98b1d7ec3", "ce68b80b-fff0-5db8-8d6a-668d729d487a", 
            "57222784-be0a-5653-930c-8ac44c689e21"
        ];

        // Fetch chapters for the selected subject
        const chaptersUrl = `https://raw.githubusercontent.com/itzfew/Quizes/refs/heads/main/pyq/${metaIds[0]}.json`;
        const response = await fetch(chaptersUrl);
        const data = await response.json();

        let chapters: any[] = [];
        if (subject === 'biology') {
            chapters = data[0]?.questions || [];
        } else if (subject === 'chemistry') {
            chapters = data[1]?.questions || [];
        } else if (subject === 'physics') {
            chapters = data[2]?.questions || [];
        }

        // Get unique chapters
        const chapterMap = new Map();
        chapters.forEach((q: any) => {
            if (!chapterMap.has(q.chapter)) {
                chapterMap.set(q.chapter, {
                    name: q.chapter,
                    count: 1
                });
            }
        });

        // Create buttons for each chapter
        const chapterButtons = Array.from(chapterMap.keys()).map((chapterName: string) => {
            const formattedName = chapterName.charAt(0).toUpperCase() + chapterName.slice(1);
            return [Markup.button.callback(
                formattedName, 
                `chapter_${subject}_${encodeURIComponent(chapterName)}`
            )];
        });

        // Add back button
        chapterButtons.push([Markup.button.callback('🔙 Back', 'quiz_chapterwise')]);

        await ctx.editMessageText(
            `📖 ${subject.charAt(0).toUpperCase() + subject.slice(1)} Chapters:`,
            Markup.inlineKeyboard(chapterButtons)
        );
    } catch (error) {
        console.error(`Error loading ${subject} chapters:`, error);
        await ctx.editMessageText(
            `❌ Failed to load ${subject} chapters. Please try again later.`,
            Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Back', 'quiz_chapterwise')]
            ])
        );
    }
}

// Function to handle chapter selection
export async function handleChapterSelection(ctx: any, subject: string, chapter: string) {
    try {
        const decodedChapter = decodeURIComponent(chapter);
        const url = `https://quizes.pages.dev/subject?subject=${subject}&chapter=${encodeURIComponent(decodedChapter)}`;
        
        await ctx.editMessageText(
            `🧠 ${decodedChapter.charAt(0).toUpperCase() + decodedChapter.slice(1)} Quiz\n\n` +
            `Click the button below to start the quiz:`,
            Markup.inlineKeyboard([
                [Markup.button.url('Start Quiz', url)],
                [Markup.button.callback('🔙 Back', `chapterwise_${subject}`)]
            ])
        );
    } catch (error) {
        console.error('Error handling chapter selection:', error);
    }
}

// Function to handle exam selection for Yearwise quiz
export async function handleExamSelection(ctx: any, metaId: string) {
    try {
        // Fetch exam details
        const examsUrl = 'https://raw.githubusercontent.com/itzfew/Quizes/refs/heads/main/neet/exams.json';
        const response = await fetch(examsUrl);
        const examsData = await response.json();
        
        const exam = examsData.papers.find((e: any) => e.metaId === metaId);
        if (!exam) throw new Error('Exam not found');

        const url = `https://quizes.pages.dev/play?title=${encodeURIComponent(exam.title)}&metaId=${metaId}`;
        
        await ctx.editMessageText(
            `📝 ${exam.title}\n\n` +
            `Click the button below to start the exam:`,
            Markup.inlineKeyboard([
                [Markup.button.url('Start Exam', url)],
                [Markup.button.callback('🔙 Back', 'quiz_yearwise')]
            ])
        );
    } catch (error) {
        console.error('Error handling exam selection:', error);
        await ctx.editMessageText(
            '❌ Failed to load exam details. Please try again later.',
            Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Back', 'quiz_yearwise')]
            ])
        );
    }
}

// Function to go back to main quiz menu
export async function handleQuizBack(ctx: any) {
    try {
        await ctx.editMessageText(
            '📚 Select Quiz Type:',
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('📖 Chapterwise', 'quiz_chapterwise'),
                    Markup.button.callback('🗓 Yearwise', 'quiz_yearwise')
                ]
            ])
        );
    } catch (error) {
        console.error('Error going back to quiz menu:', error);
    }
}

// Register all quiz handlers
export function registerQuizHandlers(bot: Telegraf) {
    // Main quiz command
    bot.command('quiz', quizes());

    // Quiz callback handlers
    bot.action('quiz_chapterwise', handleChapterwiseQuiz);
    bot.action('quiz_yearwise', handleYearwiseQuiz);
    bot.action('quiz_back', handleQuizBack);

    // Subject selections
    bot.action(/^chapterwise_(biology|physics|chemistry)$/, (ctx) => {
        const subject = ctx.match[1];
        handleSubjectSelection(ctx, subject);
    });

    // Chapter selections
    bot.action(/^chapter_(biology|physics|chemistry)_(.+)$/, (ctx) => {
        const subject = ctx.match[1];
        const chapter = ctx.match[2];
        handleChapterSelection(ctx, subject, chapter);
    });

    // Exam selections
    bot.action(/^yearwise_(.+)$/, (ctx) => {
        const metaId = ctx.match[1];
        handleExamSelection(ctx, metaId);
    });
}
