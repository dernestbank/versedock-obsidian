/** 66-book Protestant canon with OSIS identifiers and upstream ENGWEBP VPL codes. */
export interface BookInfo {
  vpl: string;
  osis: string;
  name: string;
  aliases: string[];
}
const bookLines = [
  "GEN|Gen|Genesis|ge",
  "EXO|Exod|Exodus|ex",
  "LEV|Lev|Leviticus|lv",
  "NUM|Num|Numbers|nu",
  "DEU|Deut|Deuteronomy|dt",
  "JOS|Josh|Joshua|jos",
  "JDG|Judg|Judges|jdg",
  "RUT|Ruth|Ruth|ru",
  "1SA|1Sam|1 Samuel|1sa,1sam",
  "2SA|2Sam|2 Samuel|2sa,2sam",
  "1KI|1Kgs|1 Kings|1ki,1kgs",
  "2KI|2Kgs|2 Kings|2ki,2kgs",
  "1CH|1Chr|1 Chronicles|1ch,1chr",
  "2CH|2Chr|2 Chronicles|2ch,2chr",
  "EZR|Ezra|Ezra|ezr",
  "NEH|Neh|Nehemiah|neh",
  "EST|Esth|Esther|est",
  "JOB|Job|Job|jb",
  "PSA|Ps|Psalms|ps,psalm,psa",
  "PRO|Prov|Proverbs|pro,pr",
  "ECC|Eccl|Ecclesiastes|ecc,ec",
  "SOL|Song|Song of Solomon|songofsongs,sos,sol,cant",
  "ISA|Isa|Isaiah|is",
  "JER|Jer|Jeremiah|je",
  "LAM|Lam|Lamentations|la",
  "EZE|Ezek|Ezekiel|eze,ezk",
  "DAN|Dan|Daniel|da",
  "HOS|Hos|Hosea|ho",
  "JOE|Joel|Joel|joe",
  "AMO|Amos|Amos|am",
  "OBA|Obad|Obadiah|oba",
  "JON|Jonah|Jonah|jon",
  "MIC|Mic|Micah|mi",
  "NAH|Nah|Nahum|na",
  "HAB|Hab|Habakkuk|hab",
  "ZEP|Zeph|Zephaniah|zep",
  "HAG|Hag|Haggai|hag",
  "ZEC|Zech|Zechariah|zec",
  "MAL|Mal|Malachi|mal",
  "MAT|Matt|Matthew|mat,mt",
  "MAR|Mark|Mark|mar,mk",
  "LUK|Luke|Luke|luk,lk",
  "JOH|John|John|joh,jn",
  "ACT|Acts|Acts|act,ac",
  "ROM|Rom|Romans|rom,ro",
  "1CO|1Cor|1 Corinthians|1co,1cor",
  "2CO|2Cor|2 Corinthians|2co,2cor",
  "GAL|Gal|Galatians|gal",
  "EPH|Eph|Ephesians|eph",
  "PHI|Phil|Philippians|phi,php",
  "COL|Col|Colossians|col",
  "1TH|1Thess|1 Thessalonians|1th,1thes",
  "2TH|2Thess|2 Thessalonians|2th,2thes",
  "1TI|1Tim|1 Timothy|1ti,1tim",
  "2TI|2Tim|2 Timothy|2ti,2tim",
  "TIT|Titus|Titus|tit",
  "PHM|Phlm|Philemon|phm,phile",
  "HEB|Heb|Hebrews|heb",
  "JAM|Jas|James|jam,jas",
  "1PE|1Pet|1 Peter|1pe,1pet",
  "2PE|2Pet|2 Peter|2pe,2pet",
  "1JO|1John|1 John|1jo,1jn",
  "2JO|2John|2 John|2jo,2jn",
  "3JO|3John|3 John|3jo,3jn",
  "JUD|Jude|Jude|jud",
  "REV|Rev|Revelation|rev,re,revelations"
];
export const BOOKS: BookInfo[] = bookLines.map(line => {
  const [vpl, osis, name, short] = line.split("|");
  return { vpl, osis, name, aliases: [name, osis, vpl, ...short.split(",")] };
});
export const BOOK_BY_VPL = new Map(BOOKS.map(b => [b.vpl, b]));
export const BOOK_BY_OSIS = new Map(BOOKS.map(b => [b.osis, b]));

export function normalizeBookAlias(input: string): string {
  return input.toLowerCase().normalize("NFKC").replace(/[\s._\-]/g, "");
}
const ALIASES = BOOKS.flatMap(book =>
  book.aliases.map(alias => ({ value: normalizeBookAlias(alias), book }))
).sort((a, b) => b.value.length - a.value.length);

export function bookByName(input: string): BookInfo | undefined {
  const key = normalizeBookAlias(input);
  return ALIASES.find(entry => entry.value === key)?.book;
}
export function findBookPrefix(input: string): { book: BookInfo; remaining: string } | null {
  const raw = input.trim().replace(/\./g, " ");
  for (const entry of ALIASES) {
    // Strip spaces only for matching, then locate equivalent original prefix length.
    let j = 0, key = "";
    while (j < raw.length && key.length < entry.value.length) {
      if (!/[\s._-]/.test(raw[j])) key += raw[j].toLowerCase();
      j++;
    }
    if (key === entry.value) {
      const remainder = raw.slice(j);
      if (/^\s*\d/.test(remainder)) return { book: entry.book, remaining: remainder };
    }
  }
  return null;
}
