import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listRequests } from "@/server/requests";
import { Send, Plus } from "lucide-react";

export const Route = createFileRoute("/_authed/requests/")({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== "placement_manager") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async ({ context }) => {
    const requests = await listRequests({ data: context.session.user.id });
    return { requests };
  },
  component: RequestsListPage,
});

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  open: "warning",
  accepted: "success",
  declined: "destructive",
};

function RequestsListPage() {
  const { requests } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Apprentice Requests</h2>
          <p className="text-muted-foreground">
            Your requests for apprentices for specific placements
          </p>
        </div>
        <Button asChild>
          <Link to="/requests/new">
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Send className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No requests yet</p>
            <p className="text-sm text-muted-foreground">
              Create a request to find apprentices for your placements.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <p className="font-medium">{r.placementTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.placementDepartment}
                  </p>
                  {r.message && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {r.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={statusVariant[r.status] ?? "default"}>
                  {r.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
