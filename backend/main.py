import asyncio
from typing import Any

from config import settings
from db import CurrentUser, supabase
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from model import analyze_receipt_with_market_data
from schema import (
    EStatClient,
    Profile,
    ProfileUpdate,
    RankingEntry,
    RankingResponse,
    Receipt,
    ReceiptCreate,
    ReceiptUpdate,
)

app = FastAPI(title="Receipt AI Analyzer", version="2.0-advanced")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

estat_client = EStatClient()


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "vision_model": settings.GEMINI_MODEL,
        "estat_app_id_set": bool(settings.APP_ID),
    }


@app.post("/analyzeReceipt")
async def analyze_receipt(
    user: CurrentUser,
    file: UploadFile = File(...)
):
    """
    レシート画像をAIで高度分析します。
    1. 市場価格の最新コンテキストを準備（モックまたはAPI取得）
    2. 画像と市場価格をGeminiに送信
    3. AIによる正規化・比較結果を返却
    """
    file_bytes = await file.read()
    # 実際にはここでも非同期で e-Stat を叩いて市場価格を集めることができます
    # 今回は高度なプロンプトの威力を試すため、代表的な市場価格をコンテキストとして定義
    market_data: list[dict[str, str | int]] = [
        {"item_name": "たまねぎ", "price": 418, "unit": "kg"},
        {"item_name": "にんじん", "price": 350, "unit": "kg"},
        {"item_name": "鶏卵", "price": 280, "unit": "パック(10個)"},
        {"item_name": "牛乳", "price": 250, "unit": "本(1000ml)"},
        {"item_name": "食パン", "price": 180, "unit": "袋"},
        {"item_name": "米", "price": 2500, "unit": "5kg"}
    ]

    # Gemini による高度な画像解析を実行（プログラミングによる計算ではなく、AIの推論に任せる）
    # ※ LLM呼び出しは時間がかかるため、スレッドプールで実行
    try:
        logger.info("Starting AI analysis with market data...")
        async with asyncio.TaskGroup() as tg:
            logger.info("Creating task for analyze_receipt_with_market_data...")
            task = tg.create_task(analyze_receipt_with_market_data(file_bytes, market_data))
            logger.info("Task created, awaiting result...")

        analysis_result = task.result()
        logger.info("AI analysis task completed.")

        # 解析成功後、節約額をSupabaseに保存
        try:
            summary = analysis_result.get("summary", {})
            supabase.table("savings_records").insert({
                "user_id": user["id"],
                "purchase_date": analysis_result.get("purchase_date", "1970-01-01"),
                "store_name": analysis_result.get("store_name"),
                "total_saved_amount": int(summary.get("total_saved_amount", 0)),
                "total_overpaid_amount": int(summary.get("total_overpaid_amount", 0)),
                "item_count": len(analysis_result.get("items", []))
            }).execute()
            logger.info(f"Savings record saved for user {user['id']}")
        except Exception as save_error:
            logger.warning(f"Failed to save savings record: {save_error}")

        return analysis_result

    except* Exception as eg:
        for e in eg.exceptions:
            print(f"Error during AI analysis: {str(e)}")


@app.get("/profile", response_model=Profile)
async def get_profile(user: CurrentUser) -> Profile:
    """自分のプロフィールを取得します。"""
    result = supabase.table("profiles").select("id, nickname").eq("id", user["id"]).execute()
    if result.data and len(result.data) > 0:
        record = result.data[0]
        if isinstance(record, dict):
            nickname_val = record.get("nickname")
            nickname = str(nickname_val) if nickname_val is not None else None
            return Profile(id=str(record.get("id", "")), nickname=nickname)
    # プロフィールが存在しない場合は作成
    supabase.table("profiles").insert({"id": user["id"]}).execute()
    return Profile(id=user["id"], nickname=None)


@app.put("/profile", response_model=Profile)
async def update_profile(user: CurrentUser, data: ProfileUpdate) -> Profile:
    """自分のプロフィールを更新します。"""
    result = supabase.table("profiles").upsert({
        "id": user["id"],
        "nickname": data.nickname
    }).execute()
    if result.data and len(result.data) > 0:
        record = result.data[0]
        if isinstance(record, dict):
            nickname_val = record.get("nickname")
            nickname = str(nickname_val) if nickname_val is not None else None
            return Profile(id=str(record.get("id", "")), nickname=nickname)
    return Profile(id=user["id"], nickname=data.nickname)


@app.get("/ranking", response_model=RankingResponse)
async def get_ranking(user: CurrentUser, limit: int = 10) -> RankingResponse:
    """
    純節約額ランキングを取得します。
    純節約額 = 節約額 - 過払い額 でユーザーを順位付けし、上位N名と自分の順位を返します。
    """
    # ユーザーごとの節約額・過払い額を集計してランキング取得
    # Supabaseでは直接GROUP BYができないため、全データ取得後にPythonで集計
    result = supabase.table("savings_records").select(
        "user_id, total_saved_amount, total_overpaid_amount"
    ).execute()

    # 全ユーザーのニックネームを取得
    profiles_result = supabase.table("profiles").select("id, nickname").execute()
    user_nicknames: dict[str, str | None] = {}
    for profile in profiles_result.data:
        if profile and isinstance(profile, dict):
            uid = str(profile.get("id", ""))
            nickname_val = profile.get("nickname")
            user_nicknames[uid] = str(nickname_val) if nickname_val else None

    # ユーザーごとに集計（純節約額と過払い額を別々に追跡）
    user_net_saved: dict[str, int] = {}
    user_overpaid: dict[str, int] = {}
    for record in result.data:
        if not record or not isinstance(record, dict):
            continue
        uid = str(record.get("user_id", ""))
        saved_value = record.get("total_saved_amount", 0)
        overpaid_value = record.get("total_overpaid_amount", 0)
        saved = int(saved_value) if isinstance(saved_value, (int, float, str)) else 0
        overpaid = int(overpaid_value) if isinstance(overpaid_value, (int, float, str)) else 0
        # 純節約額 = 節約額 - 過払い額
        net_saved = saved - overpaid
        user_net_saved[uid] = user_net_saved.get(uid, 0) + net_saved
        user_overpaid[uid] = user_overpaid.get(uid, 0) + overpaid

    # 純節約額で降順ソート
    sorted_users = sorted(user_net_saved.items(), key=lambda x: x[1], reverse=True)

    # ランキング作成
    rankings: list[RankingEntry] = []
    my_rank: int | None = None
    my_nickname: str | None = None
    my_total_saved = 0
    my_total_overpaid = 0

    for i, (uid, net_total) in enumerate(sorted_users):
        rank = i + 1
        overpaid_total = user_overpaid.get(uid, 0)
        nickname = user_nicknames.get(uid)
        if uid == user["id"]:
            my_rank = rank
            my_nickname = nickname
            my_total_saved = net_total
            my_total_overpaid = overpaid_total

        if rank <= limit:
            rankings.append(RankingEntry(
                rank=rank,
                user_id=uid,
                nickname=nickname,
                total_saved=net_total,
                total_overpaid=overpaid_total
            ))

    return RankingResponse(
        rankings=rankings,
        my_rank=my_rank,
        my_nickname=my_nickname,
        my_total_saved=my_total_saved,
        my_total_overpaid=my_total_overpaid
    )


# =================================================================
# レシート履歴 CRUD
# =================================================================


@app.get("/receipts", response_model=list[Receipt])
async def list_receipts(user: CurrentUser) -> list[Receipt]:
    """自分のレシート履歴を取得します。"""
    result = supabase.table("receipts").select("*").eq(
        "user_id", user["id"]
    ).order("created_at", desc=True).execute()

    receipts: list[Receipt] = []
    for record in result.data:
        if not record or not isinstance(record, dict):
            continue
        result_data = record.get("result")
        if not isinstance(result_data, dict):
            result_data = {}
        receipts.append(Receipt(
            id=str(record.get("id", "")),
            user_id=str(record.get("user_id", "")),
            purchase_date=str(record.get("purchase_date")) if record.get("purchase_date") else None,
            store_name=str(record.get("store_name")) if record.get("store_name") else None,
            result=result_data,
            created_at=str(record.get("created_at", "")),
            updated_at=str(record.get("updated_at", ""))
        ))
    return receipts


@app.post("/receipts", response_model=Receipt)
async def create_receipt(user: CurrentUser, data: ReceiptCreate) -> Receipt:
    """レシートを保存します。"""
    result = supabase.table("receipts").insert({
        "user_id": user["id"],
        "purchase_date": data.purchase_date,
        "store_name": data.store_name,
        "result": data.result
    }).execute()

    if result.data and len(result.data) > 0:
        record = result.data[0]
        if isinstance(record, dict):
            result_data = record.get("result")
            if not isinstance(result_data, dict):
                result_data = {}
            return Receipt(
                id=str(record.get("id", "")),
                user_id=str(record.get("user_id", "")),
                purchase_date=str(record.get("purchase_date")) if record.get("purchase_date") else None,
                store_name=str(record.get("store_name")) if record.get("store_name") else None,
                result=result_data,
                created_at=str(record.get("created_at", "")),
                updated_at=str(record.get("updated_at", ""))
            )
    raise Exception("Failed to create receipt")


@app.put("/receipts/{receipt_id}", response_model=Receipt)
async def update_receipt(user: CurrentUser, receipt_id: str, data: ReceiptUpdate) -> Receipt:
    """レシートを更新します。"""
    result = supabase.table("receipts").update({
        "result": data.result
    }).eq("id", receipt_id).eq("user_id", user["id"]).execute()

    if result.data and len(result.data) > 0:
        record = result.data[0]
        if isinstance(record, dict):
            result_data = record.get("result")
            if not isinstance(result_data, dict):
                result_data = {}
            return Receipt(
                id=str(record.get("id", "")),
                user_id=str(record.get("user_id", "")),
                purchase_date=str(record.get("purchase_date")) if record.get("purchase_date") else None,
                store_name=str(record.get("store_name")) if record.get("store_name") else None,
                result=result_data,
                created_at=str(record.get("created_at", "")),
                updated_at=str(record.get("updated_at", ""))
            )
    raise Exception("Receipt not found or not authorized")


@app.delete("/receipts/{receipt_id}")
async def delete_receipt(user: CurrentUser, receipt_id: str) -> dict[str, bool]:
    """レシートを削除します。"""
    supabase.table("receipts").delete().eq(
        "id", receipt_id
    ).eq("user_id", user["id"]).execute()
    return {"success": True}


@app.delete("/receipts")
async def clear_receipts(user: CurrentUser) -> dict[str, bool]:
    """自分のレシートを全削除します。"""
    supabase.table("receipts").delete().eq("user_id", user["id"]).execute()
    return {"success": True}
