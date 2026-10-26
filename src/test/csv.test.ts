import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("feedback csv export", () => {
  it("joins columns with commas and rows with CRLF so spreadsheet apps read one row per line", () => {
    expect(toCsv([["section", "rating"], ["Program", 5]])).toBe("section,rating\r\nProgram,5");
  });

  it("quotes fields holding commas, quotes or line breaks and doubles inner quotes", () => {
    expect(toCsv([['Say "hi", now', "line1\nline2"]])).toBe('"Say ""hi"", now","line1\nline2"');
  });

  it("writes null and undefined as empty cells instead of the text null", () => {
    expect(toCsv([[null, undefined, 5, ""]])).toBe(",,5,");
  });

  it("keeps a comment containing a comma inside one cell", () => {
    const [row] = toCsv([["Rate the day", "overall", "More coffee, less traffic", 4]]).split("\r\n");
    expect(row).toBe('Rate the day,overall,"More coffee, less traffic",4');
  });
});
