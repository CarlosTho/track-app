const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

interface CloudinaryResponse {
  secure_url?: string
  error?: { message: string }
}

export async function uploadMealPhoto(userId: string, file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured')
  }

  const formData = new FormData()
  formData.append('file', file)
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
