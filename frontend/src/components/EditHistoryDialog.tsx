import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AnalyzeResponse, ItemResult } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AnalyzeResponse;
  onSave: (data: AnalyzeResponse) => void;
};

export function EditHistoryDialog({ open, onOpenChange, data, onSave }: Props) {
  const [purchaseDate, setPurchaseDate] = useState(data.purchase_date || "");
  const [items, setItems] = useState<ItemResult[]>(data.items);

  const handleItemChange = (
    index: number,
    field: keyof ItemResult,
    value: string | number | null
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { raw_name: "", paid_unit_price: null, quantity: 1 },
    ]);
  };

  const handleSave = () => {
    onSave({
      ...data,
      purchase_date: purchaseDate,
      items,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>履歴を編集</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="purchase_date">購入日</Label>
            <Input
              id="purchase_date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>商品一覧</Label>
              <Button variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                追加
              </Button>
            </div>

            <ScrollArea className="h-[300px] rounded-md border border-white/10 p-2">
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_100px_80px_40px] gap-2 items-center p-2 rounded-lg bg-white/5"
                  >
                    <Input
                      placeholder="商品名"
                      value={item.raw_name}
                      onChange={(e) =>
                        handleItemChange(index, "raw_name", e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      placeholder="単価"
                      value={item.paid_unit_price ?? ""}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "paid_unit_price",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    />
                    <Input
                      type="number"
                      placeholder="数量"
                      value={item.quantity ?? 1}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          e.target.value ? Number(e.target.value) : 1
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    商品がありません
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
