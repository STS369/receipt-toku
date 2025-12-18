import google.generativeai as genai
import os
from dotenv import load_dotenv

# .envファイルを読み込む
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("エラー: .env ファイルに GEMINI_API_KEY が見つかりません。")
else:
    # IPv4強制パッチ (念のため)
    import socket
    def _ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
        if family == socket.AF_UNSPEC:
            family = socket.AF_INET
        return socket.getaddrinfo(host, port, family, type, proto, flags)
    socket.getaddrinfo = _ipv4_getaddrinfo

    print(f"APIキー: {api_key[:5]}... (読み込み成功)")
    print("利用可能なモデルを問い合わせ中...")
    
    genai.configure(api_key=api_key)
    
    try:
        found_any = False
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
                found_any = True
        
        if not found_any:
            print("利用可能なモデルが見つかりませんでした。")
            
    except Exception as e:
        print(f"エラーが発生しました: {e}")
