import { createFileRoute } from "@tanstack/react-router";
import ChartComponent from "../components/ui/charts"; // Import the chart component

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen m-5">
      <ChartComponent /> {/* Render the chart component */}
    </div>
  );
}

export default RouteComponent;
