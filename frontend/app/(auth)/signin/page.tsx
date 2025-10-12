"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Login failed");

      toast.success("Signed in successfully");
      router.push("/chat");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <img src="/simplyphiLogo.png" alt="SimplyPhi" className="w-6 h-6" />
          <span className="text-sm font-medium opacity-90">SimplyPhi</span>
        </div>
        <CardTitle>Welcome back</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full cursor-pointer">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-xs opacity-75 text-center">
            No account?{" "}
            <Link href="/signup" className="underline">
              Create one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
