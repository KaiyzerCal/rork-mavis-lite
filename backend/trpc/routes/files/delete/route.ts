import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { db } from "../../../db-client";

const deleteFileSchema = z.object({
  userId: z.string(),
  fileId: z.string(),
});

const deleteFileProcedure = publicProcedure
  .input(deleteFileSchema)
  .mutation(async ({ input }) => {
    console.log('[Files] Deleting file:', input.fileId);
    
    await db.delete(`files:${input.userId}:${input.fileId}`);
    
    const fileIndex = await db.get<string[]>(`files:${input.userId}:index`) || [];
    const updatedIndex = fileIndex.filter(id => id !== input.fileId);
    await db.set(`files:${input.userId}:index`, updatedIndex);

    console.log('[Files] File deleted successfully:', input.fileId);
    
    return {
      success: true,
      deletedId: input.fileId,
    };
  });

export default deleteFileProcedure;
