/**
 * Reusable parsing and formatting of API validation errors (422-style).
 * Format: { error: string, issues: { path: string, message: string }[] }
 */

export type ValidationIssue = { path: string | string[]; message: string };

export type ApiValidationErrorBody = {
  error?: string;
  issues?: ValidationIssue[];
};

/** Human-readable labels for common API field paths (extend as needed). */
const FIELD_LABELS: Record<string, string> = {
  locationId: "Location",
  skillId: "Skill",
  startTime: "Start time",
  endTime: "End time",
  headcount: "Headcount",
};

function getFieldLabel(path: string): string {
  return FIELD_LABELS[path] ?? path;
}

/** Get message from an issue object (different APIs use different keys). */
function getIssueMessage(issue: Record<string, unknown>): string | null {
  const msg = issue.message ?? issue.msg ?? issue.error;
  return typeof msg === "string" ? msg : null;
}

/** Get path as string from an issue (may be string or array). */
function getIssuePath(issue: Record<string, unknown>): string {
  const p = issue.path;
  if (typeof p === "string") return p;
  if (Array.isArray(p) && p.length > 0) return typeof p[p.length - 1] === "string" ? p[p.length - 1] : String(p[0]);
  return "";
}

/**
 * Parse 422-style validation error body into a summary message and per-field errors.
 * Handles { error, issues } and common variants (issues may be under details/errors).
 */
export function parseValidationError(body: unknown): {
  message: string;
  byPath: Record<string, string>;
} {
  const byPath: Record<string, string> = {};
  if (!body || typeof body !== "object") {
    return { message: "Validation failed", byPath };
  }
  const data = body as Record<string, unknown>;
  const summary = typeof data.error === "string" ? data.error : "Validation failed";
  const rawIssues = data.issues ?? data.details ?? data.errors;
  const issues = Array.isArray(rawIssues) ? rawIssues : [];
  const lines: string[] = [];
  for (const raw of issues) {
    if (!raw || typeof raw !== "object") continue;
    const issue = raw as Record<string, unknown>;
    const msg = getIssueMessage(issue);
    if (!msg) continue;
    const path = getIssuePath(issue);
    const key = path || "form";
    byPath[key] = msg;
    const label = path ? getFieldLabel(path) : "Form";
    lines.push(`${label}: ${msg}`);
  }
  const message = lines.length > 0 ? `${summary}\n\n${lines.join("\n")}` : summary;
  return { message, byPath };
}

/**
 * Error subclass that carries validation issue details for form display.
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly byPath: Record<string, string> = {}
  ) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export function isValidationError(e: unknown): e is ValidationError {
  return e instanceof ValidationError;
}
