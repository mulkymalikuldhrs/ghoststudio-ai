import { NextRequest, NextResponse } from "next/server";

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "7d";

    // Demo analytics data
    const analytics = {
      overview: {
        totalViews: 2400000,
        avgWatchTime: 42,
        ctr: 8.7,
        subscriberGrowth: 12400,
        period,
      },
      viewsOverTime: [
        { day: "Mon", views: 34000, shorts: 28000 },
        { day: "Tue", views: 42000, shorts: 35000 },
        { day: "Wed", views: 38000, shorts: 31000 },
        { day: "Thu", views: 51000, shorts: 42000 },
        { day: "Fri", views: 47000, shorts: 39000 },
        { day: "Sat", views: 62000, shorts: 51000 },
        { day: "Sun", views: 55000, shorts: 45000 },
      ],
      topVideos: [
        {
          title: "Why 90% of People Never Escape the Matrix",
          views: 842000,
          ctr: 12.3,
          watchTime: 48,
          platform: "TikTok",
        },
        {
          title: "The Haunted Room 301",
          views: 534000,
          ctr: 9.8,
          watchTime: 42,
          platform: "YouTube",
        },
        {
          title: "Bitcoin Will Hit $500K",
          views: 421000,
          ctr: 8.5,
          watchTime: 55,
          platform: "TikTok",
        },
        {
          title: "5 Anime Plot Twists",
          views: 312000,
          ctr: 11.2,
          watchTime: 39,
          platform: "Reels",
        },
        {
          title: "How Your Brain Tricks You",
          views: 287000,
          ctr: 7.9,
          watchTime: 44,
          platform: "YouTube",
        },
      ],
      nichePerformance: [
        { niche: "Motivation", videos: 18, views: 1200000, avgCTR: 10.8 },
        { niche: "Horror", videos: 12, views: 890000, avgCTR: 9.4 },
        { niche: "Crypto", videos: 8, views: 620000, avgCTR: 8.1 },
        { niche: "Anime", videos: 6, views: 410000, avgCTR: 11.5 },
        { niche: "Education", videos: 3, views: 180000, avgCTR: 7.2 },
      ],
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
