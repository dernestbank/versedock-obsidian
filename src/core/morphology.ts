/** Factual code expansions from Maurice Robinson's public-domain documentation.
 * https://github.com/byztxt/robinson-documentation/tree/master/doc
 * Unknown schemas or complete combinations remain undecoded, with their raw code visible.
 */
export const MORPHOLOGY_SOURCE = "https://github.com/byztxt/robinson-documentation";
const cases: Record<string, string> = { N: "Nominative", V: "Vocative", G: "Genitive", D: "Dative", A: "Accusative" };
const numbers: Record<string, string> = { S: "Singular", P: "Plural" };
const genders: Record<string, string> = { M: "Masculine", F: "Feminine", N: "Neuter" };
const people: Record<string, string> = { "1": "First person", "2": "Second person", "3": "Third person" };
const suffixes: Record<string, string> = { S: "Superlative", C: "Comparative", ABB: "Abbreviated form", I: "Interrogative", N: "Negative", K: "Crasis", ATT: "Attic Greek form" };
const undeclined: Record<string, string> = {
  ADV: "Adverb", CONJ: "Conjunction", COND: "Conditional particle or conjunction", PRT: "Particle", PREP: "Preposition", INJ: "Interjection",
  ARAM: "Indeclinable Aramaic word", HEB: "Indeclinable Hebrew word", "N-PRI": "Indeclinable proper noun", "A-NUI": "Indeclinable numeral",
  "N-LI": "Indeclinable letter", "N-OI": "Indeclinable noun"
};
const parts: Record<string, string> = {
  N: "Noun", A: "Adjective", R: "Relative pronoun", C: "Reciprocal pronoun", D: "Demonstrative pronoun", T: "Definite article",
  K: "Correlative pronoun", I: "Interrogative pronoun", X: "Indefinite pronoun", Q: "Correlative or interrogative pronoun",
  F: "Reflexive pronoun", S: "Possessive adjective", P: "Personal pronoun"
};
function declension(code: string, allowVocative = true): string[] | null {
  const match = /^([NVGDA])([SP])([MFN])?$/.exec(code);
  if (!match || (!allowVocative && match[1] === "V")) return null;
  return [cases[match[1]], numbers[match[2]], ...(match[3] ? [genders[match[3]]] : [])];
}
export function describeMorphology(source: string): string | null {
  if (!source.startsWith("robinson:") || source.length > 80) return null;
  const code = source.slice(9);
  if (Object.hasOwn(undeclined, code)) return undeclined[code];
  const chunks = code.split("-");
  if (Object.hasOwn(undeclined, chunks[0]) && chunks.length === 2 && Object.hasOwn(suffixes, chunks[1]))
    return undeclined[chunks[0]] + " · " + suffixes[chunks[1]];
  if (chunks[0] === "V") {
    const verb = /^(2?[PIFARL])([AMPEDON])([ISOMNP])$/.exec(chunks[1] ?? "");
    if (!verb) return null;
    const tense: Record<string, string> = { P: "Present", I: "Imperfect", F: "Future", A: "Aorist", R: "Perfect", L: "Pluperfect", "2F": "Second future", "2A": "Second aorist", "2R": "Second perfect", "2L": "Second pluperfect" };
    const voice: Record<string, string> = { A: "Active", M: "Middle", P: "Passive", E: "Middle or passive", D: "Middle deponent", O: "Passive deponent", N: "Middle or passive deponent" };
    const mood: Record<string, string> = { I: "Indicative", S: "Subjunctive", O: "Optative", M: "Imperative", N: "Infinitive", P: "Participle" };
    if (!Object.hasOwn(tense, verb[1])) return null;
    const result = ["Verb", tense[verb[1]], voice[verb[2]], mood[verb[3]]];
    let used = 2;
    if (verb[3] === "P") {
      const declined = declension(chunks[2] ?? "", false);
      if (!declined || declined.length !== 3) return null;
      result.push(...declined); used++;
    } else if (verb[3] !== "N") {
      const finite = /^([123])([SP])$/.exec(chunks[2] ?? "");
      if (!finite) return null;
      result.push(people[finite[1]], numbers[finite[2]]); used++;
    }
    if (chunks.length === used + 1 && chunks[used] === "ATT") result.push(suffixes.ATT);
    else if (chunks.length !== used) return null;
    return result.join(" · ");
  }
  if (!Object.hasOwn(parts, chunks[0]) || chunks.length < 2 || chunks.length > 3) return null;
  let ending = chunks[1];
  const result = [parts[chunks[0]]];
  if (["P", "F", "S"].includes(chunks[0]) && /^[123]/.test(ending)) {
    result.push(people[ending[0]]); ending = ending.slice(1);
    if (chunks[0] === "S") {
      if (!Object.hasOwn(numbers, ending[0])) return null;
      result.push(numbers[ending[0]] + " possessor"); ending = ending.slice(1);
    }
  }
  const declined = declension(ending);
  if (!declined || (declined.length !== 3 && chunks[0] !== "P")) return null;
  result.push(...declined);
  if (chunks.length === 3) {
    if (!Object.hasOwn(suffixes, chunks[2])) return null;
    result.push(suffixes[chunks[2]]);
  }
  return result.join(" · ");
}
