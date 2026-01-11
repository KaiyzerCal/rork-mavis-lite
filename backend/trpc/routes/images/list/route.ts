import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { db } from "../../../db-client";
import { UserImage } from "../../../db-schema";

const listImagesSchema = z.object({
  userId: z.string(),
  folder: z.string().optional(),
  isGenerated: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const listImagesProcedure = publicProcedure
  .input(listImagesSchema)
  .query(async ({ input }) => {
    console.log('[Images] Listing images for user:', input.userId);
    
    const imageIndex = await db.get<string[]>(`images:${input.userId}:index`) || [];
    
    const images: UserImage[] = [];
    for (const imageId of imageIndex) {
      const image = await db.get<UserImage>(`images:${input.userId}:${imageId}`);
      if (image) {
        let include = true;
        
        if (input.folder && image.folder !== input.folder) {
          include = false;
        }
        
        if (input.isGenerated !== undefined && image.isGenerated !== input.isGenerated) {
          include = false;
        }
        
        if (input.tags && input.tags.length > 0) {
          const imageTags = image.tags || [];
          const hasMatchingTag = input.tags.some(tag => imageTags.includes(tag));
          if (!hasMatchingTag) {
            include = false;
          }
        }
        
        if (include) {
          images.push(image);
        }
      }
    }

    images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log('[Images] Found', images.length, 'images');
    
    return {
      success: true,
      images,
      total: images.length,
    };
  });

export default listImagesProcedure;
