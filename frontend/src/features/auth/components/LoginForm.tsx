import { useState, FormEvent } from "react";
import { useLogin } from "@/features/auth/hooks/useAuth";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";
import { Mail, Lock } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const { mutate: login, isPending, error } = useLogin();

  const errorMessage =
    error instanceof Error ? error.message : "Invalid credentials. Please try again.";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    login({ email, password });
  }

  return (
    <div className="rounded-xl border border-border bg-bg p-8 shadow-pop">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-fg">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to your RetailFlow account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@company.com"
          leading={<Mail className="h-4 w-4" />}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="••••••••"
          leading={<Lock className="h-4 w-4" />}
          required
        />

        {error && (
          <div className="rounded-lg border border-danger-soft bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {errorMessage}
          </div>
        )}

        <Button type="submit" loading={isPending} className="w-full mt-2" size="lg">
          Sign in
        </Button>
      </form>
    </div>
  );
}
