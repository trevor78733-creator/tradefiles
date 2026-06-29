import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { signIn } from "@/auth";

export default async function LoginPage(props: PageProps<"/login">) {
  const search = await props.searchParams;
  const error = typeof search.error === "string" ? search.error : undefined;
  const callbackUrl = typeof search.callbackUrl === "string" ? search.callbackUrl : "/";

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl });
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Logo />
          <CardDescription>Sign in to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInWithGoogle}>
            <Button type="submit" className="w-full">
              Continue with Google
            </Button>
          </form>
          {error && (
            <p className="mt-3 text-sm text-destructive">
              Sign-in failed. Try again.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
