import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { db } from "../../../db-client";
import { UserFile } from "../../../db-schema";

const uploadFileSchema = z.object({
  userId: z.string(),
  name: z.string(),
  mimeType: z.string(),
  base64Data: z.string(),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional(),
});

const uploadFileProcedure = publicProcedure
  .input(uploadFileSchema)
  .mutation(async ({ input }) => {
    console.log('[Files] Uploading file:', input.name, 'mimeType:', input.mimeType);
    
    const getFileType = (mimeType: string): 'txt' | 'doc' | 'pdf' | 'other' => {
      if (mimeType === 'text/plain') return 'txt';
      if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'doc';
      if (mimeType === 'application/pdf') return 'pdf';
      return 'other';
    };

    const now = new Date().toISOString();
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const buffer = Buffer.from(input.base64Data, 'base64');
    const size = buffer.length;
    
    let content: string | undefined;
    if (input.mimeType === 'text/plain') {
      content = buffer.toString('utf-8');
    }

    const newFile: UserFile = {
      id: fileId,
      userId: input.userId,
      name: input.name,
      type: getFileType(input.mimeType),
      mimeType: input.mimeType,
      size,
      content,
      base64Data: input.base64Data,
      createdAt: now,
      updatedAt: now,
      tags: input.tags || [],
      folder: input.folder,
    };

    await db.set(`files:${input.userId}:${fileId}`, newFile);
    
    const fileIndex = await db.get<string[]>(`files:${input.userId}:index`) || [];
    fileIndex.push(fileId);
    await db.set(`files:${input.userId}:index`, fileIndex);

    console.log('[Files] File uploaded successfully:', fileId, 'size:', size);
    
    return {
      success: true,
      file: newFile,
    };
  });

export default uploadFileProcedure;
