const dailyLimit = 15;
if (!global.dailySlotUsage) global.dailySlotUsage = {};

module.exports = {
  config: {
    name: "slot",
    version: "1.1",
    author: "OtinXSandip + Anas",
    shortDescription: {
      en: "Slot game",
    },
    longDescription: {
      en: "Slot game.",
    },
    category: "Game",
  },
  langs: {
    en: {
      invalid_amount: "Enter a valid and positive amount to have a chance to win double.",
      not_enough_money: "Check your balance if you have that amount.",
      daily_limit: "🚫 You've reached your daily limit of 15 slot spins. Come back tomorrow!",
      win_message: "🎉 You won $%1, buddy!",
      lose_message: "😢 You lost $%1, buddy.",
      jackpot_message: "💥 Jackpot! You won $%1 with three %2 symbols, buddy!",
    },
  },

  onStart: async function ({ args, message, event, usersData, getLang }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID);
    const amount = parseInt(args[0]);
    const today = new Date().toLocaleDateString("en-CA");

    if (!global.dailySlotUsage[senderID]) {
      global.dailySlotUsage[senderID] = { date: today, count: 0 };
    } else if (global.dailySlotUsage[senderID].date !== today) {
      global.dailySlotUsage[senderID] = { date: today, count: 0 };
    }

    if (global.dailySlotUsage[senderID].count >= dailyLimit) {
      return message.reply(getLang("daily_limit"));
    }

    if (isNaN(amount) || amount <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    if (amount > userData.money) {
      return message.reply(getLang("not_enough_money"));
    }

    global.dailySlotUsage[senderID].count++;

    const slots = ["💚", "💛", "💙"];
    const win = Math.random() < 0.5;
    let slot1, slot2, slot3;

    if (win) {
      const symbol = slots[Math.floor(Math.random() * slots.length)];
      const winType = Math.floor(Math.random() * 4);
      if (winType === 0) {
        slot1 = slot2 = slot3 = symbol;
      } else if (winType === 1) {
        slot1 = slot2 = symbol;
        slot3 = getDifferentSymbol(symbol, slots);
      } else if (winType === 2) {
        slot1 = slot3 = symbol;
        slot2 = getDifferentSymbol(symbol, slots);
      } else {
        slot2 = slot3 = symbol;
        slot1 = getDifferentSymbol(symbol, slots);
      }
    } else {
      do {
        slot1 = slots[Math.floor(Math.random() * slots.length)];
        slot2 = slots[Math.floor(Math.random() * slots.length)];
        slot3 = slots[Math.floor(Math.random() * slots.length)];
      } while (slot1 === slot2 && slot2 === slot3);
    }

    const winnings = calculateWinnings(slot1, slot2, slot3, amount);

    await usersData.set(senderID, {
      money: userData.money + winnings,
      data: userData.data,
    });

    const messageText = getSpinResultMessage(slot1, slot2, slot3, winnings, getLang);
    return message.reply(messageText);
  },
};

function calculateWinnings(slot1, slot2, slot3, betAmount) {
  if (slot1 === "💚" && slot2 === "💚" && slot3 === "💚") {
    return betAmount * 10;
  } else if (slot1 === "💛" && slot2 === "💛" && slot3 === "💛") {
    return betAmount * 5;
  } else if (slot1 === slot2 && slot2 === slot3) {
    return betAmount * 3;
  } else if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
    return betAmount * 2;
  } else {
    return -betAmount;
  }
}

function getSpinResultMessage(slot1, slot2, slot3, winnings, getLang) {
  const resultDisplay = `[ ${slot1} | ${slot2} | ${slot3} ]`;
  if (winnings > 0) {
    if (slot1 === "💙" && slot2 === "💙" && slot3 === "💙") {
      return getLang("jackpot_message", winnings, "💙") + `\n${resultDisplay}`;
    } else {
      return getLang("win_message", winnings) + `\n${resultDisplay}`;
    }
  } else {
    return getLang("lose_message", -winnings) + `\n${resultDisplay}`;
  }
}

function getDifferentSymbol(symbol, slotArray) {
  let newSymbol;
  do {
    newSymbol = slotArray[Math.floor(Math.random() * slotArray.length)];
  } while (newSymbol === symbol);
  return newSymbol;
}
