import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { db } from "../../../db-client";
import { UserFile } from "../../../db-schema";

const listFilesSchema = z.object({
  userId: z.string(),
  folder: z.string().optional(),
  type: z.enum(['txt', 'doc', 'pdf', 'other']).optional(),
  tags: z.array(z.string()).optional(),
});

const listFilesProcedure = publicProcedure
  .input(listFilesSchema)
  .query(async ({ input }) => {
    console.log('[Files] Listing files for user:', input.userId);
    
    const fileIndex = await db.get<string[]>(`files:${input.userId}:index`) || [];
    
    const files: UserFile[] = [];
    for (const fileId of fileIndex) {
      const file = await db.get<UserFile>(`files:${input.userId}:${fileId}`);
      if (file) {
        let include = true;
        
        if (input.folder && file.folder !== input.folder) {
          include = false;
        }
        
        if (input.type && file.type !== input.type) {
          include = false;
        }
        
        if (input.tags && input.tags.length > 0) {
          const fileTags = file.tags || [];
          const hasMatchingTag = input.tags.some(tag => fileTags.includes(tag));
          if (!hasMatchingTag) {
            include = false;
          }
        }
        
        if (include) {
          files.push(file);
        }
      }
    }

    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log('[Files] Found', files.length, 'files');
    
    return {
      success: true,
      files,
      total: files.length,
    };
  });

export default listFilesProcedure;
