import { auth } from "../lib/auth";
import { db } from "./index";
import {
  apprenticeProfile,
  placement,
  application,
  review,
  managerAssignment,
  apprenticeRequest,
  user,
  session,
  account,
  verification,
} from "./schema";

async function seed() {
  console.log("Clearing existing data...");
  await db.delete(review);
  await db.delete(apprenticeRequest);
  await db.delete(application);
  await db.delete(managerAssignment);
  await db.delete(apprenticeProfile);
  await db.delete(placement);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);

  console.log("Creating users...");

  const apprentice1 = await auth.api.signUpEmail({
    body: { name: "Alice Johnson", email: "alice@example.com", password: "password123", role: "apprentice" },
  });
  const apprentice2 = await auth.api.signUpEmail({
    body: { name: "Bob Williams", email: "bob@example.com", password: "password123", role: "apprentice" },
  });
  const apprentice3 = await auth.api.signUpEmail({
    body: { name: "Charlie Brown", email: "charlie@example.com", password: "password123", role: "apprentice" },
  });

  const am1 = await auth.api.signUpEmail({
    body: { name: "Diana Manager", email: "diana@example.com", password: "password123", role: "apprentice_manager" },
  });

  const pm1 = await auth.api.signUpEmail({
    body: { name: "Edward Placer", email: "edward@example.com", password: "password123", role: "placement_manager" },
  });
  const pm2 = await auth.api.signUpEmail({
    body: { name: "Fiona Placer", email: "fiona@example.com", password: "password123", role: "placement_manager" },
  });

  console.log("Creating apprentice profiles...");
  await db.insert(apprenticeProfile).values([
    {
      userId: apprentice1.user.id,
      department: "Engineering",
      cohort: "2025 Intake",
      bio: "Passionate about software development and cloud technologies.",
      skills: "Python, JavaScript, React, AWS",
      phone: "07700 900001",
    },
    {
      userId: apprentice2.user.id,
      department: "Data Science",
      cohort: "2025 Intake",
      bio: "Interested in data analysis, machine learning, and statistics.",
      skills: "Python, SQL, Pandas, Scikit-learn",
      phone: "07700 900002",
    },
    {
      userId: apprentice3.user.id,
      department: "Cyber Security",
      cohort: "2026 Intake",
      bio: "Focused on network security and penetration testing.",
      skills: "Linux, Networking, Wireshark, Python",
      phone: "07700 900003",
    },
  ]);

  console.log("Assigning apprentices to manager...");
  await db.insert(managerAssignment).values([
    { managerId: am1.user.id, apprenticeId: apprentice1.user.id },
    { managerId: am1.user.id, apprenticeId: apprentice2.user.id },
    { managerId: am1.user.id, apprenticeId: apprentice3.user.id },
  ]);

  console.log("Creating placements...");
  const placementIds = {
    p1: crypto.randomUUID(),
    p2: crypto.randomUUID(),
    p3: crypto.randomUUID(),
    p4: crypto.randomUUID(),
  };

  await db.insert(placement).values([
    {
      id: placementIds.p1,
      title: "Full-Stack Web Developer",
      description:
        "Join our web team to build internal tools using React and Node.js. You will work on real projects, participate in code reviews, and learn modern development practices.",
      department: "Digital Services",
      location: "London",
      durationWeeks: 12,
      startDate: "2026-04-01",
      endDate: "2026-06-24",
      capacity: 2,
      placementManagerId: pm1.user.id,
      status: "open",
    },
    {
      id: placementIds.p2,
      title: "Data Engineering Placement",
      description:
        "Work with our data team to build ETL pipelines and data models. Experience with SQL is helpful but not required.",
      department: "Data & Analytics",
      location: "Manchester",
      durationWeeks: 8,
      startDate: "2026-05-01",
      endDate: "2026-06-26",
      capacity: 1,
      placementManagerId: pm1.user.id,
      status: "open",
    },
    {
      id: placementIds.p3,
      title: "Cloud Infrastructure Apprentice",
      description:
        "Learn to manage and deploy cloud infrastructure on AWS. You will assist with CI/CD pipelines, monitoring, and automation.",
      department: "Platform Engineering",
      location: "Remote",
      durationWeeks: 16,
      startDate: "2026-06-01",
      endDate: "2026-09-18",
      capacity: 1,
      placementManagerId: pm2.user.id,
      status: "open",
    },
    {
      id: placementIds.p4,
      title: "Security Operations Analyst",
      description:
        "Support the SOC team in monitoring threats, analysing incidents, and improving security posture.",
      department: "Cyber Security",
      location: "Birmingham",
      durationWeeks: 12,
      startDate: "2026-04-15",
      endDate: "2026-07-08",
      capacity: 1,
      placementManagerId: pm2.user.id,
      status: "draft",
    },
  ]);

  console.log("Creating applications...");
  const appIds = {
    a1: crypto.randomUUID(),
    a2: crypto.randomUUID(),
    a3: crypto.randomUUID(),
    a4: crypto.randomUUID(),
  };

  await db.insert(application).values([
    {
      id: appIds.a1,
      apprenticeId: apprentice1.user.id,
      placementId: placementIds.p1,
      coverMessage:
        "I am very interested in this full-stack role. I have been building React apps for the past year and would love to expand my skills.",
      status: "approved",
      reviewedBy: am1.user.id,
      reviewedAt: new Date("2026-03-10"),
    },
    {
      id: appIds.a2,
      apprenticeId: apprentice2.user.id,
      placementId: placementIds.p2,
      coverMessage:
        "Data engineering aligns well with my interest in data science. I am eager to learn about ETL processes and data modelling.",
      status: "pending",
    },
    {
      id: appIds.a3,
      apprenticeId: apprentice1.user.id,
      placementId: placementIds.p3,
      coverMessage: "I would love to learn more about cloud infrastructure and DevOps practices.",
      status: "pending",
    },
    {
      id: appIds.a4,
      apprenticeId: apprentice3.user.id,
      placementId: placementIds.p1,
      coverMessage: "While my focus is cyber security, I believe full-stack development will broaden my understanding.",
      status: "denied",
      reviewedBy: am1.user.id,
      reviewedAt: new Date("2026-03-12"),
    },
  ]);

  // Set Alice's current placement since her application was approved
  const { eq } = await import("drizzle-orm");
  await db
    .update(apprenticeProfile)
    .set({ currentPlacementId: placementIds.p1 })
    .where(eq(apprenticeProfile.userId, apprentice1.user.id));

  console.log("Creating reviews...");
  await db.insert(review).values([
    {
      apprenticeId: apprentice1.user.id,
      placementId: placementIds.p1,
      rating: 5,
      title: "Excellent learning experience",
      content:
        "The team was incredibly supportive and I learned so much about modern web development. The code reviews were particularly valuable and helped me improve my coding practices significantly.",
    },
  ]);

  console.log("Creating apprentice requests...");
  await db.insert(apprenticeRequest).values([
    {
      placementManagerId: pm2.user.id,
      placementId: placementIds.p3,
      message:
        "Looking for an apprentice with AWS interest or experience. Certification study support available.",
      status: "open",
    },
  ]);

  console.log("Seed complete!");
  console.log("\nTest accounts (all passwords: password123):");
  console.log("  Apprentice:         alice@example.com");
  console.log("  Apprentice:         bob@example.com");
  console.log("  Apprentice:         charlie@example.com");
  console.log("  Apprentice Manager: diana@example.com");
  console.log("  Placement Manager:  edward@example.com");
  console.log("  Placement Manager:  fiona@example.com");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
