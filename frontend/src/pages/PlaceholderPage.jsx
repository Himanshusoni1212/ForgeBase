import { Hammer } from "lucide-react";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

// Temporary stand-in for future feature pages. States clearly that the
// section is not connected yet — no fake metrics, no sample rows.
export default function PlaceholderPage({ title, description }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={<StatusBadge tone="warning">Not yet connected</StatusBadge>}
      />
      <Card>
        <EmptyState
          icon={Hammer}
          title={`${title} is coming soon`}
          description="This section will show real data from the ForgeBase backend once it is integrated. Nothing here is wired up yet."
        />
      </Card>
    </div>
  );
}
