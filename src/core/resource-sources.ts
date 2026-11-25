export interface ExternalResourceSource {
  name: string;
  domain: string;
  category: string;
  url: string;
  kind: "external-site";
}

/** Publisher/community directories the user may visit before returning to local import review. */
export const EXTERNAL_RESOURCE_SOURCES: readonly ExternalResourceSource[] = [
  {
    name: "MySword third-party modules",
    domain: "mysword.info",
    category: "Publisher directory",
    url: "https://www.mysword.info/download-mysword/3rd-party-modules",
    kind: "external-site"
  },
  {
    name: "BibleSupport MySword modules",
    domain: "biblesupport.com",
    category: "Community catalogue",
    url: "https://www.biblesupport.com/e-sword-downloads/category/26-mysword-modules/",
    kind: "external-site"
  },
  {
    name: "Doctor Dave's MySword collection",
    domain: "doctordavet.com",
    category: "Community collection",
    url: "https://doctordavet.com/myswordmodules.html",
    kind: "external-site"
  }
];
