import personRepository from "@/features/persons/person.repository";
import uploadRepository, {
  type MovePendingToPermanentResult,
} from "./upload.repository";

const PENDING_PATH = /^\/uploads\/pending\/([^/]+)$/;

/** Basenames we store: uuid + extension; no path segments. */
function isSafeUploadBasename(name: string): boolean {
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return false;
  }
  return /^[a-zA-Z0-9._-]+$/.test(name);
}

function parsePendingFilenameFromUrl(urlString: string): string | null {
  try {
    const u = new URL(urlString);
    const m = u.pathname.match(PENDING_PATH);
    if (!m?.[1]) {
      return null;
    }
    const decoded = decodeURIComponent(m[1]);
    if (!isSafeUploadBasename(decoded)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function permanentUrlFromOriginal(originalUrl: string, filename: string): string {
  const u = new URL(originalUrl);
  u.pathname = `/uploads/permanent/${filename}`;
  return u.toString();
}

class UploadPromotionService {
  /**
   * If `url` points at our `/uploads/pending/...` file, move it to `permanent/` and return the new URL.
   * Otherwise returns `url` unchanged.
   */
  async promoteProfilePictureUrlIfPending(
    url: string | null | undefined
  ): Promise<string | null | undefined> {
    if (url === undefined || url === null || url === "") {
      return url;
    }

    const filename = parsePendingFilenameFromUrl(url);
    if (!filename) {
      return url;
    }

    let outcome: MovePendingToPermanentResult;
    try {
      outcome = await uploadRepository.movePendingToPermanent(filename);
    } catch (error) {
      console.error("[upload-promotion] move failed:", error);
      return url;
    }

    if (outcome === "moved" || outcome === "already_permanent") {
      return permanentUrlFromOriginal(url, filename);
    }

    return url;
  }

  /**
   * Promotes pending upload for this person and persists the new URL when it changes.
   */
  async syncPersonProfilePictureUrl(personId: string, url: string | null): Promise<void> {
    if (url === null || url === "") {
      return;
    }
    const promoted = await this.promoteProfilePictureUrlIfPending(url);
    if (promoted !== url && promoted !== undefined && promoted !== null) {
      await personRepository.update(personId, { profilePictureUrl: promoted });
    }
  }
}

export default new UploadPromotionService();
