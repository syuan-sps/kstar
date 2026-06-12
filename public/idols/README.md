# 偶像照片放置指南

把照片存成 `public/idols/<artist-id>.jpg`（也接受 .jpeg/.png/.webp），然後執行：

```bash
node scripts/sync-idol-photos.mjs
```

腳本會自動把照片連到 catalog；沒照片的偶像維持漸層首字卡。每位偶像的 `image_focus`（0~1，臉的垂直位置，預設 0.3）可在 `src/data/catalog.json` 微調 — 重跑腳本不會覆蓋你調過的值。

## 選照片守則
- **一年內的照片**（2025年6月之後拍攝/發布）— 在 Commons 檔案頁確認拍攝日期；MediaSearch 可在左側篩選日期。太舊的照片寧可先留漸層卡。
- **來源順位**：① Wikimedia Commons CC 授權照（最安全，記下作者+授權）② 經紀公司官方宣傳照。**絕不用**粉絲拍攝或有浮水印的照片。
- 一年內的 CC 照最可能出現在：2025–2026 時裝週/首映會/記者會的紅毯照、頒獎典禮報導照。Commons 找不到近照時，官方近期宣傳照（回歸概念照、品牌活動官方照）是更好的退路。
- 直式人像優先，臉在畫面上半部，寬度 ≥600px。
- 照片風格盡量貼合該偶像的氣質（例：V 選復古紳士感、Karina 選未來高級感）。

## 44 位偶像檔名對照 + Commons 搜尋連結

| 檔名 (artist-id) | 偶像 | Wikimedia Commons 搜尋 |
|---|---|---|
| karina.jpg | Karina (aespa) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Karina+aespa&title=Special:MediaSearch&type=image) |
| winter.jpg | Winter (aespa) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Winter+aespa&title=Special:MediaSearch&type=image) |
| ningning.jpg | Ningning (aespa) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Ningning+aespa&title=Special:MediaSearch&type=image) |
| minji.jpg | Minji (NewJeans) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Minji+NewJeans&title=Special:MediaSearch&type=image) |
| hanni.jpg | Hanni (NewJeans) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Hanni+NewJeans&title=Special:MediaSearch&type=image) |
| haerin.jpg | Haerin (NewJeans) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Haerin+NewJeans&title=Special:MediaSearch&type=image) |
| wonyoung.jpg | 張員瑛 (IVE) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Jang+Won-young&title=Special:MediaSearch&type=image) |
| an-yujin.jpg | 安俞真 (IVE) | [搜尋](https://commons.wikimedia.org/w/index.php?search=An+Yu-jin&title=Special:MediaSearch&type=image) |
| jennie.jpg | Jennie (BLACKPINK) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Jennie+Kim+BLACKPINK&title=Special:MediaSearch&type=image) |
| jisoo.jpg | Jisoo (BLACKPINK) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Jisoo+BLACKPINK&title=Special:MediaSearch&type=image) |
| lisa.jpg | Lisa (BLACKPINK) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Lisa+BLACKPINK&title=Special:MediaSearch&type=image) |
| rose.jpg | Rosé (BLACKPINK) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Rose+BLACKPINK+singer&title=Special:MediaSearch&type=image) |
| jungkook.jpg | Jungkook (BTS) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Jungkook&title=Special:MediaSearch&type=image) |
| bts-v.jpg | V／金泰亨 (BTS) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Kim+Tae-hyung+V+BTS&title=Special:MediaSearch&type=image) |
| jimin.jpg | Jimin (BTS) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Park+Ji-min+BTS&title=Special:MediaSearch&type=image) |
| rm.jpg | RM (BTS) | [搜尋](https://commons.wikimedia.org/w/index.php?search=RM+BTS+Kim+Nam-joon&title=Special:MediaSearch&type=image) |
| jin.jpg | Jin (BTS) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Jin+BTS+Kim+Seok-jin&title=Special:MediaSearch&type=image) |
| j-hope.jpg | J-Hope (BTS) | [搜尋](https://commons.wikimedia.org/w/index.php?search=J-Hope+BTS&title=Special:MediaSearch&type=image) |
| nayeon.jpg | 娜璉 (TWICE) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Im+Na-yeon+TWICE&title=Special:MediaSearch&type=image) |
| sana.jpg | Sana (TWICE) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Sana+TWICE+Minatozaki&title=Special:MediaSearch&type=image) |
| momo.jpg | Momo (TWICE) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Momo+TWICE+Hirai&title=Special:MediaSearch&type=image) |
| tzuyu.jpg | 周子瑜 (TWICE) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Chou+Tzu-yu&title=Special:MediaSearch&type=image) |
| hyunjin.jpg | Hyunjin (Stray Kids) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Hyunjin+Stray+Kids&title=Special:MediaSearch&type=image) |
| felix.jpg | Felix (Stray Kids) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Felix+Stray+Kids&title=Special:MediaSearch&type=image) |
| bang-chan.jpg | Bang Chan (Stray Kids) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Bang+Chan+Stray+Kids&title=Special:MediaSearch&type=image) |
| sakura.jpg | 宮脇咲良 (LE SSERAFIM) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Miyawaki+Sakura&title=Special:MediaSearch&type=image) |
| kim-chaewon.jpg | 金采源 (LE SSERAFIM) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Kim+Chae-won+LE+SSERAFIM&title=Special:MediaSearch&type=image) |
| soyeon.jpg | 田小娟 ((G)I-DLE) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Jeon+So-yeon&title=Special:MediaSearch&type=image) |
| jeonghan.jpg | 淨漢 (SEVENTEEN) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Yoon+Jeong-han+Seventeen&title=Special:MediaSearch&type=image) |
| hoshi.jpg | Hoshi (SEVENTEEN) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Hoshi+Seventeen+Kwon&title=Special:MediaSearch&type=image) |
| yeonjun.jpg | 演俊 (TXT) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Choi+Yeon-jun+TXT&title=Special:MediaSearch&type=image) |
| soobin.jpg | 秀彬 (TXT) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Choi+Soo-bin+TXT&title=Special:MediaSearch&type=image) |
| taeyeon.jpg | 太妍 | [搜尋](https://commons.wikimedia.org/w/index.php?search=Taeyeon&title=Special:MediaSearch&type=image) |
| iu.jpg | IU | [搜尋](https://commons.wikimedia.org/w/index.php?search=IU+singer+Lee+Ji-eun&title=Special:MediaSearch&type=image) |
| yeji.jpg | 禮志 (ITZY) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Hwang+Ye-ji+ITZY&title=Special:MediaSearch&type=image) |
| ahyeon.jpg | 雅賢 (BABYMONSTER) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Ahyeon+Babymonster&title=Special:MediaSearch&type=image) |
| seulgi.jpg | 瑟琪 (Red Velvet) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Kang+Seul-gi&title=Special:MediaSearch&type=image) |
| sullyoon.jpg | 雪倫 (NMIXX) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Sullyoon+NMIXX&title=Special:MediaSearch&type=image) |
| natty.jpg | Natty (KISS OF LIFE) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Natty+Kiss+of+Life&title=Special:MediaSearch&type=image) |
| niki.jpg | Ni-ki (ENHYPEN) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Ni-ki+Enhypen&title=Special:MediaSearch&type=image) |
| wonbin.jpg | 元彬 (RIIZE) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Park+Won-bin+RIIZE&title=Special:MediaSearch&type=image) |
| sung-hanbin.jpg | 成韓彬 (ZB1) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Sung+Han-bin+Zerobaseone&title=Special:MediaSearch&type=image) |
| san.jpg | San (ATEEZ) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Choi+San+Ateez&title=Special:MediaSearch&type=image) |
| mark.jpg | Mark (NCT) | [搜尋](https://commons.wikimedia.org/w/index.php?search=Mark+Lee+NCT&title=Special:MediaSearch&type=image) |

> 註：BTS/BLACKPINK/TWICE/IU 在 Commons 照片很多（紅毯、記者會、KOCIS 官方釋出）；
> 第五代新人（Ahyeon、Sullyoon、Natty、ZB1 等）可能找不到 CC 照 → 退而求官方宣傳照，或先留漸層卡。

## 授權紀錄（CC BY 需要署名 — 下載時順手填）

完整授權紀錄（來源頁、作者、授權、日期）由抓圖腳本自動寫入 **`attribution.json`**（同資料夾）。
手動換照片時請順手更新該檔對應條目。
