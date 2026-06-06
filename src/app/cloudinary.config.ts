/**
 * Cloudinary configuration for free image uploads from the admin dashboard.
 *
 * How to fill this in (free, no credit card):
 *   1. Create a free account at https://cloudinary.com
 *   2. On the Dashboard, copy your "Cloud name" → paste it below.
 *   3. Go to Settings → Upload → "Add upload preset".
 *        - Signing Mode: Unsigned
 *        - (optional) Folder: rbv
 *      Save it and copy the preset name → paste it below.
 *
 * Uploads use the unsigned preset, so no secret keys live in the frontend.
 * Until both values are set, the dashboard falls back to pasting an image URL.
 */
export const CLOUDINARY_CLOUD_NAME = 'dsplzpnpn';
export const CLOUDINARY_UPLOAD_PRESET = 'wrlgpu1o';
