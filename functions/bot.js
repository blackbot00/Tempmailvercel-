import { Telegraf } from 'telegraf';
import axios from 'axios';

const API_URL = 'https://www.1secmail.com/api/v1/';

export async function onRequest(context) {
  const { request, env } = context;
  
  // Initialize bot inside the request to use the env variables
  const bot = new Telegraf(env.BOT_TOKEN);

  // --- BOT LOGIC START ---
  bot.start((ctx) => ctx.reply("Welcome! Use /generate for a Temp Mail."));

  bot.command('generate', async (ctx) => {
    const domains = ["1secmail.com", "1secmail.net"];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const login = Math.random().toString(36).substring(2, 10);
    const email = `${login}@${domain}`;

    ctx.reply(`Your Email: \`${email}\``, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: "📥 Check Inbox", callback_data: `check_${email}` }]]
      }
    });
  });

  bot.on('callback_query', async (ctx) => {
    const email = ctx.callbackQuery.data.split('_')[1];
    const [login, domain] = email.split('@');
    try {
      const res = await axios.get(`${API_URL}?action=getMessages&login=${login}&domain=${domain}`);
      if (res.data.length === 0) return ctx.answerCbQuery("Empty inbox.");
      
      const msg = res.data[0];
      ctx.reply(`From: ${msg.from}\nSubject: ${msg.subject}`);
      ctx.answerCbQuery();
    } catch (e) {
      ctx.answerCbQuery("Error!");
    }
  });
  // --- BOT LOGIC END ---

  // Handle the Telegram update
  if (request.method === 'POST') {
    const payload = await request.json();
    await bot.handleUpdate(payload);
    return new Response('OK');
  }

  return new Response('Bot is alive!');
      }
              
