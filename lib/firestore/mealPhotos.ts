import imageCompression from 'browser-image-compression'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

interface CloudinaryResponse {
  secure_url?: string
  error?: { message: string }
}

async function compressForUpload(file: File): Promise<File> {
  // Skip compression for tiny files — not worth the CPU cost.
  if (file.size < 300 * 1024) return file
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      initialQuality: 0.82,
      fileType: 'image/jpeg',
    })
    // If compression somehow made it bigger, keep the original.
    return compressed.size < file.size ? compressed : file
  } catch (err) {
    console.warn('Image compression failed, uploading original:', err)
    return file
  }
}

export async function uploadMealPhoto(userId: string, file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured')
  }

  const prepared = await compressForUpload(file)

  const formData = new FormData()
  formData.append('file', prepared)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', `meal-photos/${userId}`)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  const json = (await res.json()) as CloudinaryResponse

  if (!res.ok || !json.secure_url) {
    throw new Error(json.error?.message || 'Upload failed')
  }

  return json.secure_url
}
