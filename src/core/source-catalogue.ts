import { RESOURCE_LABELS, RESOURCE_TYPES, type ResourceType } from "./resource-dock";

export interface SourceModuleCandidate {
  id: string;
  type: ResourceType;
  title: string;
  publisher: string;
  sourcePage: string;
  directDownload: string;
  container: string;
}

/**
 * Curated links to publisher-hosted files, not mirrors, install-ready modules,
 * permission grants or claims of converter compatibility.
 * Individual authors' rights and provider terms must be reviewed before import.
 */
export const SOURCE_MODULE_CANDIDATES: readonly SourceModuleCandidate[] = [
  {
    id: "mysword-kjv", type: "bible", title: "KJV with Strong’s Numbers",
    publisher: "MySword", sourcePage: "https://www.mysword.info/download-mysword/bibles",
    directDownload: "https://mysword-bible.info/download/getfile.php?file=kjv.bbl.mybible.gz",
    container: "MySword Bible · gzip"
  },
  {
    id: "mysword-jfb", type: "commentary", title: "Jamieson, Fausset & Brown Commentary",
    publisher: "MySword", sourcePage: "https://www.mysword.info/download-mysword/commentaries",
    directDownload: "https://mysword-bible.info/download/getfile.php?file=jfb.cmt.mybible.gz",
    container: "MySword Commentary · gzip"
  },
  {
    id: "mysword-eastons", type: "dictionary", title: "Easton’s Illustrated Bible Dictionary",
    publisher: "MySword", sourcePage: "https://www.mysword.info/download-mysword/dictionaries",
    directDownload: "https://mysword-bible.info/download/getfile.php?file=eastons.dct.mybible.gz",
    container: "MySword Dictionary · gzip"
  },
  {
    id: "mysword-all-of-grace", type: "book", title: "All of Grace · C. H. Spurgeon",
    publisher: "MySword", sourcePage: "https://www.mysword.info/download-mysword/books",
    directDownload: "https://mysword-bible.info/download/getfile.php?file=spurgeon-allofgrace.bok.mybible.gz",
    container: "MySword Book · gzip"
  },
  {
    id: "mysword-morning-evening", type: "devotional", title: "Morning and Evening · C. H. Spurgeon",
    publisher: "MySword", sourcePage: "https://www.mysword.info/download-mysword/devotionals",
    directDownload: "https://mysword-bible.info/download/getfile.php?file=spurgeon-morning-evening.bok.mybible.gz",
    container: "MySword Book container · devotional · gzip"
  },
  {
    id: "mysword-sunday-atlas", type: "graphics", title: "The Complete Sunday School Atlas",
    publisher: "MySword", sourcePage: "https://www.mysword.info/download-mysword/graphics",
    directDownload: "https://mysword-bible.info/download/getfile.php?file=completesundayschoolatlas.bok.mybible.gz",
    container: "MySword Book container · graphics/maps · gzip"
  }
];

export function sourceCandidates(type: ResourceType | "all", query: string): SourceModuleCandidate[] {
  const phrase = query.trim().toLocaleLowerCase();
  return SOURCE_MODULE_CANDIDATES.filter(candidate => (type === "all" || type === candidate.type)
    && (!phrase || [candidate.title, candidate.publisher, RESOURCE_LABELS[candidate.type], candidate.container]
      .some(field => field.toLocaleLowerCase().includes(phrase))));
}

export function catalogueCategories(): readonly ResourceType[] {
  return RESOURCE_TYPES;
}
