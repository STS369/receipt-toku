ITEM_RULES: list[dict[str, str | list[str]]] = [
    {"canonical": "牛乳", "keywords": ["牛乳", "ミルク", "MILK"]},
    {"canonical": "食パン", "keywords": ["食パン", "食ﾊﾟﾝ"]},
    {"canonical": "鶏卵", "keywords": ["鶏卵", "卵", "たまご", "玉子", "EGG", "タマゴ"]},
    {"canonical": "米", "keywords": ["米", "コメ", "こしひかり", "あきたこまち"]},
    {"canonical": "バナナ", "keywords": ["バナナ", "BANANA"]},
    {"canonical": "キャベツ", "keywords": ["キャベツ"]},
    {"canonical": "たまねぎ", "keywords": ["たまねぎ", "玉ねぎ", "オニオン"]},
    {"canonical": "じゃがいも", "keywords": ["じゃがいも", "ジャガ", "ポテト"]},
    {"canonical": "トマト", "keywords": ["トマト"]},
    {"canonical": "りんご", "keywords": ["リンゴ", "林檎", "APPLE"]},
    {"canonical": "アイスクリーム", "keywords": ["アイス", "アイスクリーム", "ICE"]},
    {
        "canonical": "即席めん",
        "keywords": ["即席", "インスタント", "カップ麺", "カップラーメン", "カップうどん", "カップそば", "袋麺"],
        "patterns": [
            r"(カップ|即席|インスタント)\s*(ラーメン|らーめん|うどん|そば|焼そば|焼きそば)",
            r"(ラーメン|らーめん|うどん|そば|焼そば|焼きそば)\s*(カップ|即席|インスタント)",
        ],
    },
    {
        "canonical": "さば缶詰",
        "keywords": ["サバ水煮", "さば水煮", "鯖水煮", "サバミズニ", "さば缶", "サバ缶"],
        "patterns": [
            r"(サバ|さば|鯖).*(水煮|みずに|ミズニ|味噌煮|みそ煮).*(缶|CAN|\d+\s*[Gg])?",
        ],
    },
    {"canonical": "ティッシュ", "keywords": ["ティッシュ", "ﾃｨｯｼｭ", "TISSUE"]},
    {"canonical": "トイレットペーパー", "keywords": ["トイレット", "ﾄｲﾚｯﾄ", "ペーパー", "TP"]},
]

ESTAT_NAME_HINTS: dict[str, list[str]] = {
    "食パン": ["食パン"],
    "鶏卵": ["鶏卵", "卵"],
}

UNKNOWN_RESCUE_NORMALIZE_MAP: dict[str, str] = {
    "タマゴ": "鶏卵",
    "たまご": "鶏卵",
    "玉子": "鶏卵",
    "卵": "鶏卵",
}

UNKNOWN_RESCUE_CANDIDATE_RULES: list[dict[str, str | list[str]]] = [
    {
        "id": "canned_foods",
        "match_any": ["缶詰", "CAN"],
        "match_patterns": [r"缶$"],
        "candidates": ["さば水煮", "魚介缶詰", "さば缶", "まぐろ缶", "つな缶", "魚介加工品", "加工食品"],
    },
    {
        "id": "kitsune_udon",
        "match_any": ["きつねうどん"],
        "candidates": ["うどん", "めん類", "即席めん", "ゆでうどん", "調理麺"],
    },
    {
        "id": "udon",
        "match_all": ["うどん", "きつね"],
        "candidates": ["うどん", "めん類", "即席めん", "ゆでうどん", "調理麺"],
    },
]

# e-Stat APIで品目を探す際のカテゴリIDの優先順位
# cat01: 品目分類（食パン、卵など）
# cat02/cat03: 規格・詳細分類
# tab: 表章項目（統計表の区分）
CLASS_SEARCH_ORDER = ["cat01", "cat02", "cat03", "tab"]

# 支払い系除外ワード
EXCLUDE_WORDS = [
    "合計", "小計", "消費税", "内税", "外税",
    "お預り", "預り", "お預かり",
    "お釣り", "釣り", "釣",
    "レジ", "TEL",
]
