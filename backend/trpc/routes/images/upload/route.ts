import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { db } from "../../../db-client";
import { UserImage } from "../../../db-schema";

const uploadImageSchema = z.object({
  userId: z.string(),
  name: z.string(),
  mimeType: z.string(),
  base64Data: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional(),
});

const uploadImageProcedure = publicProcedure
  .input(uploadImageSchema)
  .mutation(async ({ input }) => {
    console.log('[Images] Uploading image:', input.name, 'mimeType:', input.mimeType);
    
    const now = new Date().toISOString();
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const buffer = Buffer.from(input.base64Data, 'base64');
    const size = buffer.length;

    const newImage: UserImage = {
      id: imageId,
      userId: input.userId,
      name: input.name,
      mimeType: input.mimeType,
      size,
      base64Data: input.base64Data,
      width: input.width,
      height: input.height,
      createdAt: now,
      updatedAt: now,
      tags: input.tags || [],
      folder: input.folder,
      isGenerated: false,
    };

    await db.set(`images:${input.userId}:${imageId}`, newImage);
    
    const imageIndex = await db.get<string[]>(`images:${input.userId}:index`) || [];
    imageIndex.push(imageId);
    await db.set(`images:${input.userId}:index`, imageIndex);

    console.log('[Images] Image uploaded successfully:', imageId, 'size:', size);
    
    return {
      success: true,
      image: newImage,
    };
  });

export default uploadImageProcedure;
