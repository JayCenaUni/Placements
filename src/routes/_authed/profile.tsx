import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getProfile, updateProfile } from "@/server/apprentices";

export const Route = createFileRoute("/_authed/profile")({
  loader: async ({ context }) => {
    const data = await getProfile({ data: context.session.user.id });
    return data;
  },
  component: ProfilePage,
});

const roleLabels: Record<string, string> = {
  apprentice: "Apprentice",
  apprentice_manager: "Apprentice Manager",
  placement_manager: "Placement Manager",
};

function ProfilePage() {
  const { user: userData, profile } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const isApprentice = session.user.role === "apprentice";

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    try {
      await updateProfile({
        data: {
          userId: session.user.id,
          department: (formData.get("department") as string) || undefined,
          cohort: (formData.get("cohort") as string) || undefined,
          bio: (formData.get("bio") as string) || undefined,
          skills: (formData.get("skills") as string) || undefined,
          phone: (formData.get("phone") as string) || undefined,
        },
      });
      setSuccess(true);
      setEditing(false);
      navigate({ to: "/profile" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-3xl font-bold">Profile</h2>

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Profile updated successfully.
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {userData?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <CardTitle>{userData?.name}</CardTitle>
              <CardDescription>{userData?.email}</CardDescription>
              <Badge variant="secondary" className="mt-1">
                {roleLabels[userData?.role ?? ""] ?? userData?.role}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isApprentice && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Apprentice Profile</CardTitle>
                <CardDescription>
                  Your profile is visible to managers and placement leads.
                </CardDescription>
              </div>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      name="department"
                      defaultValue={profile?.department ?? ""}
                      placeholder="e.g. Engineering"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cohort">Cohort</Label>
                    <Input
                      id="cohort"
                      name="cohort"
                      defaultValue={profile?.cohort ?? ""}
                      placeholder="e.g. 2025 Intake"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={profile?.phone ?? ""}
                    placeholder="Your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    name="skills"
                    defaultValue={profile?.skills ?? ""}
                    placeholder="e.g. Python, React, SQL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={profile?.bio ?? ""}
                    placeholder="Tell others about yourself..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {profile ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium">Department</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.department || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Cohort</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.cohort || "Not set"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.phone || "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Skills</p>
                      {profile.skills ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {profile.skills.split(",").map((s, i) => (
                            <Badge key={i} variant="secondary">
                              {s.trim()}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not set</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Bio</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {profile.bio || "Not set"}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You haven't set up your profile yet. Click Edit to get started.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
