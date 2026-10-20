import {
    Atom,
    Braces,
    CheckCircle2,
    Clock3,
    Code2,
    Database,
    FileCode2,
    FileText,
    Github,
    PenTool,
    RotateCcw,
    Rocket,
    Terminal,
    XCircle,
} from "lucide-react";

const SKILL_TILE = { bg: "#F2F4F7", color: "#344054" };

export const SKILL_META = {
    Python: {...SKILL_TILE, Icon: Terminal },
    React: {...SKILL_TILE, Icon: Atom },
    JavaScript: {...SKILL_TILE, Icon: Braces },
    TypeScript: {...SKILL_TILE, Icon: FileCode2 },
    SQL: {...SKILL_TILE, Icon: Database },
    default: {...SKILL_TILE, Icon: Code2 },
};

// label    = name shown on the type card (icon tile)
// urlLabel = label shown above the URL input (follows the selected type)
// mode     = default tab (url / file) when the type is clicked
// accept   = allowed file extensions when submitted as a file
//
// `accept` must stay inside what `Api\EvidenceController` validates:
//   'evidence_file' => 'mimes:pdf,jpg,jpeg,png,webp', 'max:10000'
// `mimes` checks the content-guessed type, so .doc/.docx/.zip/.fig were being
// offered here and rejected with a 422 by the API. Keep the two lists identical.
export const TYPE_META = {
    github: {
        label: "GitHub Repository",
        urlLabel: "GitHub Repository URL",
        Icon: Github,
        placeholder: "https://github.com/username/repository",
        mode: "url",
    },
    live: {
        label: "Live Deployment",
        urlLabel: "Live Deployment URL",
        Icon: Rocket,
        placeholder: "https://your-project.vercel.app",
        mode: "url",
    },
    design: {
        label: "Design File",
        urlLabel: "Design File URL",
        Icon: PenTool,
        placeholder: "https://figma.com/file/...",
        mode: "url",
        accept: [".pdf", ".png", ".jpg", ".jpeg", ".webp"],
        fileHint: "PDF, PNG, JPG or WebP · up to 10 MB",
    },
    document: {
        label: "Document",
        urlLabel: "Document URL",
        Icon: FileText,
        placeholder: "",
        mode: "file",
        accept: [".pdf", ".png", ".jpg", ".jpeg", ".webp"],
        fileHint: "PDF, PNG, JPG or WebP · up to 10 MB",
    },
};

// Mirrors the API's `max:10000` (KB).
export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
export const MAX_EVIDENCE_DESCRIPTION = 500;

export const STATUS_META = {
    pending: {
        label: "Pending Review",
        Icon: Clock3,
        badge: "border-[#fedf89] bg-[#fffaeb] text-[#b54708]",
        panel: "border-[#fedf89] bg-[#fffaeb] text-[#b54708]",
        tabActive: "bg-[#fffaeb] text-[#b54708] border-[#fedf89]",
    },
    approved: {
        label: "Approved",
        Icon: CheckCircle2,
        badge: "border-[#abefc6] bg-[#ecfdf3] text-[#087443]",
        panel: "border-[#abefc6] bg-[#ecfdf3] text-[#087443]",
        tabActive: "bg-[#ecfdf3] text-[#087443] border-[#abefc6]",
    },
    rejected: {
        label: "Rejected",
        Icon: XCircle,
        badge: "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
        panel: "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
        tabActive: "bg-[#fef3f2] text-[#b42318] border-[#fecdca]",
    },
    revision: {
        label: "Revision Requested",
        Icon: RotateCcw,
        badge: "border-[#d9d6fe] bg-[#f4f3ff] text-[#5925dc]",
        panel: "border-[#d9d6fe] bg-[#f4f3ff] text-[#5925dc]",
        tabActive: "bg-[#f4f3ff] text-[#5925dc] border-[#d9d6fe]",
    },
};


export function fmt(value) {
    if (!value) return "";
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function isHttpUrl(value) {
    try {
        const parsed = new URL(String(value || "").trim());
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return false;
    }
}

export function validateUrl(type, value) {
    const url = String(value || "").trim();
    if (!url) return "Enter a URL.";

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return "That doesn't look like a valid URL.";
    }

    if (parsed.protocol !== "https:") return "URL must start with https://.";
    if (type === "github" && !/github\.com\//i.test(url)) {
        return "Enter a GitHub repository URL.";
    }
    if (type === "design" && !/(figma|adobe)\.com\//i.test(url)) {
        return "Enter a Figma or Adobe XD design file URL.";
    }
    return "";
}

export function validateFile(file, type) {
    const meta = TYPE_META[type];
    const allowed = (meta && meta.accept) || [".pdf"];
    if (!file) return "Choose a file.";
    const extension = `.${file.name.split(".").pop().toLowerCase()}`;
    if (!allowed.includes(extension)) {
        return `Unsupported file type. Use ${allowed.join(", ")}.`;
    }
    if (file.size > MAX_EVIDENCE_BYTES) {
        return "File is too large. Maximum size is 10 MB.";
    }
    return "";
}

export function getAfterApproval(confidence) {
    return Math.min(Number(confidence || 0) + 15, 100);
}

export function truncate(value, length = 100) {
    if (!value) return "";
    return value.length > length ? `${value.slice(0, length).trim()}...` : value;
}