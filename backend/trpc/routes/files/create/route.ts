import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { db } from "../../../db-client";
import { UserFile } from "../../../db-schema";

const createFileSchema = z.object({
  userId: z.string(),
  name: z.string(),
  type: z.enum(['txt', 'doc', 'pdf', 'other']),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional(),
});

const createFileProcedure = publicProcedure
  .input(createFileSchema)
  .mutation(async ({ input }) => {
    console.log('[Files] Creating file:', input.name, 'type:', input.type);
    
    const mimeTypeMap: Record<string, string> = {
      txt: 'text/plain',
      doc: 'application/msword',
      pdf: 'application/pdf',
      other: 'application/octet-stream',
    };

    const now = new Date().toISOString();
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const contentBuffer = Buffer.from(input.content, 'utf-8');
    const base64Data = contentBuffer.toString('base64');
    
    const newFile: UserFile = {
      id: fileId,
      userId: input.userId,
      name: input.name,
      type: input.type,
      mimeType: mimeTypeMap[input.type] || 'application/octet-stream',
      size: contentBuffer.length,
      content: input.content,
      base64Data,
      createdAt: now,
      updatedAt: now,
      tags: input.tags || [],
      folder: input.folder,
    };

    await db.set(`files:${input.userId}:${fileId}`, newFile);
    
    const fileIndex = await db.get<string[]>(`files:${input.userId}:index`) || [];
    fileIndex.push(fileId);
    await db.set(`files:${input.userId}:index`, fileIndex);

    console.log('[Files] File created successfully:', fileId);
    
    return {
      success: true,
      file: newFile,
    };
  });

export default createFileProcedure;
