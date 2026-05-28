import { Link } from "@tanstack/react-router";
import { Database, Loader2, AlertCircle, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isApiConfigured } from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";

export function ApiNotConfigured({ resource }: { resource: string }) {
  return (
    <Card className="p-8 text-center border-dashed border-primary/20 bg-muted/30">
      <Database className="h-10 w-10 mx-auto text-primary/70 mb-4" />
      <h3 className="font-semibold">Connect your database API</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        {resource} will load from your backend once{" "}
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">VITE_API_URL</code> is set in{" "}
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.env</code>. No sample data is shown
        in the app.
      </p>
    </Card>
  );
}

export function ApiLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      <p className="text-sm">{label}…</p>
    </div>
  );
}

export function ApiErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof ApiError
      ? error.status === 0
        ? "API is not configured."
        : error.message
      : "Something went wrong.";

  return (
    <Card className="p-8 text-center border-destructive/30">
      <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-4" />
      <h3 className="font-semibold">Could not load data</h3>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Card>
  );
}

export function ApiEmpty({ title, description }: { title: string; description: string }) {
  return (
    <Card className="p-10 text-center border-dashed">
      <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
    </Card>
  );
}

export function DataBoundary({
  resource,
  isLoading,
  isError,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  onRetry,
  children,
}: {
  resource: string;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (!isApiConfigured()) {
    return <ApiNotConfigured resource={resource} />;
  }
  if (isLoading) return <ApiLoading label={resource} />;
  if (isError) return <ApiErrorState error={error} onRetry={onRetry} />;
  if (isEmpty) return <ApiEmpty title={emptyTitle} description={emptyDescription} />;
  return children;
}

export function SetupHint() {
  if (isApiConfigured()) return null;
  return (
    <p className="text-xs text-muted-foreground">
      Backend not linked — add{" "}
      <Link to="/status" className="text-primary underline-offset-2 hover:underline">
        setup steps
      </Link>
    </p>
  );
}
