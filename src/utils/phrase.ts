import { PHRASE_CODE } from "../constants/phrase-code";

export const generatePhrase = (count: number = 6): string => {
  const words = [];

  for (let i = 0; i < count; i++) {
    const rand = Math.floor(Math.random() * PHRASE_CODE.length);
    words.push(PHRASE_CODE[rand]);
  }

  return words.join(" ");
};