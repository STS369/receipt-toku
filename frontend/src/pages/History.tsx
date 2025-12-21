// Database-backed history viewer for saved results.
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ItemTable } from "@/components/ItemTable";
import { EditHistoryDialog } from "@/components/EditHistoryDialog";
import {
  getRanking,
  getProfile,
  updateProfile,
  listReceipts,
  deleteReceipt,
  clearReceipts,
  updateReceipt,
} from "@/lib/api";
import type { Receipt, RankingResponse, AnalyzeResponse } from "@/lib/types";
import {
  Trash2,
  Package,
  Trophy,
  Medal,
  Crown,
  Pencil,
  ChevronDown,
  Calendar,
  Check,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function HistoryPage() {
  const [history, setHistory] = useState<Receipt[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [ranking, setRanking] = useState<RankingResponse | null>(null);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Receipt | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);

  const loadHistoryData = async () => {
    try {
      const receipts = await listReceipts();
      setHistory(receipts);
      // 最初のアイテムを開いた状態にする
      if (receipts.length > 0) {
        setOpenIds(new Set([receipts[0].id]));
      }
    } catch (err) {
      console.error("履歴取得エラー:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistoryData();

    getRanking(10)
      .then(setRanking)
      .catch((err) => console.error("ランキング取得エラー:", err))
      .finally(() => setRankingLoading(false));

    getProfile()
      .then((profile) => {
        setNickname(profile.nickname || "");
        setNicknameInput(profile.nickname || "");
      })
      .catch((err) => console.error("プロフィール取得エラー:", err));
  }, []);

  const handleSaveNickname = async () => {
    setNicknameSaving(true);
    try {
      const updated = await updateProfile({ nickname: nicknameInput || null });
      setNickname(updated.nickname || "");
      setIsEditingNickname(false);
      // ランキングを再取得してニックネームを反映
      const newRanking = await getRanking(10);
      setRanking(newRanking);
    } catch (err) {
      console.error("ニックネーム更新エラー:", err);
    } finally {
      setNicknameSaving(false);
    }
  };

  const handleCancelNickname = () => {
    setNicknameInput(nickname);
    setIsEditingNickname(false);
  };

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReceipt(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setOpenIds((prev) => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    } catch (err) {
      console.error("削除エラー:", err);
    }
  };

  const handleClear = async () => {
    try {
      await clearReceipts();
      setHistory([]);
      setOpenIds(new Set());
    } catch (err) {
      console.error("全削除エラー:", err);
    }
  };

  const handleEdit = (item: Receipt) => {
    setEditTarget(item);
    setEditOpen(true);
  };

  const handleSaveEdit = async (data: AnalyzeResponse) => {
    if (!editTarget) return;
    try {
      const updated = await updateReceipt(editTarget.id, { result: data });
      setHistory((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setEditTarget(null);
    } catch (err) {
      console.error("更新エラー:", err);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">履歴 & ランキング</h2>
          <p className="text-sm text-muted-foreground">
            保存した解析結果の確認と編集
          </p>
        </div>
        {history.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            全削除
          </Button>
        )}
      </div>

      {/* Content: 2-column layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Ranking Panel */}
        <Card className="w-64 flex-shrink-0 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              節約ランキング
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-2 min-h-0">
            {rankingLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">読み込み中...</p>
              </div>
            ) : ranking ? (
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-2">
                  {ranking.my_rank && (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 mb-3">
                      <div className="text-xs text-muted-foreground mb-1">
                        あなたの順位
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          {ranking.my_rank}位
                        </span>
                        <span className={cn(
                          "text-sm font-medium",
                          ranking.my_total_saved >= 0 ? "text-green-600" : "text-red-500"
                        )}>
                          ¥{ranking.my_total_saved.toLocaleString()}
                        </span>
                      </div>
                      {/* ニックネーム編集 */}
                      <div className="mt-2 pt-2 border-t border-primary/20">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {isEditingNickname ? (
                            <div className="flex items-center gap-1 flex-1">
                              <Input
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                placeholder="ニックネーム"
                                className="h-6 text-xs"
                                maxLength={50}
                                disabled={nicknameSaving}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleSaveNickname}
                                disabled={nicknameSaving}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleCancelNickname}
                                disabled={nicknameSaving}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 flex-1">
                              <span className="text-xs truncate">
                                {nickname || "未設定"}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => setIsEditingNickname(true)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {ranking.rankings.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={cn(
                        "p-2 rounded-lg flex items-center gap-2 transition-all",
                        entry.rank <= 3 ? "bg-muted/50" : "bg-card"
                      )}
                    >
                      <div className="w-8 flex justify-center">
                        {entry.rank === 1 ? (
                          <Crown className="h-5 w-5 text-yellow-500" />
                        ) : entry.rank === 2 ? (
                          <Medal className="h-5 w-5 text-gray-400" />
                        ) : entry.rank === 3 ? (
                          <Medal className="h-5 w-5 text-amber-600" />
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">
                            {entry.rank}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate text-muted-foreground">
                          {entry.nickname || `User ${entry.user_id.slice(0, 8)}...`}
                        </div>
                        <div className={cn(
                          "text-sm font-medium",
                          entry.total_saved >= 0 ? "text-green-600" : "text-red-500"
                        )}>
                          ¥{entry.total_saved.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}

                  {ranking.rankings.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      まだランキングデータがありません
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">ランキングを取得できませんでした</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Area - Collapsible History */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              履歴 ({history.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-2 min-h-0 overflow-hidden">
            {historyLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">読み込み中...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">履歴がありません</p>
                  <p className="text-sm">
                    レシートを解析して保存するとここに表示されます
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-2">
                  {history.map((item) => {
                    const isOpen = openIds.has(item.id);
                    const dealCount = item.result.items.filter(
                      (i) => i.estat?.judgement === "DEAL"
                    ).length;
                    const overpayCount = item.result.items.filter(
                      (i) => i.estat?.judgement === "OVERPAY"
                    ).length;
                    const unknownCount = item.result.items.filter(
                      (i) =>
                        !i.estat?.judgement || i.estat?.judgement === "UNKNOWN"
                    ).length;

                    return (
                      <Collapsible
                        key={item.id}
                        open={isOpen}
                        onOpenChange={() => toggleOpen(item.id)}
                      >
                        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                          {/* Header */}
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-3">
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform",
                                    isOpen && "rotate-180"
                                  )}
                                />
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {item.result.purchase_date || "日付不明"}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {item.result.items.length}品目
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-3 text-xs mr-2">
                                  <span className="text-green-500">
                                    DEAL: {dealCount}
                                  </span>
                                  <span className="text-red-500">
                                    OVERPAY: {overpayCount}
                                  </span>
                                  <span className="text-yellow-500">
                                    UNKNOWN: {unknownCount}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(item);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-400 hover:text-red-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          {/* Content */}
                          <CollapsibleContent>
                            <div className="border-t border-white/10 p-3">
                              <ItemTable items={item.result.items} />
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      {editTarget && (
        <EditHistoryDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditTarget(null);
          }}
          data={editTarget.result}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
