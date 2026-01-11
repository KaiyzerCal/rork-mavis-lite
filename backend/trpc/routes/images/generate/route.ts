import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { db } from "../../../db-client";
import { UserImage } from "../../../db-schema";

const generateImageSchema = z.object({
  userId: z.string(),
  prompt: z.string(),
  name: z.string().optional(),
  size: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional(),
});

const TOOLKIT_URL = "https://toolkit.rork.com/images/generate/";

const generateImageProcedure = publicProcedure
  .input(generateImageSchema)
  .mutation(async ({ input }) => {
    console.log('[Images] Generating image with prompt:', input.prompt.substring(0, 100));
    
    try {
      const response = await fetch(TOOLKIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input.prompt,
          size: input.size || '1024x1024',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Images] Generation failed:', errorText);
        return {
          success: false,
          error: `Image generation failed: ${response.statusText}`,
        };
      }

      const data = await response.json();
      
      if (!data.image || !data.image.base64Data) {
        console.error('[Images] Invalid response from generation API');
        return {
          success: false,
          error: 'Invalid response from image generation API',
        };
      }

      const now = new Date().toISOString();
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const buffer = Buffer.from(data.image.base64Data, 'base64');
      const size = buffer.length;

      const sizeParts = (input.size || '1024x1024').split('x');
      const width = parseInt(sizeParts[0], 10);
      const height = parseInt(sizeParts[1], 10);

      const imageName = input.name || `generated_${Date.now()}.png`;

      const newImage: UserImage = {
        id: imageId,
        userId: input.userId,
        name: imageName,
        mimeType: data.image.mimeType || 'image/png',
        size,
        base64Data: data.image.base64Data,
        width,
        height,
        createdAt: now,
        updatedAt: now,
        tags: input.tags || ['ai-generated'],
        folder: input.folder,
        isGenerated: true,
        generationPrompt: input.prompt,
      };

      await db.set(`images:${input.userId}:${imageId}`, newImage);
      
      const imageIndex = await db.get<string[]>(`images:${input.userId}:index`) || [];
      imageIndex.push(imageId);
      await db.set(`images:${input.userId}:index`, imageIndex);

      console.log('[Images] Image generated and saved successfully:', imageId);
      
      return {
        success: true,
        image: newImage,
      };
    } catch (error) {
      console.error('[Images] Generation exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during image generation',
      };
    }
  });

export default generateImageProcedure;
