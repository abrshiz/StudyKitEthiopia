import { Construction, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { type Feature, type FeatureStatus, getFeature, type FeatureId } from "@/config/features";
import { cn } from "@/lib/utils";

const statusLabel: Record<FeatureStatus, string> = {
  ready: "Live",
  partial: "In progress",
  planned: "Coming soon",
};

const statusVariant: Record<FeatureStatus, "default" | "secondary" | "outline"> = {
  ready: "default",
  partial: "secondary",
  planned: "outline",
};

export function FeatureStatusBadge({
  status,
  className,
}: {
  status: FeatureStatus;
  className?: string;
}) {
  return (
    <Badge variant={statusVariant[status]} className={cn("gap-1 text-[10px] font-medium", className)}>
      {status === "planned" && <Construction className="h-3 w-3" />}
      {statusLabel[status]}
    </Badge>
  );
}

export function FeatureBadge({ featureId, className }: { featureId: FeatureId; className?: string }) {
  const feature = getFeature(featureId);
  return <FeatureStatusBadge status={feature.status} className={className} />;
}

/** Page-level banner for features that are not fully implemented. */
export function FeatureNotice({ featureId }: { featureId: FeatureId }) {
  const feature = getFeature(featureId);
  if (feature.status === "ready") return null;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-3 text-sm",
        feature.status === "partial"
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-muted/40",
      )}
      role="status"
    >
      <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{feature.label}</span>
          <FeatureStatusBadge status={feature.status} />
        </div>
        <p className="text-muted-foreground">{feature.description}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Construction,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-14 text-center border-dashed">
      <div className="h-12 w-12 rounded-xl bg-muted grid place-items-center text-muted-foreground mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  featureId,
  children,
}: {
  title: string;
  description?: string;
  featureId?: FeatureId;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {featureId && <FeatureBadge featureId={featureId} />}
          </div>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {children}
      </div>
      {featureId && <FeatureNotice featureId={featureId} />}
    </div>
  );
}

export function featureActionDisabled(feature: Feature): boolean {
  return feature.status === "planned";
}
