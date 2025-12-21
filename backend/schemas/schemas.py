from typing import Any, Literal

from pydantic import BaseModel, Field


class EstatResult(BaseModel):
    """e-Stat検索結果の詳細スキーマ"""
    found: bool = Field(description="e-Statで統計価格が見つかったかどうか")
    stat_price: float | None = Field(None, description="e-Statから取得した平均価格")
    stat_unit: str | None = Field(None, description="統計価格の単位（例: 100g, 1パック）")
    diff: float | None = Field(None, description="支払価格と統計価格の差額")
    rate: float | None = Field(None, description="統計価格に対する乖離率（0.1 = +10%）")
    judgement: Literal["DEAL", "FAIR", "OVERPAY"] = Field(
        description="価格の妥当性判断: DEAL=お得, FAIR=適正, OVERPAY=割高"
    )
    note: str | None = Field(None, description="補足情報やエラー理由")


class ItemResult(BaseModel):
    """解析された各商品のスキーマ"""
    raw_name: str = Field(description="レシートに記載されていた元の名前")
    canonical: str | None = Field(None, description="名寄せ後の標準的な商品名")
    paid_unit_price: float | None = Field(None, description="レシートから抽出した支払単価")
    quantity: float = Field(1.0, description="購入数量")
    estat: EstatResult = Field(description="e-Statとの比較結果の詳細")


class AnalyzeResponse(BaseModel):
    """レシート解析APIのレスポンススキーマ"""
    purchase_date: str = Field(description="レシートから読み取った購入日（YYYY-MM-DD）")
    currency: str = Field("JPY", description="通貨単位")
    items: list[ItemResult] = Field(description="解析された各商品のリスト")
    summary: dict[str, Any] = Field(description="解析結果の全体サマリー（合計差額など）")
    debug: dict[str, Any] = Field(description="デバッグ用の内部情報（OCRテキスト、マッチング候補など）")


class CanonicalResolution(BaseModel):
    """商品名の名寄せ結果スキーマ"""
    canonical: str | None = Field(None, description="解決された標準名称")
    class_id: str | None = Field(None, description="e-StatのカテゴリID")
    class_code: str | None = Field(None, description="e-Statの項目コード")
    candidates_debug: list[dict[str, str | int | list[dict[str, str]]]] = \
        Field(default=[], description="名寄せの際に検討された候補（デバッグ用）")


class Profile(BaseModel):
    """ユーザープロフィール"""
    id: str = Field(description="ユーザーID")
    nickname: str | None = Field(None, description="ニックネーム")


class ProfileUpdate(BaseModel):
    """ユーザープロフィール更新用"""
    nickname: str | None = Field(None, description="ニックネーム（1-50文字）", max_length=50)


class RankingEntry(BaseModel):
    """ランキングエントリのスキーマ"""
    rank: int = Field(description="順位")
    user_id: str = Field(description="ユーザーID")
    nickname: str | None = Field(None, description="ニックネーム")
    total_saved: int = Field(description="純節約額（節約額 - 過払い額）")
    total_overpaid: int = Field(0, description="総過払い額（円）")


class RankingResponse(BaseModel):
    """ランキングAPIのレスポンススキーマ"""
    rankings: list[RankingEntry] = Field(description="ランキング一覧")
    my_rank: int | None = Field(None, description="自分の順位")
    my_nickname: str | None = Field(None, description="自分のニックネーム")
    my_total_saved: int = Field(0, description="自分の純節約額")
    my_total_overpaid: int = Field(0, description="自分の総過払い額")


class GeminiEstatResult(BaseModel):
    """Gemini構造化出力用のe-Stat結果スキーマ"""
    found: bool = Field(description="市場データで価格が見つかったかどうか")
    stat_price: float | None = Field(None, description="市場適正価格")
    stat_unit: str | None = Field(None, description="統計価格の単位")
    diff: float | None = Field(None, description="価格差（市場適正価格 - 支払額）")
    rate: float | None = Field(None, description="倍率（支払額 / 市場適正価格）")
    judgement: Literal["DEAL", "FAIR", "OVERPAY"] = Field(
        description="判定: DEAL=お得, FAIR=適正, OVERPAY=割高"
    )
    note: str | None = Field(None, description="計算の補足説明")


class GeminiItemResult(BaseModel):
    """Gemini構造化出力用の商品スキーマ"""
    raw_name: str = Field(description="レシート記載名")
    canonical: str | None = Field(None, description="市場照合名")
    paid_unit_price: float | None = Field(None, description="支払単価")
    quantity: float | None = Field(None, description="個数")
    estat: GeminiEstatResult = Field(description="市場比較結果")


class GeminiSummary(BaseModel):
    """Gemini構造化出力用のサマリースキーマ"""
    total_payment: float = Field(description="支払総額")
    total_overpaid_amount: float = Field(description="割高支払い総額")
    total_saved_amount: float = Field(description="節約総額")


class GeminiReceiptResponse(BaseModel):
    """Gemini構造化出力用のレスポンススキーマ"""
    purchase_date: str = Field(description="購入日（YYYY-MM-DD）")
    store_name: str | None = Field(None, description="店舗名")
    items: list[GeminiItemResult] = Field(description="商品リスト")
    summary: GeminiSummary = Field(description="サマリー")


class Receipt(BaseModel):
    """レシート履歴"""
    id: str = Field(description="レシートID")
    user_id: str = Field(description="ユーザーID")
    purchase_date: str | None = Field(None, description="購入日")
    store_name: str | None = Field(None, description="店舗名")
    result: dict[str, Any] = Field(description="解析結果JSON")
    created_at: str = Field(description="作成日時")
    updated_at: str = Field(description="更新日時")


class ReceiptCreate(BaseModel):
    """レシート作成用"""
    purchase_date: str | None = Field(None, description="購入日")
    store_name: str | None = Field(None, description="店舗名")
    result: dict[str, Any] = Field(description="解析結果JSON")


class ReceiptUpdate(BaseModel):
    """レシート更新用"""
    result: dict[str, Any] = Field(description="解析結果JSON")
