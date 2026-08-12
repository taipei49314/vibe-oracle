# 中文社群帖（可直接貼 Threads / X / 噗浪 / 小紅書長文）

## 短版（X / Threads）

```
大多數 AI「人生神諭」只有兩條路：
1）假裝科學（信心分數、假 evidence）
2）空泛雞湯

VibeOracle 走第三條：承認自己是劇場，然後還是給你一張牌。

一句 mood → 三張儀式牌 → 本地 thin engines（日種子／星期／卦象／月相）→ 原型人格 + 本週三動作 + taboo + 分享圖

沒 API key 也能完整 demo（會標 mode: demo，不裝 live）

https://github.com/taipei49314/vibe-oracle

15 秒預告：https://github.com/taipei49314/vibe-oracle/raw/master/docs/assets/demo-15s.mp4

#開源 #LLM #localfirst
```

## 長版（心得／專案介紹）

```
做 VibeOracle 的起點很單純：

AI 算命／人生教練類產品，通常不誠實。
要嘛把 confidence 包裝成準確率，要嘛空洞到沒有任何儀式感。

我想要的是第三條路：
「純 vibe，不裝 evidence」——信心分數是 theatrical（劇場感），不是準度。

技術上也故意反著做：
- 先抽牌、跑本地 thin engines 蓋 facts（不連網）
- 再交給 LLM 敘事；沒 key 就走完整 demo，但 mode 寫清楚
- 有害主題 soft refuse、限流、canary，不是裸奔 chat

如果你也厭倦「AI 假裝很確定」的產品，歡迎 star / fork / 噴：

https://github.com/taipei49314/vibe-oracle

npm i && npm run dev 就能玩。
```

## 建議標籤

`#開源` `#TypeScript` `#LLM` `#xAI` `#儀式` `#側專`
