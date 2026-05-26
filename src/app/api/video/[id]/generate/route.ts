import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { GenerateVideoSchema, formatZodErrors } from "@/lib/validators";
import { routeToAgent } from "@/lib/ai-orchestrator";

// POST /api/video/[id]/generate - Start video generation pipeline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    const body = await request.json();
    const validation = GenerateVideoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const { pipeline, options } = validation.data;

    const project = await db.videoProject.findUnique({
      where: { id },
      include: { scenes: { orderBy: { order: "asc" } } },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Video project not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.userId !== auth.userId) {
      return NextResponse.json(
        { error: "You do not have access to this video project", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Update project status
    await db.videoProject.update({
      where: { id },
      data: { status: "generating" },
    });

    // Create render job
    const renderJob = await db.videoRenderJob.create({
      data: {
        projectId: id,
        jobType: "full",
        status: "queued",
        configJson: JSON.stringify({ pipeline, options, sceneCount: project.scenes.length }),
      },
    });

    // Trigger the video generation pipeline via AI orchestrator
    // Step 1: Generate script via script-agent
    try {
      const scriptResult = await routeToAgent("script_job", {
        topic: project.title,
        duration: options.duration || 60,
        style: project.niche || "general",
        workspaceId: project.workspaceId,
        ...options,
      }, project.workspaceId || undefined);

      if (scriptResult.status === "agent_completed" && scriptResult.result) {
        const result = scriptResult.result as Record<string, unknown>;
        const scenes = result.scenes as Array<{ narration: string; visual?: string; duration: number }> | undefined;

        // Create scenes from script if available
        if (Array.isArray(scenes) && scenes.length > 0) {
          for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            await db.videoScene.upsert({
              where: { id: `scene-${id}-${i}` },
              update: {
                narration: scene.narration,
                duration: scene.duration,
                type: "image",
                status: "pending",
              },
              create: {
                projectId: id,
                order: i,
                type: "image",
                narration: scene.narration,
                duration: scene.duration,
                status: "pending",
              },
            });
          }
        }

        // Step 2: Trigger video-compose agent for composition plan
        const composeResult = await routeToAgent("video_compose_job", {
          projectId: id,
          scenes: scenes || [],
          aspectRatio: project.aspectRatio,
          style: project.style,
          voiceId: project.voiceId,
          workspaceId: project.workspaceId,
        }, project.workspaceId || undefined);

        if (composeResult.status === "agent_completed") {
          await db.videoRenderJob.update({
            where: { id: renderJob.id },
            data: {
              status: "processing",
              configJson: JSON.stringify({
                pipeline,
                options,
                sceneCount: scenes?.length || 0,
                composePlan: composeResult.result,
              }),
            },
          });
        }
      }
    } catch (agentError) {
      // Agent failure should not prevent render job creation
      // The job will remain in "queued" status for retry
      console.error("Video pipeline agent error:", agentError);
    }

    // Log generation start
    await db.systemLog.create({
      data: {
        service: "video_engine",
        level: "info",
        action: "video_generate",
        message: `Video generation started for: ${project.title}`,
        metadataJson: JSON.stringify({ projectId: id, pipeline, renderJobId: renderJob.id }),
      },
    });

    return NextResponse.json({
      message: "Video generation started",
      projectId: id,
      renderJobId: renderJob.id,
      pipeline,
      status: "generating",
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Video generate error:", error);
    return NextResponse.json(
      { error: "Failed to start video generation" },
      { status: 500 }
    );
  }
}
