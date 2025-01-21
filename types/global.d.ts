// types/global.d.ts
interface Window {
    cloudinary: {
      openUploadWidget: (
        options: any,
        callback: (error: any, result: any) => void
      ) => void;
    };
  }