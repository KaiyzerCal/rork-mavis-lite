import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { db } from "../../../db-client";
import { UserImage } from "../../../db-schema";

const editImageSchema = z.object({
  userId: z.string(),
  prompt: z.string(),
  images: z.array(z.object({
    type: z.literal('image'),
    image: z.string(),
  })),
  name: z.string().optional(),
  aspectRatio: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional(),
});

const TOOLKIT_URL = "https://toolkit.rork.com/images/edit/";

const editImageProcedure = publicProcedure
  .input(editImageSchema)
  .mutation(async ({ input }) => {
    console.log('[Images] Editing image with prompt:', input.prompt.substring(0, 100));
    
    try {
      const response = await fetch(TOOLKIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input.prompt,
          images: input.images,
          aspectRatio: input.aspectRatio || '1:1',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Images] Edit failed:', errorText);
        return {
          success: false,
          error: `Image edit failed: ${response.statusText}`,
        };
      }

      const data = await response.json();
      
      if (!data.image || !data.image.base64Data) {
        console.error('[Images] Invalid response from edit API');
        return {
          success: false,
          error: 'Invalid response from image edit API',
        };
      }

      const now = new Date().toISOString();
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const buffer = Buffer.from(data.image.base64Data, 'base64');
      const size = buffer.length;

      const imageName = input.name || `edited_${Date.now()}.png`;

      const newImage: UserImage = {
        id: imageId,
        userId: input.userId,
        name: imageName,
        mimeType: data.image.mimeType || 'image/png',
        size,
        base64Data: data.image.base64Data,
        createdAt: now,
        updatedAt: now,
        tags: input.tags || ['ai-edited'],
        folder: input.folder,
        isGenerated: true,
        generationPrompt: input.prompt,
      };

      await db.set(`images:${input.userId}:${imageId}`, newImage);
      
      const imageIndex = await db.get<string[]>(`images:${input.userId}:index`) || [];
      imageIndex.push(imageId);
      await db.set(`images:${input.userId}:index`, imageIndex);

      console.log('[Images] Image edited and saved successfully:', imageId);
      
      return {
        success: true,
        image: newImage,
      };
    } catch (error) {
      console.error('[Images] Edit exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during image editing',
      };
    }
  });

export default editImageProcedure;
