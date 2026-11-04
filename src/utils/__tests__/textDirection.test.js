import { describe, expect, it } from "vitest";

import { getTextDirection, getTextLanguage } from "../textDirection";

describe("textDirection", () => {
  it("detects Arabic messages as RTL", () => {
    expect(getTextDirection("كيف احصل على وظيفة؟")).toBe("rtl");
    expect(getTextLanguage("كيف احصل على وظيفة؟")).toBe("ar");
  });

  it("keeps English messages LTR", () => {
    expect(getTextDirection("How are you?")).toBe("ltr");
    expect(getTextLanguage("How are you?")).toBe("en");
  });

  it("keeps mixed Arabic and English terms RTL", () => {
    expect(getTextDirection("نتيجة SkillSpan readiness.available غير متوفرة")).toBe("rtl");
    expect(getTextDirection("هذه حالة Ready-ness في SkillSpan")).toBe("rtl");
  });

  it("keeps Arabic numbered lists RTL", () => {
    expect(getTextDirection("1. الخطوة الأولى\n2. Review SkillSpan readiness.available")).toBe("rtl");
  });

  it("does not classify numbers, punctuation, or English-only content as Arabic", () => {
    expect(getTextDirection("67/100 - SkillSpan readiness.available")).toBe("ltr");
  });

  it("works independently for user and assistant message content", () => {
    const userMessage = "أريد معرفة فجوة المهارات";
    const assistantMessage = "SkillSpan readiness.available is currently unavailable.";

    expect(getTextDirection(userMessage)).toBe("rtl");
    expect(getTextDirection(assistantMessage)).toBe("ltr");
  });
});
