const toneMap: Record<string, string> = {
  ā: "a",
  á: "a",
  ǎ: "a",
  à: "a",
  ē: "e",
  é: "e",
  ě: "e",
  è: "e",
  ī: "i",
  í: "i",
  ǐ: "i",
  ì: "i",
  ō: "o",
  ó: "o",
  ǒ: "o",
  ò: "o",
  ū: "u",
  ú: "u",
  ǔ: "u",
  ù: "u",
  ǖ: "u",
  ǘ: "u",
  ǚ: "u",
  ǜ: "u",
  ü: "u",
  ń: "n",
  ň: "n",
  ǹ: "n",
  Ā: "a",
  Á: "a",
  Ǎ: "a",
  À: "a",
  Ē: "e",
  É: "e",
  Ě: "e",
  È: "e",
  Ī: "i",
  Í: "i",
  Ǐ: "i",
  Ì: "i",
  Ō: "o",
  Ó: "o",
  Ǒ: "o",
  Ò: "o",
  Ū: "u",
  Ú: "u",
  Ǔ: "u",
  Ù: "u",
  Ǖ: "u",
  Ǘ: "u",
  Ǚ: "u",
  Ǜ: "u",
  Ü: "u",
  Ń: "n",
  Ň: "n",
  Ǹ: "n",
};

const toneRegex = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüńňǹĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜŃŇǸ]/g;
const nonLetterRegex = /[^a-z]/g;

export const stripToneMarks = (text: string): string =>
  text.replace(toneRegex, (char) => toneMap[char] ?? char);

export const normalizePinyin = (text: string): string =>
  stripToneMarks(text)
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export const normalizePinyinWord = (text: string): string =>
  stripToneMarks(text)
    .trim()
    .toLowerCase()
    .replace(/v/g, "u")
    .replace(nonLetterRegex, "");
