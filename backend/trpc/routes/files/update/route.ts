import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { db } from "../../../db-client";
import { UserFile } from "../../../db-schema";

const updateFileSchema = z.object({
  userId: z.string(),
  fileId: z.string(),
  name: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional(),
});

const updateFileProcedure = publicProcedure
  .input(updateFileSchema)
  .mutation(async ({ input }) => {
    console.log('[Files] Updating file:', input.fileId);
    
    const existingFile = await db.get<UserFile>(`files:${input.userId}:${input.fileId}`);
    
    if (!existingFile) {
      console.log('[Files] File not found:', input.fileId);
      return {
        success: false,
        error: 'File not found',
      };
    }

    const now = new Date().toISOString();
    
    const updatedFile: UserFile = {
      ...existingFile,
      name: input.name ?? existingFile.name,
      tags: input.tags ?? existingFile.tags,
      folder: input.folder ?? existingFile.folder,
      updatedAt: now,
    };

    if (input.content !== undefined) {
      const contentBuffer = Buffer.from(input.content, 'utf-8');
      updatedFile.content = input.content;
      updatedFile.base64Data = contentBuffer.toString('base64');
      updatedFile.size = contentBuffer.length;
    }

    await db.set(`files:${input.userId}:${input.fileId}`, updatedFile);

    console.log('[Files] File updated successfully:', input.fileId);
    
    return {
      success: true,
      file: updatedFile,
    };
  });

export default updateFileProcedure;
