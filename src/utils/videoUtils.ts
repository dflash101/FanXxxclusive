export const compressVideo = async (file: File, maxSizeMB: number = 50): Promise<File> => {
  // For now, return the original file if it's under the size limit
  // Video compression would require a more complex library like FFmpeg.wasm
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }
  
  // If file is too large, reject it
  throw new Error(`Video file is too large. Maximum size is ${maxSizeMB}MB`);
};

export const validateVideoFile = (file: File): boolean => {
  const validTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime'];
  const maxSize = 100 * 1024 * 1024; // 100MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid video format. Please use MP4, WebM, or MOV files.');
  }
  
  if (file.size > maxSize) {
    throw new Error('Video file is too large. Maximum size is 100MB.');
  }
  
  return true;
};

export const generateVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Seek to 1 second or 10% of video duration, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;
    });
    
    video.addEventListener('seeked', () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      } else {
        reject(new Error('Failed to generate thumbnail'));
      }
    });
    
    video.addEventListener('error', () => {
      reject(new Error('Failed to load video for thumbnail generation'));
    });
    
    video.src = URL.createObjectURL(file);
  });
};