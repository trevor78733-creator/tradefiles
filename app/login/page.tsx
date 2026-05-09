import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default async function LoginPage(props: PageProps<"/login">) {
  const search = await props.searchParams;
  const error = typeof search.error === "string" ? search.error : undefined;
  const next = typeof search.next === "string" ? search.next : "/";

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Logo />
          <CardDescription>Enter your password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="post" action="/api/auth" className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
              />
              {error && (
                <p className="text-sm text-destructive">Incorrect password.</p>
              )}
            </div>
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
