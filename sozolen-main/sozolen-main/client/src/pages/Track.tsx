import { useState } from "react";
import { useRespondToCustomRequestQuote, useTrackRequest, type TrackRequestResult } from "@/hooks/use-custom-requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Package, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useCustomerAuth } from "@/hooks/use-customer-auth";

function TrackResult({
  data,
  canRespondQuote,
  onRespond,
  isResponding,
}: {
  data: TrackRequestResult;
  canRespondQuote: boolean;
  onRespond: (action: "accepted" | "rejected") => void;
  isResponding: boolean;
}) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    in_progress: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
    completed: "bg-green-500/20 text-green-700 dark:text-green-400",
  };
  const formattedAddress =
    data.addressLine1 || data.city || data.pincode
      ? [data.addressLine1, data.addressLine2, [data.city, data.state, data.pincode].filter(Boolean).join(", ")]
          .filter(Boolean)
          .join(", ")
      : data.address;
  return (
    <Card className="rounded-2xl border-border/50 p-6 text-left max-w-2xl mx-auto bg-card/95 backdrop-blur">
      <div className="flex items-center gap-2 mb-6">
        <Package className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Request details</h2>
      </div>
      <div className="grid gap-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Tracking ID:</span>
          <span className="font-mono font-semibold">{data.trackingId}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Status:</span>
          <Badge className={`ml-2 ${statusColors[data.status] ?? ""}`}>{data.status.replace("_", " ")}</Badge>
        </div>
        {data.quoteStatus && (
          <div>
            <span className="text-muted-foreground">Quote status:</span>
            <Badge className="ml-2">{data.quoteStatus}</Badge>
          </div>
        )}
        {typeof data.quotedPrice === "number" && (
          <div>
            <span className="text-muted-foreground">Quoted price:</span>
            <span className="ml-2 font-semibold">INR {data.quotedPrice.toLocaleString("en-IN")}</span>
          </div>
        )}
        {data.quoteEta && (
          <div>
            <span className="text-muted-foreground">Estimated timeline:</span>
            <span className="ml-2">{data.quoteEta}</span>
          </div>
        )}
        {data.quoteNotes && (
          <div>
            <span className="text-muted-foreground">Quote notes:</span>
            <p className="mt-1 text-foreground bg-muted/30 p-4 rounded-xl">{data.quoteNotes}</p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Submitted:</span>
          <span className="ml-2">{data.createdAt ? new Date(data.createdAt).toLocaleString() : "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Name:</span>
          <span className="ml-2 font-medium">{data.name}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Email:</span>
          <span className="ml-2">{data.email}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Phone:</span>
          <span className="ml-2">{data.phone}</span>
        </div>
        {formattedAddress && (
          <div>
            <span className="text-muted-foreground">Address:</span>
            <p className="mt-1 text-foreground whitespace-pre-wrap">{formattedAddress}</p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Description:</span>
          <p className="mt-1 text-foreground bg-muted/30 p-4 rounded-xl">{data.description}</p>
        </div>
        {data.imageUrls.length > 0 && (
          <div>
            <span className="text-muted-foreground">Reference images:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {data.imageUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" className="rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="" className="w-full h-24 object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}
        {canRespondQuote && data.quoteStatus === "sent" && (
          <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/20">
            <p className="text-sm font-medium">Respond to this quote</p>
            <div className="flex gap-2">
              <Button disabled={isResponding} onClick={() => onRespond("accepted")} className="h-9">
                Accept quote
              </Button>
              <Button disabled={isResponding} onClick={() => onRespond("rejected")} variant="outline" className="h-9">
                Reject quote
              </Button>
            </div>
          </div>
        )}
        {Array.isArray(data.timeline) && data.timeline.length > 0 && (
          <div>
            <span className="text-muted-foreground">Timeline:</span>
            <ul className="mt-2 space-y-2">
              {data.timeline.map((entry, index) => (
                <li key={`${entry.at}-${index}`} className="rounded-lg border border-border/50 p-2 text-xs">
                  <p className="font-medium">{entry.message}</p>
                  <p className="text-muted-foreground">{new Date(entry.at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function Track() {
  const [trackingId, setTrackingId] = useState("");
  const trackRequest = useTrackRequest();
  const respondToQuote = useRespondToCustomRequestQuote();
  const { customer } = useCustomerAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = trackingId.trim();
    if (!trimmed) return;
    trackRequest.mutate(trimmed);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 py-24">
      {/* 3D-style animated background with tracking theme */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%23fff' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background/95 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Track your request</h1>
        <p className="text-muted-foreground mb-2">This tracking is only for <strong>custom form</strong> submissions.</p>
        <p className="text-sm text-muted-foreground mb-8">Enter the tracking ID you received by email (e.g. SOZOLEN3D-1).</p>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="space-y-2">
            <Label htmlFor="trackingId" className="sr-only">Tracking ID</Label>
            <Input
              id="trackingId"
              type="text"
              placeholder="SOZOLEN3D-1"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="rounded-xl h-12 text-center font-mono text-lg bg-background/80 border-border"
              disabled={trackRequest.isPending}
            />
          </div>
          <Button type="submit" className="w-full rounded-xl h-12" disabled={trackRequest.isPending || !trackingId.trim()}>
            {trackRequest.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Track
              </>
            )}
          </Button>
        </form>

        {trackRequest.isError && (
          <Card className="rounded-2xl border-destructive/50 bg-destructive/5 p-6 mb-8 text-left max-w-lg mx-auto">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Unable to find request</h3>
                <p className="text-sm text-muted-foreground mt-1">{trackRequest.error?.message ?? "Please check your tracking ID and try again."}</p>
              </div>
            </div>
          </Card>
        )}

        {trackRequest.data && (
          <TrackResult
            data={trackRequest.data}
            canRespondQuote={
              !!customer &&
              customer.email.toLowerCase() === trackRequest.data.email.toLowerCase()
            }
            isResponding={respondToQuote.isPending}
            onRespond={(action) => {
              respondToQuote.mutate(
                { id: trackRequest.data!.id, action },
                {
                  onSuccess: () => {
                    trackRequest.mutate(trackRequest.data!.trackingId);
                  },
                },
              );
            }}
          />
        )}

        <p className="mt-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
