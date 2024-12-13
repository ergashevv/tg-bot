const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Tokenlarni sozlash
const TELEGRAM_BOT_TOKEN = '7926806246:AAGW6wQLp5vBRtMv0PdeNsYD3tfTrT2s7H4';
const TMDB_API_KEY = '22efd7288d974ca35cbbf4df85cdb17d';

// Botni ishga tushirish
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; // TMDB rasm uchun URL

// Start komandasi
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        `Salom, ${msg.from.first_name}! Men TMDB filmlar haqida ma'lumot beradigan botman. Quyidagilarni sinab ko'ring:
        
1. /categories - Filmlar kategoriyalari.
2. /genres - Filmlar janrlari.
3. /movie [film nomi] - Film haqida ma'lumot.`
    );
});

// Kategoriyalarni chiqarish
bot.onText(/\/categories/, (msg) => {
    const chatId = msg.chat.id;

    const categories = [
        { name: 'Eng mashhur filmlar', endpoint: 'popular' },
        { name: 'Eng yuqori baholangan', endpoint: 'top_rated' },
        { name: 'Yaqinda qo\'shilganlar', endpoint: 'upcoming' },
        { name: 'Hozir kinoteatrlarda', endpoint: 'now_playing' }
    ];

    let response = 'Filmlar kategoriyalari:\n\n';
    categories.forEach((cat, index) => {
        response += `${index + 1}. ${cat.name} - /category_${cat.endpoint}\n`;
    });

    bot.sendMessage(chatId, response);
});

// Pagination uchun saqlash
const paginationState = {};

// Tanlangan kategoriya bo'yicha filmlar
bot.onText(/\/category_(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const category = match[1];
    const page = paginationState[chatId]?.page || 1; // Hozirgi sahifa

    try {
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${category}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'en-US',
                page
            }
        });

        const movies = response.data.results.slice(0, 5); // 5ta filmni chiqaramiz
        paginationState[chatId] = { category, page: page + 1 }; // Keyingi sahifani saqlash

        for (const movie of movies) {
            const message = `
<strong>${movie.title}</strong>
Rating: ${movie.vote_average}
`;

            const imageUrl = TMDB_IMAGE_BASE_URL + movie.poster_path;

            bot.sendPhoto(chatId, imageUrl, { caption: message, parse_mode: 'HTML' });
        }

        // Keyingi sahifa haqida ma'lumot
        bot.sendMessage(
            chatId,
            `Ko'proq filmlarni ko'rish uchun /category_${category} buyrug'ini qayta yuboring.`
        );
    } catch (error) {
        bot.sendMessage(chatId, `Xatolik yuz berdi: ${error.message}`);
    }
});
