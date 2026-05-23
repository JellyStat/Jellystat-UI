import RecentlyAdded from "@/components/RecentlyAdded/RecentlyAdded";
import WatchStatCards from "@/components/WatchStatCards/WatchStatCards";
import LibraryOverview from "@/components/LibraryOverview/LibraryOverview";
import Sessions from "@/components/Sessions/Sessions";

export default function HomePage() {
  return (
    <div style={{ gap: 10 }}>
      <Sessions />
      <RecentlyAdded />
      <WatchStatCards />
      <LibraryOverview />
    </div>
  );
}
