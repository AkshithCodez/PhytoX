"use client";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";
import { distribution } from "@/lib/analytics";
import type { Report } from "@/lib/contracts";
export default function Charts({
  reports,
  full = false,
}: {
  reports: Report[];
  full?: boolean;
}) {
  const days = new Map<string, number>();
  reports.forEach((r) => {
    const day = r.created_at.slice(0, 10);
    days.set(day, (days.get(day) ?? 0) + 1);
  });
  const trends = [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, reports]) => ({ date, reports }));
  const datasets = [
    { title: "Disease distribution", data: distribution(reports, "disease") },
    { title: "Crop distribution", data: distribution(reports, "crop") },
    { title: "Review status", data: distribution(reports, "status") },
    {
      title: "Regional comparison",
      data: distribution(reports, "region_id").map((d) => ({
        ...d,
        name:
          reports.find((r) => r.region_id === d.name)?.regions?.name ?? d.name,
      })),
    },
  ];
  return (
    <div className="dashboard-grid">
      <section className="panel chart-panel">
        <div className="panel-title">
          <h2>Reporting over time</h2>
        </div>
        <p className="filter-caption">
          Reports per calendar day (UTC). Dates without submissions are omitted.
        </p>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trends}
              margin={{ top: 20, right: 15, bottom: 20, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e4e9df"
              />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} width={35} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line
                type="linear"
                dataKey="reports"
                name="Reports"
                stroke="#547c39"
                strokeWidth={2}
                dot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <DataTable
          data={trends.map((d) => ({ name: d.date, reports: d.reports }))}
        />
      </section>
      {datasets.slice(0, full ? 4 : 1).map(({ title, data }) => (
        <section className="panel chart-panel" key={title}>
          <div className="panel-title">
            <h2>{title}</h2>
          </div>
          <p className="filter-caption">
            Number of submitted reports · selected filters
          </p>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.slice(0, 8)}
                layout="vertical"
                margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e4e9df"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Bar
                  dataKey="reports"
                  name="Reports"
                  fill="#76944e"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <DataTable data={data} />
        </section>
      ))}
    </div>
  );
}
function DataTable({ data }: { data: { name: string; reports: number }[] }) {
  return (
    <details>
      <summary>View all values as a table</summary>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category / date</th>
              <th>Reports</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td>{r.reports}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
