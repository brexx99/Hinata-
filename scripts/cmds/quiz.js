const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json"
  );
  return base.data.api;
};

if (!global.quizUsage) global.quizUsage = {};

const COOLDOWN_HOURS = 8;
const MAX_ATTEMPTS = 20;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "1.1",
    author: "Dipto + Anas",
    countDown: 0,
    role: 0,
    category: "game",
    guide: "{p}quiz \n{p}quiz bn \n{p}quiz en",
  },

  onStart: async function ({ api, event, usersData, args }) {
    const userID = event.senderID;
    const now = Date.now();

    if (!global.quizUsage[userID]) {
      global.quizUsage[userID] = {
        lastReset: now,
        count: 0,
      };
    } else {
      const elapsed = now - global.quizUsage[userID].lastReset;
      if (elapsed >= COOLDOWN_MS) {
        global.quizUsage[userID].lastReset = now;
        global.quizUsage[userID].count = 0;
      }
    }

    if (global.quizUsage[userID].count >= MAX_ATTEMPTS) {
      const timeLeft = COOLDOWN_MS - (now - global.quizUsage[userID].lastReset);
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return api.sendMessage(`🚫 You've used all 15 attempts. Please wait ${hours}h ${minutes}m before trying again.`, event.threadID, event.messageID);
    }

    global.quizUsage[userID].count++;

    const input = args.join('').toLowerCase() || "bn";
    let timeout = 300;
    let category = (input === "en" || input === "english") ? "english" : "bangla";

    try {
      const response = await axios.get(
        `${await baseApiUrl()}/quiz?category=${category}&q=random`
      );

      const quizData = response.data.question;
      const { question, correctAnswer, options } = quizData;
      const { a, b, c, d } = options;
      const namePlayerReact = await usersData.getName(event.senderID);
      const quizMsg = {
        body:
          `╭──✦ ${question}\n` +
          `├‣ 𝗔) ${a}\n` +
          `├‣ 𝗕) ${b}\n` +
          `├‣ 𝗖) ${c}\n` +
          `├‣ 𝗗) ${d}\n` +
          `╰──────────────────‣\n` +
          `Reply to this message with your answer.`,
      };

      api.sendMessage(
        quizMsg,
        event.threadID,
        (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            type: "reply",
            commandName: this.config.name,
            author: event.senderID,
            messageID: info.messageID,
            dataGame: quizData,
            correctAnswer,
            nameUser: namePlayerReact
          });
          setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, timeout * 1000);
        },
        event.messageID,
      );
    } catch (error) {
      console.error("❌ | Error occurred:", error);
      api.sendMessage(error.message, event.threadID, event.messageID);
    }
  },

  onReply: async ({ event, api, Reply, usersData }) => {
    const { correctAnswer, nameUser, author } = Reply;
    if (event.senderID !== author)
      return api.sendMessage("Who are you bby🐸🦎", event.threadID, event.messageID);

    const userReply = event.body.toLowerCase();
    await api.unsendMessage(Reply.messageID).catch(console.error);

    if (userReply === correctAnswer.toLowerCase()) {
      const rewardCoins = 300;
      const rewardExp = 100;
      const userData = await usersData.get(author);

      await usersData.set(author, {
        money: userData.money + rewardCoins,
        exp: userData.exp + rewardExp,
        data: userData.data,
      });

      const correctMsg = `🎉 Congratulations, ${nameUser}! 🌟🎉\n\nYou're a Quiz Champion! 🏆\n\nYou've earned ${rewardCoins} Coins 💰 and ${rewardExp} EXP 🌟\n\nKeep it up!!`;
      api.sendMessage(correctMsg, event.threadID, event.messageID);
    } else {
      const incorrectMsg = `❌ | Sorry, ${nameUser}, wrong answer.\n✅ | The correct answer was: ${correctAnswer}`;
      api.sendMessage(incorrectMsg, event.threadID, event.messageID);
    }
  },
};
