import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { metadata, schemaTask } from "@trigger.dev/sdk";
import { put } from "@vercel/blob";
import { generateText } from "ai";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ChatFeedMessageSchema } from "@/types/tasks";

const positionSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .passthrough();

const canvasNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().optional(),
    position: positionSchema,
    width: z.number().optional(),
    height: z.number().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const canvasEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    type: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const generateSpecSchema = z.object({
  projectId: z.string().trim().min(1),
  roomId: z.string().trim().min(1),
  chatHistory: z.array(ChatFeedMessageSchema),
  nodes: z.array(canvasNodeSchema),
  edges: z.array(canvasEdgeSchema),
});

function stringifyForPrompt(value: unknown): string {
  return JSON.stringify(value, null, 2).slice(0, 20000);
}

function createSpecPath(projectId: string) {
  return `specs/${projectId}/${Date.now()}.md`;
}

export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: generateSpecSchema,
  run: async (payload) => {
    metadata.set("status", "started");
    metadata.set("projectId", payload.projectId);
    metadata.set("roomId", payload.roomId);
    metadata.set("nodeCount", payload.nodes.length);
    metadata.set("edgeCount", payload.edges.length);

    try {
      metadata.set("status", "generating");

      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });

      const result = await generateText({
        model: google("gemini-2.5-flash"),
        system: [
          "You are Ghost AI, a senior system design technical writer.",
          "Generate a clear Markdown technical specification from the provided collaborative canvas and chat history.",
          "Use concrete details from node labels, node metadata, edge relationships, and chat messages.",
          "Do not invent external services, requirements, or architecture choices that are not implied by the canvas or chat.",
          "Return Markdown only. Do not wrap the response in code fences.",
        ].join("\n"),
        prompt: [
          `Project ID: ${payload.projectId}`,
          `Room ID: ${payload.roomId}`,
          `Chat history JSON:\n${stringifyForPrompt(payload.chatHistory)}`,
          `Canvas nodes JSON:\n${stringifyForPrompt(payload.nodes)}`,
          `Canvas edges JSON:\n${stringifyForPrompt(payload.edges)}`,
          [
            "Write a technical specification with these sections when the source material supports them:",
            "# Technical Specification",
            "## Overview",
            "## Goals",
            "## Architecture",
            "## Components",
            "## Data Flow",
            "## Integrations",
            "## Operational Notes",
            "## Open Questions",
          ].join("\n"),
        ].join("\n\n"),
      });

      const spec = result.text.trim();
      const blob = await put(createSpecPath(payload.projectId), spec, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "text/markdown; charset=utf-8",
      });

      const projectSpec = await prisma.projectSpec.create({
        data: {
          projectId: payload.projectId,
          filePath: blob.url,
        },
      });

      metadata.set("status", "complete");
      metadata.set("specLength", spec.length);
      metadata.set("specId", projectSpec.id);

      return {
        spec,
        specId: projectSpec.id,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Spec generation failed unexpectedly.";

      metadata.set("status", "error");
      metadata.set("error", message);
      throw error;
    }
  },
});
