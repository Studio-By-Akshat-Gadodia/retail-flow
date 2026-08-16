import {
  CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { useChartColors } from "@/features/reports/hooks/useChartColors";
import type { TrendPoint } from "@/features/reports/types";

interface Props {
  data: TrendPoint[];
}

export function MovementTrendChart({ data }: Props) {
  const c = useChartColors();

  const chartData = data.map((r) => ({
    ...r,
    date: r.date.slice(5), // "MM-DD"
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movement trend</CardTitle>
        <CardDescription>Stock in vs. stock out by day</CardDescription>
      </CardHeader>
      <CardBody className="pt-2">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.border} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: c.muted }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: c.muted }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background:   c.bg,
                border:       `1px solid ${c.border}`,
                borderRadius: "8px",
                fontSize:     "12px",
                color:        c.fg,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              formatter={(v) => v === "stock_in" ? "Stock in" : "Stock out"}
            />
            <Line
              type="monotone"
              dataKey="stock_in"
              stroke={c.success}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="stock_out"
              stroke={c.danger}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
