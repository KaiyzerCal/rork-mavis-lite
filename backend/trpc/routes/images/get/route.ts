import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { db } from "../../../db-client";
import { UserImage } from "../../../db-schema";

const getImageSchema = z.object({
  userId: z.string(),
  imageId: z.string(),
});

const getImageProcedure = publicProcedure
  .input(getImageSchema)
  .query(async ({ input }) => {
    console.log('[Images] Getting image:', input.imageId);
    
    const image = await db.get<UserImage>(`images:${input.userId}:${input.imageId}`);
    
    if (!image) {
      console.log('[Images] Image not found:', input.imageId);
      return {
        success: false,
        error: 'Image not found',
        image: null,
      };
    }

    console.log('[Images] Image retrieved:', image.name);
    
    return {
      success: true,
      image,
    };
  });

export default getImageProcedure;
