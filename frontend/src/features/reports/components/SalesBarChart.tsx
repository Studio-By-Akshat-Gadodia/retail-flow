import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { useChartColors } from "@/features/reports/hooks/useChartColors";
import type { SalesReportRow } from "@/features/reports/types";

const MAX_BARS = 10;

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

interface Props {
  data: SalesReportRow[];
}

export function SalesBarChart({ data }: Props) {
  const c = useChartColors();

  const chartData = data.slice(0, MAX_BARS).map((r) => ({
    name:  truncate(r.product_name, 12),
    value: r.quantity_sold,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top products sold</CardTitle>
        <CardDescription>Units moved out in this period</CardDescription>
      </CardHeader>
      <CardBody className="pt-2">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.border} />
            <XAxis
              dataKey="name"
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
              cursor={{ fill: c.surface }}
              contentStyle={{
                background:   c.bg,
                border:       `1px solid ${c.border}`,
                borderRadius: "8px",
                fontSize:     "12px",
                color:        c.fg,
              }}
              formatter={(v: number) => [v, "Qty sold"]}
            />
            <Bar dataKey="value" fill={c.accent} radius={[4, 4, 0, 0]} name="Qty sold" />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
