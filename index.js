const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require('express');
const app = express();
const schedule = require('node-schedule');


// replace the value below with the Telegram token you receive from @BotFather
const token = "6310410166:AAFwb_9SQVSpsXo6T3CAluEHEnVqR55bR3s";

const bot = new TelegramBot(token, { polling: true });

// Store user subscriptions (You can use a database for a production bot)
const subscriptions = new Map();

const rule = new schedule.RecurrenceRule();
rule.hour = 8;
rule.minute = 0;
rule.tz = 'IST';

const job = schedule.scheduleJob(rule, async function(){
  console.log(`The answer to life, the universe, and everything! for`);
  console.log(subscriptions)
  for (let [chatId, userCity] of subscriptions) {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${userCity}&appid=d7aaebaac39da916afff895053576e9d`
      );
      const data = response.data;
      const weather = data.weather[0].description;
      const temperature = data.main.temp - 273.15;
      const city = data.name;
      const humidity = data.main.humidity;
      const pressure = data.main.pressure;
      const windSpeed = data.wind.speed;
      const message =
        `The weather in ${city} is ${weather} with \nTemperature : ${temperature.toFixed(2)}°C \nHumidity : ${humidity}% \nPressure : ${pressure}hPa \nWind speed : ${windSpeed}m/s`;

      bot.sendMessage(chatId, message);
    } catch (error) {
      bot.sendMessage(chatId, "Some error occured.");
      console.log(error)
    }
    
}
});
// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const message = 'Welcome to the Aaj Ka Mosam Broadcasting Bot! \n Type /subscribe to recieve daily weather report.';
  bot.sendMessage(chatId, message);
});

// Subscribe command
bot.onText(/\/subscribe/, async (msg) => {
  const chatId = msg.chat.id;
  if (!subscriptions.has(chatId)) {
    const cityPrompt = await bot.sendMessage(chatId, "Where do you live?", {
      reply_markup: {
        force_reply: true,
      },
    });
    bot.onReplyToMessage(msg.chat.id, cityPrompt.message_id, async (cityMsg) => {
      const userInput = cityMsg.text;
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${userInput}&appid=d7aaebaac39da916afff895053576e9d`
        );
        const city=response.data.name;
        subscriptions.set(chatId, city);
        const message =
           `You are now subscribed to our service. You will get weather at your city at 8AM daily. \nYou can type /stop anytime to unsubscribe this.`;  
        bot.sendMessage(chatId, message);
      } catch (error) {
        bot.sendMessage(chatId, "City does not exist");
      }
      
    });
    
  } else {
    bot.sendMessage(chatId, 'You are already subscribed.');
  }
});

// Unsubscribe command
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  if (subscriptions.has(chatId)) {
    subscriptions.delete(chatId);
    bot.sendMessage(chatId, 'You are unsubscribed from our service.');
  } else {
    bot.sendMessage(chatId, 'You are not subscribed.');
  }
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userInput = msg.text;
  if (!userInput.match(/\/start|\/subscribe|\/stop/)) {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${userInput}&appid=d7aaebaac39da916afff895053576e9d`
      );
      const data = response.data;
      const weather = data.weather[0].description;
      const temperature = data.main.temp - 273.15;
      const city = data.name;
      const humidity = data.main.humidity;
      const pressure = data.main.pressure;
      const windSpeed = data.wind.speed;
      const message =
        `The weather in ${city} is ${weather} with \nTemperature : ${temperature.toFixed(2)}°C \nHumidity : ${humidity}% \nPressure : ${pressure}hPa \nWind speed : ${windSpeed}m/s`;

      bot.sendMessage(chatId, message);
    } catch (error) {
      bot.sendMessage(chatId, "City does not exist");
    }
  }
});


app.get('/', (req, res) => {
  res.send('Bot is live');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});