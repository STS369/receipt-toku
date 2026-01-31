# receipt-toku（Hackathon）

## 何を作ったか（1分でわかる概要）
レシート写真を読み取り、購入品目の価格と政府統計の平均小売価格を比較して「どれくらいお得に買えたか」を可視化するWebアプリ。

### 処理の流れ
1. レシート画像を Google Gemini API でOCR/解析し、品目リストを抽出
2. e-Stat（政府統計API）から該当商品の平均小売価格を取得
3. 平均価格 vs 実価格 を比較し、お得度を算出して可視化（色分け・フィードバック）
4. （追加）ランキング機能、商品名正規化、Supabaseによるリアルタイム保存

## 技術スタック（担当範囲中心）
- Frontend: TypeScript（Web UI）
- Backend: Python / FastAPI
- 外部API: Google Gemini API（レシート解析）, e-Stat API（統計小売価格）
- その他: Supabase（保存・同期）, Docker（開発環境）

※リポジトリは `frontend/ backend/ docker/ supabase/` の分離構成。:contentReference[oaicite:1]{index=1}

## 自分が担当したこと（STS369）
- Frontendの骨組み作成（画面・状態管理の土台）
- e-Stat API 連携の導入（平均小売価格の取得）
- 正規化処理（商品名・単位の揺れを吸収する仕組み）の導入

## 工夫した点（面談で話す用）
### 単位の不一致（個数/重量など）で計算が崩れる問題への対処
- 課題: レシート側の単位（例: 1本/1袋）と、政府統計側の単位（例: 100gあたり/1kgあたり 等）が一致せず、比較計算に支障が出た
- 対応: 「単位を揃える」ことを必須要件にして、AI生成の正規化関数をプロダクトに組み込み
- 効果: 価格比較の前処理が安定し、e-Statデータと突合しやすくなった（= お得度算出の精度が上がる）

## ローカル実行（最小）
### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Slides
- [発表スライド（pptx）](https://docs.google.com/presentation/d/13wWwmAk005pKA2ThkCcgwbw-zSQN1nUybaQ9RU9Xd2s/edit?usp=sharing)

