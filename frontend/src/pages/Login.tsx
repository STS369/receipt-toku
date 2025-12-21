import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/components/auth-provider";
import { Receipt } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setError(null);
        alert("確認メールを送信しました。メールを確認してください。");
      } else {
        await signIn(email, password);
        navigate("/");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "認証に失敗しました";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Receipt className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>{isSignUp ? "アカウント作成" : "ログイン"}</CardTitle>
          <CardDescription>
            {isSignUp
              ? "新しいアカウントを作成してください"
              : "Receipt Deal Checker にログイン"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "処理中..." : isSignUp ? "アカウント作成" : "ログイン"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isSignUp ? (
              <p>
                すでにアカウントをお持ちですか？{" "}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => setIsSignUp(false)}
                >
                  ログイン
                </button>
              </p>
            ) : (
              <p>
                アカウントをお持ちでないですか？{" "}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => setIsSignUp(true)}
                >
                  新規登録
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
