export type PolicyCategory =
  | "crisis"
  | "medical"
  | "legal"
  | "investment"
  | "injection"
  | "csam";

export type PolicyResult =
  | { action: "allow" }
  | { action: "refuse"; category: PolicyCategory };

/** Fold common leetspeak / homoglyph noise for EN matching. */
export function foldForPolicy(raw: string): string {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/\+/g, "t");
}

/**
 * EN-first + Chinese crisis keywords + leet fold + red-team soft phrases.
 * When in doubt for safety categories → refuse.
 */
export function evaluateContentPolicy(mood: string): PolicyResult {
  const raw = mood.normalize("NFKC");
  const text = foldForPolicy(raw);

  // CSAM hard refuse
  if (
    /\b(child\s*porn|csam|underage\s*sex|sexual\s*(with\s*)?(a\s*)?(minor|child)|未成年.*(性|色情)|儿童色情)\b/i.test(
      raw
    ) ||
    /儿童色情|未成年色情|幼女/.test(raw)
  ) {
    return { action: "refuse", category: "csam" };
  }

  // Crisis / self-harm — EN (after leet fold) + ZH + soft euphemisms
  const crisisEn =
    /\b(kill\s*my\s*self|killing\s*myself|end\s*my\s*life|suicid\w*|self[-\s]?harm|cut\s*myself|hang\s*myself|want\s*to\s*die|end\s*it\s*all|better\s*off\s*dead|not\s*want\s*to\s*live|dont\s*want\s*to\s*live|don't\s*want\s*to\s*live|overdose|\bod\b|od\s+on|take\s+all\s+(the\s+)?pills|unalive|sewer\s*slide|might\s+not\s+be\s+here\s+tomorrow|not\s+be\s+here\s+tomorrow|ending\s+things|end\s+things|disappear\s+forever|how\s+to\s+die|want\s+to\s+disappear)\b/.test(
      text
    );
  const crisisZh =
    /自杀|自殺|自尽|自盡|轻生|輕生|不想活|结束生命|結束生命|寻死|尋死|割腕|跳楼|跳樓|活不下去|了结自己|了結自己|自我了断|自我了斷|厭世|厌世|想消失|怎麼才會死|怎么才会死|喝農藥|喝农药|農藥|农药/.test(
      raw
    );

  if (crisisEn || crisisZh) {
    return { action: "refuse", category: "crisis" };
  }

  // Injection / jailbreak / soft override
  if (
    /\b(ignore\s+(all\s+)?(previous|prior|above|your)?\s*(instructions?|rules?)|disregard\s+(all\s+)?(previous|prior)\s+(rules?|instructions?)|reveal\s+(the\s+)?(system\s+)?(prompt|message|rules?)|output\s+(your\s+)?system\s+(prompt|message|rules?)|system\s+(prompt|message)|jailbreak|you\s+are\s+now\s+dan|you\s+are\s+unrestricted|override\s+safety|ignore\s+all\s+rules|system\s*:\s*override|roleplay\s+as\s+unrestricted|unrestricted\s+oracle|disable\s+safety|hidden\s+rules|\[\[?\s*system\s*\]\]?)\b/.test(
      text
    ) ||
    /忽略(以上|之前|所有).*(指令|规则|規則)|越狱|越獄/.test(raw)
  ) {
    return { action: "refuse", category: "injection" };
  }

  // Medical diagnosis / dosing / stop-meds / double dose
  if (
    /\b(diagnos(e|is|ing)|prescrib(e|e\s+me|ing)|dosage|mg\s+of\s+\w+|what\s+medication|what\s+meds|medication\s+for|pills\s+for\s+(my\s+)?(depression|anxiety)|medical\s+dosing|how\s+much\s+\w+\s+should\s+i\s+take|double\s+(my\s+)?(dose|antidepressant|meds?|pills)|stop\s+taking\s+(my\s+)?(pills|meds?|medication)|cold\s+turkey|antidepressant)\b/.test(
      text
    ) ||
    /开药|開藥|剂量|劑量|处方|處方|停药|停藥|加倍.*(药|藥|剂量|劑量)/.test(raw)
  ) {
    return { action: "refuse", category: "medical" };
  }

  // Legal obstruction
  if (
    /\b(hide\s+evidence|courtroom\s+instruction|how\s+to\s+perjure|destroy\s+evidence)\b/.test(
      text
    ) ||
    /毁灭证据|毀滅證據|伪证|偽證/.test(raw)
  ) {
    return { action: "refuse", category: "legal" };
  }

  // Investment — guarantees + soft stock-picking asks
  if (
    /\b(guaranteed\s+(ticker|returns?|profit)|buy\s+\w+\s+tomorrow(\s+for)?|stock\s+tips?|10x\s+(stock|return|on)|all[-\s]?in\s+on\s+\w+|which\s+\w+\s+stock|undervalued\s+(this\s+week)?|btc\s+going\s+to\s+the\s+moon|bitcoin\s+to\s+the\s+moon|should\s+i\s+buy\s+(stock|shares|btc|bitcoin|eth))\b/.test(
      text
    ) ||
    /稳赚|穩賺|荐股|薦股|必涨|必漲|哪[支隻只].*股|半導體.*股|半导体.*股/.test(raw)
  ) {
    return { action: "refuse", category: "investment" };
  }

  return { action: "allow" };
}
