import { createUploadthing, type FileRouter } from 'uploadthing/express';

const f = createUploadthing();

export const uploadRouter = {
  courseMaterialUploader: f({
    pdf: { maxFileSize: '32MB', maxFileCount: 5 },
    text: { maxFileSize: '16MB', maxFileCount: 5 },
    blob: { maxFileSize: '64MB', maxFileCount: 5 },
  })
    .middleware(async () => {
      return { uploadedAt: new Date().toISOString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Uploadthing completed upload:', file.name, file.url);
      return {
        url: file.url,
        name: file.name,
        size: file.size,
        key: file.key,
        uploadedAt: metadata.uploadedAt,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
