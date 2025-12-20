// Vite configuration for the React frontend.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // バックエンドが別ポートの場合の例 (必要ならコメントアウトを外す)
    // proxy: {
    //   "/health": "http://localhost:8000",
    //   "/metaSearch": "http://localhost:8000",
    //   "/analyzeReceipt": "http://localhost:8000"
    // }
  }
});
