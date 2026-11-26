import { describe, expect, it } from "vitest";
import { restoredInterlinearPreferences } from "../src/core/interlinear-preferences";

describe("interlinear display preferences", () => {
  it("retains each row independently and bounds persisted font settings", () => {
    expect(restoredInterlinearPreferences({order:"english",transliteration:false,gloss:true,strongs:false,grammar:true,font:"serif",size:32}))
      .toEqual({order:"english",transliteration:false,gloss:true,strongs:false,grammar:true,font:"serif",size:32});
    const safe=restoredInterlinearPreferences({order:"../bad",gloss:"false",grammar:1,font:"url(remote)",size:999});
    expect(safe).toEqual({order:"source",transliteration:true,gloss:true,strongs:true,grammar:false,font:"system",size:24});
    expect(restoredInterlinearPreferences(null)).toEqual(safe);
  });
});
