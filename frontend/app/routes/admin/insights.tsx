import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import { insightsAPI } from "~/services/api";

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const COLORS = ["#4ade80", "#f87171", "#60a5fa", "#facc15", "#a78bfa"];

  const fetchInsights = async (start?: string, end?: string) => {
    try {
      const insightsData = await insightsAPI.getFullInsights(start, end);
      setData(insightsData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (!data) return <p>Loading...</p>;

  // Helper to render chart cards dynamically
  const chartCards = [
    {
      title: "📦 Order Summary",
      type: "bar",
      dataKey: "count",
      data: data.orderSummary,
      xAxis: "status",
      fill: "#4ade80",
    },
    {
      title: "💰 Revenue Over Time",
      type: "line",
      dataKey: "revenue",
      data: data.revenueOverTime,
      xAxis: "date",
      stroke: "#60a5fa",
    },
    {
      title: "🍽️ Top Selling Items",
      type: "bar-vertical",
      dataKey: "sales",
      data: data.topSellingItems,
      xAxis: "item",
      fill: "#facc15",
    },
    {
      title: "⏰ Peak Hours",
      type: "bar",
      dataKey: "orders",
      data: data.peakHours,
      xAxis: "hour",
      fill: "#a78bfa",
    },
    {
      title: "👨‍🍳 Waiter Performance",
      type: "bar",
      dataKey: "orders",
      data: data.waiterPerformance,
      xAxis: "waiter",
      fill: "#f87171",
    },
    {
      title: "📂 Most Ordered Categories",
      type: "pie",
      data: data.orderCategories,
      dataKey: "value",
      nameKey: "category",
    },
    {
      title: "👥 Customer Retention",
      type: "pie",
      data: data.customerRetention,
      dataKey: "value",
      nameKey: "type",
      innerRadius: 60,
    },
  ];

  return (
    
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">📊 Restaurant Insights</h1>

      {/* Date Filter */}
      <div className="flex gap-4 items-end mb-6">
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <Button onClick={() => fetchInsights(startDate, endDate)}>Apply</Button>
      </div>

      {/* Charts Grid: 3 per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chartCards.map((chart, index) => (
          <Card key={index}>
            <CardHeader>{chart.title}</CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                {chart.type === "bar" && (
                  <BarChart data={chart.data}>
                    <XAxis dataKey={chart.xAxis} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={chart.dataKey} fill={chart.fill} />
                  </BarChart>
                )}
                {chart.type === "bar-vertical" && (
                  <BarChart data={chart.data} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey={chart.xAxis} type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={chart.dataKey} fill={chart.fill} />
                  </BarChart>
                )}
                {chart.type === "line" && (
                  <LineChart data={chart.data}>
                    <XAxis dataKey={chart.xAxis} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey={chart.dataKey} stroke={chart.stroke} strokeWidth={2} />
                  </LineChart>
                )}
                {chart.type === "pie" && (
                  <PieChart>
                    <Pie
                      data={chart.data}
                      dataKey={chart.dataKey}
                      nameKey={chart.nameKey}
                      outerRadius={100}
                      innerRadius={chart.innerRadius || 0}
                      label
                    >
                      {chart.data.map((entry: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
