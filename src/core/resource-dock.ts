import {isDiscoveredId} from './discovery-sources';
import { parseOsis, type PassageReference } from "./references";
import { readingSource } from "./reading-catalogue";
import { isLocalModuleId } from "./module-provenance";

export const RESOURCE_TYPES = ["bible", "commentary", "dictionary", "book", "devotional", "graphics"] as const;
export type ResourceType = typeof RESOURCE_TYPES[number];
export const RESOURCE_LABELS: Record<ResourceType, string> = {
  bible: "Bible", commentary: "Commentary", dictionary: "Dictionary",
  book: "Book", devotional: "Devotional", graphics: "Graphics"
};

export interface ResourceAvailability {
  webp: boolean;
  kjv: boolean;
  mhc: boolean;
  strongs: boolean;
}

export interface DockResource {
  id: string;
  type: ResourceType;
  title: string;
  abbreviation: string;
  availabilityKey: keyof ResourceAvailability;
}

/** Only actually installed, validated resources belong in the native switcher. */
const BUNDLED_DOCK_RESOURCES: readonly DockResource[] = [
  { id: "webp", type: "bible", title: "World English Bible", abbreviation: "WEB", availabilityKey: "webp" },
  { id: "kjv", type: "bible", title: "King James Version", abbreviation: "KJV", availabilityKey: "kjv" },
  { id: "mhc", type: "commentary", title: "Matthew Henry’s Complete Commentary", abbreviation: "MHC", availabilityKey: "mhc" },
  { id: "strongs-greek", type: "dictionary", title: "Strong’s Greek Dictionary", abbreviation: "G", availabilityKey: "strongs" },
  { id: "strongs-hebrew", type: "dictionary", title: "Strong’s Hebrew Dictionary", abbreviation: "H", availabilityKey: "strongs" }
];

export function installedDockResources(type: ResourceType, availability: ResourceAvailability): DockResource[] {
  return BUNDLED_DOCK_RESOURCES.filter(resource => resource.type === type && availability[resource.availabilityKey]);
}

export function selectedDockResource(type: ResourceType, requestedId: string | null,
  availability: ResourceAvailability): DockResource | null {
  const options = installedDockResources(type, availability);
  return options.find(resource => resource.id === requestedId) ?? options[0] ?? null;
}

export function strongsMatchesDictionary(resourceId: string, code: string): boolean {
  return (resourceId === "strongs-greek" && /^G[1-9]\d{0,4}$/i.test(code))
    || (resourceId === "strongs-hebrew" && /^H[1-9]\d{0,4}$/i.test(code));
}

export interface ResourceDockState {
  resourceType: ResourceType;
  moduleId: string | null;
  pinnedReference: PassageReference | null;
  moduleSelections: Partial<Record<ResourceType, string>>;
  dictionaryQueries: Record<string, string>;
}

export function restoredResourceDockState(value: unknown): ResourceDockState {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const resourceType = RESOURCE_TYPES.includes(raw.resourceType as ResourceType)
    ? raw.resourceType as ResourceType : "commentary";
  const moduleId = typeof raw.moduleId === "string" && raw.moduleId.length <= 60 ? raw.moduleId : null;
  let pinnedReference: PassageReference | null = null;
  if (typeof raw.pinnedReference === "string" && raw.pinnedReference.length <= 100) {
    try { pinnedReference = parseOsis(raw.pinnedReference); } catch { /* Invalid persisted state is ignored. */ }
  }
  const moduleSelections: Partial<Record<ResourceType, string>> = {};
  const dictionaryQueries: Record<string, string> = {};
  const selections = raw.moduleSelections && typeof raw.moduleSelections === "object"
    ? raw.moduleSelections as Record<string, unknown> : {};
  for (const type of RESOURCE_TYPES) {
    const id = selections[type];
    if (BUNDLED_DOCK_RESOURCES.some(module => module.type === type && module.id === id)
      || (typeof id === "string" && (readingSource(id)?.type === type || (isLocalModuleId(id,type)||isDiscoveredId(id,type))))) moduleSelections[type] = id as string;
  }
  const queries = raw.dictionaryQueries && typeof raw.dictionaryQueries === "object"
    ? raw.dictionaryQueries as Record<string, unknown> : {};
  for (const [id,query] of Object.entries(queries)) {
    const strongs = id === "strongs-greek" || id === "strongs-hebrew";
    if ((strongs || readingSource(id)?.type === "dictionary" || (isLocalModuleId(id,"dictionary")||isDiscoveredId(id,"dictionary"))) && typeof query === "string" && query.length <= (strongs ? 6 : 100)) dictionaryQueries[id] = query;
  }
  return { resourceType, moduleId, pinnedReference, moduleSelections, dictionaryQueries };
}
