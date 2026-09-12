import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from '@uploadthing/react';

import type { OurFileRouter } from '../../server/uploadthing';

export const UploadButton = generateUploadButton<OurFileRouter>({
  url: '/api/uploadthing',
});
export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: '/api/uploadthing',
});
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>({
  url: '/api/uploadthing',
});

