export type ImageUploadResult = {
  success: boolean;
  url?: string;
  storageId?: string;
  error?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Top-level regex for file extension replacement
const FILE_EXTENSION_REGEX = /\.[^.]+$/;

/**
 * Compress an image file using Canvas API
 * @param file - The image file to compress
 * @param maxSize - Maximum file size in bytes
 * @returns Compressed file or original if already small enough
 */
function compressImage(file: File, maxSize: number): Promise<File> {
  // If already under limit, return as-is
  if (file.size <= maxSize) {
    return Promise.resolve(file);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Start with original dimensions
      let width = img.width;
      let height = img.height;

      // Scale down large images to reduce file size
      const maxDimension = 2048;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels to get under the size limit
      const qualities = [0.8, 0.6, 0.4, 0.3, 0.2];

      const tryCompress = (qualityIndex: number): void => {
        if (qualityIndex >= qualities.length) {
          // Try scaling down if quality reduction wasn't enough
          tryScale(0, width, height);
          return;
        }

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size <= maxSize) {
              const compressedFile = new File(
                [blob],
                file.name.replace(FILE_EXTENSION_REGEX, ".jpg"),
                { type: "image/jpeg", lastModified: Date.now() }
              );
              resolve(compressedFile);
            } else {
              tryCompress(qualityIndex + 1);
            }
          },
          "image/jpeg",
          qualities[qualityIndex]
        );
      };

      const scaleFactors = [0.75, 0.5, 0.25];

      const tryScale = (
        scaleIndex: number,
        origWidth: number,
        origHeight: number
      ): void => {
        if (scaleIndex >= scaleFactors.length) {
          // Last resort: return smallest attempt
          canvas.toBlob(
            (finalBlob) => {
              if (finalBlob) {
                const compressedFile = new File(
                  [finalBlob],
                  file.name.replace(FILE_EXTENSION_REGEX, ".jpg"),
                  { type: "image/jpeg", lastModified: Date.now() }
                );
                resolve(compressedFile);
              } else {
                reject(new Error("Failed to compress image"));
              }
            },
            "image/jpeg",
            0.5
          );
          return;
        }

        const scale = scaleFactors[scaleIndex];
        const scaledWidth = Math.round(origWidth * scale);
        const scaledHeight = Math.round(origHeight * scale);
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size <= maxSize) {
              const compressedFile = new File(
                [blob],
                file.name.replace(FILE_EXTENSION_REGEX, ".jpg"),
                { type: "image/jpeg", lastModified: Date.now() }
              );
              resolve(compressedFile);
            } else {
              tryScale(scaleIndex + 1, origWidth, origHeight);
            }
          },
          "image/jpeg",
          0.7
        );
      };

      tryCompress(0);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate an image file
 * @param file - The image file to validate
 * @returns Error message if invalid, null if valid
 */
function validateImageFile(file: File): string | null {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!validTypes.includes(file.type)) {
    return "Invalid file type. Only JPEG, PNG, GIF, and WebP images are supported.";
  }
  return null;
}

/**
 * Upload an image file to Convex storage
 * @param file - The image file to upload
 * @param generateUploadUrl - Function to generate Convex upload URL
 * @returns Result object with success status and URL or error
 */
export async function uploadNoteImage(
  file: File,
  generateUploadUrl: () => Promise<string>
): Promise<ImageUploadResult> {
  try {
    // Validate file type
    const validationError = validateImageFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Compress image if over size limit
    let fileToUpload = file;
    if (file.size > MAX_FILE_SIZE) {
      try {
        fileToUpload = await compressImage(file, MAX_FILE_SIZE);
      } catch {
        return {
          success: false,
          error: "Failed to compress image. Please try a smaller file.",
        };
      }
    }

    // Get upload URL from Convex
    const uploadUrl = await generateUploadUrl();

    // Upload the file to Convex storage
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": fileToUpload.type },
      body: fileToUpload,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Upload failed: ${response.statusText}`,
      };
    }

    const { storageId } = (await response.json()) as { storageId: string };

    // Construct the URL from the storage ID
    // Convex storage URLs follow a predictable pattern
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return { success: false, error: "Convex URL not configured" };
    }

    // Extract the deployment URL and construct the storage URL
    // Convex storage URLs are: https://<deployment>.convex.cloud/api/storage/<storageId>
    const url = `${convexUrl.replace(".cloud/", ".site/")}/api/storage/${storageId}`;

    return { success: true, url, storageId };
  } catch (error) {
    console.error("Unexpected error during upload:", error);
    return {
      success: false,
      error: "An unexpected error occurred during upload.",
    };
  }
}

/**
 * Extract image from clipboard paste event
 * @param event - The clipboard event
 * @returns Image file if found, null otherwise
 */
export function getImageFromClipboard(event: ClipboardEvent): File | null {
  const items = event.clipboardData?.items;
  if (!items) {
    return null;
  }

  for (const item of Array.from(items)) {
    if (item.type.indexOf("image") !== -1) {
      return item.getAsFile();
    }
  }

  return null;
}

/**
 * Insert markdown image syntax at cursor position
 * @param textarea - The textarea element
 * @param imageUrl - The URL of the uploaded image
 * @param altText - Alt text for the image (optional)
 */
export function insertImageMarkdown(
  textarea: HTMLTextAreaElement,
  imageUrl: string,
  altText = "image"
): void {
  const cursorPos = textarea.selectionStart;
  const textBefore = textarea.value.substring(0, cursorPos);
  const textAfter = textarea.value.substring(cursorPos);

  // Add newlines if not at start of line
  const needsNewlineBefore =
    textBefore.length > 0 && !textBefore.endsWith("\n");
  const needsNewlineAfter = textAfter.length > 0 && !textAfter.startsWith("\n");

  const imageMarkdown = `${needsNewlineBefore ? "\n" : ""}![${altText}](${imageUrl})${needsNewlineAfter ? "\n" : ""}`;

  const newValue = textBefore + imageMarkdown + textAfter;
  textarea.value = newValue;

  // Trigger input event to update React state
  const inputEvent = new Event("input", { bubbles: true });
  textarea.dispatchEvent(inputEvent);

  // Move cursor to end of inserted markdown
  const newCursorPos = cursorPos + imageMarkdown.length;
  textarea.setSelectionRange(newCursorPos, newCursorPos);
  textarea.focus();
}
