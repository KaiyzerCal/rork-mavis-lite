import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { db } from "../../../db-client";

const deleteImageSchema = z.object({
  userId: z.string(),
  imageId: z.string(),
});

const deleteImageProcedure = publicProcedure
  .input(deleteImageSchema)
  .mutation(async ({ input }) => {
    console.log('[Images] Deleting image:', input.imageId);
    
    await db.delete(`images:${input.userId}:${input.imageId}`);
    
    const imageIndex = await db.get<string[]>(`images:${input.userId}:index`) || [];
    const updatedIndex = imageIndex.filter(id => id !== input.imageId);
    await db.set(`images:${input.userId}:index`, updatedIndex);

    console.log('[Images] Image deleted successfully:', input.imageId);
    
    return {
      success: true,
      deletedId: input.imageId,
    };
  });

export default deleteImageProcedure;
