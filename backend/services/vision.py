import io
import logging
import json
from typing import Any
from PIL import Image
from fastapi import HTTPException
from loguru import logger

from model.genai import client
from model.prompt import SYSTEM_INSTRUCTION
from config import settings

# =================================================================
# Gemini 高度分析プロンプト定義
# =================================================================


async def analyze_receipt_with_market_data(
        file_bytes: bytes,
        market_data: list[dict[str, str | int]]
) -> dict[str, Any]:
    """最新の google-genai SDK を使用して詳細なAI分析を実行します。"""
    if not settings.GEMINI_API_KEY:
        logger.error("Gemini APIキーが設定されていません。")
        raise HTTPException(status_code=500, detail="Gemini APIキーが設定されていません。")

    try:
        # プロンプトの組み立て
        logger.info("Preparing prompt for Gemini analysis...")
        market_data_json = json.dumps(market_data, ensure_ascii=False, indent=2)
        full_prompt = SYSTEM_INSTRUCTION.replace("{{MARKET_DATA_JSON}}", market_data_json)
        # 画像の読み込み

        logger.info("Loading image for Gemini analysis...")
        img = Image.open(io.BytesIO(file_bytes))
        logger.info("Image loaded successfully.")

        # 最新のモデル実行方法
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[full_prompt, img]
        )
        logger.info("Gemini analysis completed.")
        if not response.text:
            logger.error("Gemini APIから有効な応答がありませんでした。")
            raise HTTPException(status_code=500, detail="Gemini APIから有効な応答がありませんでした。")

        # JSONの抽出
        text = response.text.strip()
        logger.info(f"Raw Gemini response text: {text}")
        # Markdownコードブロックが含まれている場合の対策
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)

    except Exception as e:
        logging.error(f"Gemini Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI分析中にエラーが発生しました: {str(e)}")


# 互換性のための関数
def get_model_name() -> list[str]:
    return [settings.GEMINI_MODEL]


def extract_text_from_image(file_bytes: bytes) -> str:
    return "This function is deprecated. Use analyze_receipt_with_market_data instead."
