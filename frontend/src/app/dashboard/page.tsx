import type { Metadata } from "next";

import HowItWorks from "@/components/dashboard/HowItWorks";
import JobList from "@/components/dashboard/JobList";
import NewProjectCard from "@/components/dashboard/NewProjectCard";
import RecentProjects from "@/components/dashboard/RecentProjects";
import StatsGrid from "@/components/dashboard/StatsGrid";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <WelcomeHeader />
      <StatsGrid />
      <NewProjectCard />
      <RecentProjects />
      <JobList />
      <HowItWorks />
    </div>
  );
}
