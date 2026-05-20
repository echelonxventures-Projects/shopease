import { NextRequest, NextResponse } from "next/server";
import {
  calculateStats,
  calculateCorrelation,
  exploreData,
  transformData,
  linearRegression,
  getPredictiveAnalytics,
  generateBarChart,
  generateTimeSeries,
  generateDistribution,
  generatePieChart,
} from "@/server/services/data-analysis-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operation } = body;

    switch (operation) {
      case "stats":
        return NextResponse.json(calculateStats(body.values || []));

      case "correlation":
        return NextResponse.json(calculateCorrelation(body.x || [], body.y || []));

      case "explore":
        return NextResponse.json(await exploreData(body.table, body.limit));

      case "transform":
        return NextResponse.json(transformData(body.data || [], body.operations || []));

      case "regression":
        return NextResponse.json(linearRegression(body.values || []));

      case "predictive":
        return NextResponse.json(await getPredictiveAnalytics(body.metric, body.days));

      case "chart-bar":
        return NextResponse.json(generateBarChart(body.data || []));

      case "chart-time":
        return NextResponse.json(generateTimeSeries(body.data || []));

      case "chart-distribution":
        return NextResponse.json(generateDistribution(body.values || [], body.bins));

      case "chart-pie":
        return NextResponse.json(generatePieChart(body.data || []));

      default:
        return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
