const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const API_URL = 'https://www.1secmail.com/api/v1/';

// Helper to generate a random email
const generateEmail = () => {
  const domains = ["1secmail.com", "1secmail.net", "1secmail.org"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const login = Math.random().toString(36).substring(2, 10);
  return `${login}@${domain}`;
};

bot.start((ctx) => {
  ctx.reply("Welcome to Temp Mail Bot! 📧\n\nUse /generate to get a new email address.");
});

// Command to generate email
bot.command('generate', async (ctx) => {
  const email = generateEmail();
  ctx.reply(`Your Temp Mail: \`${email}\`\n\nClick the button below to check for messages.`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: "🔄 Check Inbox", callback_data: `check_${email}` }
      ]]
    }
  });
});

// Handle Inbox Check
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (data.startsWith('check_')) {
    const email = data.split('_')[1];
    const [login, domain] = email.split('@');

    try {
      const response = await axios.get(`${API_URL}?action=getMessages&login=${login}&domain=${domain}`);
      const messages = response.data;

      if (messages.length === 0) {
        return ctx.answerCbQuery("No messages yet. Try again in a bit!", { show_alert: true });
      }

      // Get the latest message content
      const lastMsg = messages[0];
      const msgDetail = await axios.get(`${API_URL}?action=readMessage&login=${login}&domain=${domain}&id=${lastMsg.id}`);
      
      const text = `📩 *New Message Found!*\n\n*From:* ${msgDetail.data.from}\n*Subject:* ${msgDetail.data.subject}\n\n*Content:* \n${msgDetail.data.textBody.substring(0, 500)}...`;

      ctx.reply(text, { parse_mode: 'Markdown' });
      ctx.answerCbQuery();
    } catch (error) {
      ctx.answerCbQuery("Error fetching mail.");
    }
  }
});

// Vercel Serverless Function Export
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } else {
    res.status(200).send('Bot is running...');
  }
};
      
