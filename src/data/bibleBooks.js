// Bible books with abbreviations and full names

export const bibleBooks = [
  // Old Testament
  { abbr: 'Gen', name: 'Genesis', chapters: 50 },
  { abbr: 'Exo', name: 'Exodus', chapters: 40 },
  { abbr: 'Lev', name: 'Leviticus', chapters: 27 },
  { abbr: 'Num', name: 'Numbers', chapters: 36 },
  { abbr: 'Deu', name: 'Deuteronomy', chapters: 34 },
  { abbr: 'Jos', name: 'Joshua', chapters: 24 },
  { abbr: 'Jdg', name: 'Judges', chapters: 21 },
  { abbr: 'Rut', name: 'Ruth', chapters: 4 },
  { abbr: '1Sa', name: '1 Samuel', chapters: 31 },
  { abbr: '2Sa', name: '2 Samuel', chapters: 24 },
  { abbr: '1Ki', name: '1 Kings', chapters: 22 },
  { abbr: '2Ki', name: '2 Kings', chapters: 25 },
  { abbr: '1Ch', name: '1 Chronicles', chapters: 29 },
  { abbr: '2Ch', name: '2 Chronicles', chapters: 36 },
  { abbr: 'Ezr', name: 'Ezra', chapters: 10 },
  { abbr: 'Neh', name: 'Nehemiah', chapters: 13 },
  { abbr: 'Est', name: 'Esther', chapters: 10 },
  { abbr: 'Job', name: 'Job', chapters: 42 },
  { abbr: 'Psa', name: 'Psalms', chapters: 150 },
  { abbr: 'Pro', name: 'Proverbs', chapters: 31 },
  { abbr: 'Ecc', name: 'Ecclesiastes', chapters: 12 },
  { abbr: 'Sol', name: 'Song of Solomon', chapters: 8 },
  { abbr: 'Isa', name: 'Isaiah', chapters: 66 },
  { abbr: 'Jer', name: 'Jeremiah', chapters: 52 },
  { abbr: 'Lam', name: 'Lamentations', chapters: 5 },
  { abbr: 'Eze', name: 'Ezekiel', chapters: 48 },
  { abbr: 'Dan', name: 'Daniel', chapters: 12 },
  { abbr: 'Hos', name: 'Hosea', chapters: 14 },
  { abbr: 'Joe', name: 'Joel', chapters: 3 },
  { abbr: 'Amo', name: 'Amos', chapters: 9 },
  { abbr: 'Oba', name: 'Obadiah', chapters: 1 },
  { abbr: 'Jon', name: 'Jonah', chapters: 4 },
  { abbr: 'Mic', name: 'Micah', chapters: 7 },
  { abbr: 'Nah', name: 'Nahum', chapters: 3 },
  { abbr: 'Hab', name: 'Habakkuk', chapters: 3 },
  { abbr: 'Zep', name: 'Zephaniah', chapters: 3 },
  { abbr: 'Hag', name: 'Haggai', chapters: 2 },
  { abbr: 'Zec', name: 'Zechariah', chapters: 14 },
  { abbr: 'Mal', name: 'Malachi', chapters: 4 },
  // New Testament
  { abbr: 'Mat', name: 'Matthew', chapters: 28 },
  { abbr: 'Mar', name: 'Mark', chapters: 16 },
  { abbr: 'Luk', name: 'Luke', chapters: 24 },
  { abbr: 'Joh', name: 'John', chapters: 21 },
  { abbr: 'Act', name: 'Acts', chapters: 28 },
  { abbr: 'Rom', name: 'Romans', chapters: 16 },
  { abbr: '1Co', name: '1 Corinthians', chapters: 16 },
  { abbr: '2Co', name: '2 Corinthians', chapters: 13 },
  { abbr: 'Gal', name: 'Galatians', chapters: 6 },
  { abbr: 'Eph', name: 'Ephesians', chapters: 6 },
  { abbr: 'Php', name: 'Philippians', chapters: 4 },
  { abbr: 'Col', name: 'Colossians', chapters: 4 },
  { abbr: '1Th', name: '1 Thessalonians', chapters: 5 },
  { abbr: '2Th', name: '2 Thessalonians', chapters: 3 },
  { abbr: '1Ti', name: '1 Timothy', chapters: 6 },
  { abbr: '2Ti', name: '2 Timothy', chapters: 4 },
  { abbr: 'Tit', name: 'Titus', chapters: 3 },
  { abbr: 'Phm', name: 'Philemon', chapters: 1 },
  { abbr: 'Heb', name: 'Hebrews', chapters: 13 },
  { abbr: 'Jas', name: 'James', chapters: 5 },
  { abbr: '1Pe', name: '1 Peter', chapters: 5 },
  { abbr: '2Pe', name: '2 Peter', chapters: 3 },
  { abbr: '1Jo', name: '1 John', chapters: 5 },
  { abbr: '2Jo', name: '2 John', chapters: 1 },
  { abbr: '3Jo', name: '3 John', chapters: 1 },
  { abbr: 'Jud', name: 'Jude', chapters: 1 },
  { abbr: 'Rev', name: 'Revelation', chapters: 22 }
]

// Lookup map for quick access
export const bookByAbbr = Object.fromEntries(
  bibleBooks.map(book => [book.abbr, book])
)

// Format verse reference: "Gen.1.1" -> "Genesis 1:1"
export function formatVerseRef(verseId) {
  if (!verseId) return ''
  const [abbr, chapter, verse] = verseId.split('.')
  const book = bookByAbbr[abbr]
  if (!book) return verseId
  return `${book.name} ${chapter}:${verse}`
}

// Format chapter reference: "Gen", 1 -> "Genesis 1"
export function formatChapterRef(abbr, chapter) {
  const book = bookByAbbr[abbr]
  if (!book) return `${abbr} ${chapter}`
  return `${book.name} ${chapter}`
}
