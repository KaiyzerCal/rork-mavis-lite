import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { db } from "../../../db-client";
import { UserFile } from "../../../db-schema";

const getFileSchema = z.object({
  userId: z.string(),
  fileId: z.string(),
});

const getFileProcedure = publicProcedure
  .input(getFileSchema)
  .query(async ({ input }) => {
    console.log('[Files] Getting file:', input.fileId);
    
    const file = await db.get<UserFile>(`files:${input.userId}:${input.fileId}`);
    
    if (!file) {
      console.log('[Files] File not found:', input.fileId);
      return {
        success: false,
        error: 'File not found',
        file: null,
      };
    }

    console.log('[Files] File retrieved:', file.name);
    
    return {
      success: true,
      file,
    };
  });

export default getFileProcedure;
