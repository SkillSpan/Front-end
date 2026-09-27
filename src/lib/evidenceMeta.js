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

// Skill glyphs are intentionally monochrome (neutral tile + dark icon) rather
// than colorful per-skill branding: color in this app is reserved for status
// semantics (success/warning/danger/revision), so skill identity is carried
// by icon shape alone — calmer, and impossible to confuse with a status hue.
const SKILL_TILE = { bg: "#F2F4F7", color: "#344054" };

export const SKILL_META = {
    Python: { ...SKILL_TILE, Icon: Terminal },
    React: { ...SKILL_TILE, Icon: Atom },
    JavaScript: { ...SKILL_TILE, Icon: Braces },
    TypeScript: { ...SKILL_TILE, Icon: FileCode2 },
    SQL: { ...SKILL_TILE, Icon: Database },
    default: { ...SKILL_TILE, Icon: Code2 },
};

export const TYPE_META = {
    github: {
        label: "GitHub Repository",
        Icon: Github,
        placeholder: "https://github.com/username/repository",
    },
    live: {
        label: "Live Deployment",
        Icon: Rocket,
        placeholder: "https://your-project.vercel.app",
    },
    design: {
        label: "Design File",
        Icon: PenTool,
        placeholder: "https://figma.com/file/...",
    },
    document: {
        label: "Document",
        Icon: FileText,
        placeholder: "",
    },
};

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

export const SEED_EVIDENCE = [{
        id: "ev-python",
        skill: "Python",
        category: "Programming & Languages",
        type: "github",
        url: "https://github.com/ahmed-khalil/data-pipeline",
        description: "A production-ready ETL data pipeline built with Python, pandas, and Apache Airflow. Processes 500K+ records daily with automated testing and CI/CD. Deployed to AWS.",
        status: "pending",
        submittedAt: "2026-08-28",
        reviewedAt: null,
        reviewer: null,
        reviewNote: null,
        level: "Lv 3/5",
        confidence: 85,
    },
    {
        id: "ev-react",
        skill: "React",
        category: "Frontend Frameworks",
        type: "live",
        url: "https://ecommerce-ahmed.vercel.app",
        description: "Full-stack e-commerce platform with React 19, Next.js, Stripe integration, and a custom design system. Includes cart, checkout, product management, and order history.",
        status: "approved",
        submittedAt: "2026-08-20",
        reviewedAt: "2026-08-22",
        reviewer: "Sarah Chen",
        reviewNote: "Excellent work! Clean component architecture, proper use of React hooks, and well-organized code. The custom design system shows real advanced-level thinking.",
        level: "Lv 4/5",
        confidence: 100,
    },
    {
        id: "ev-js",
        skill: "JavaScript",
        category: "Programming & Languages",
        type: "github",
        url: "https://github.com/ahmed-khalil/js-algorithms",
        description: "Implementation of common algorithms and data structures in vanilla JavaScript, including sorting, graph traversal, and dynamic programming problems.",
        status: "rejected",
        submittedAt: "2026-08-15",
        reviewedAt: "2026-08-17",
        reviewer: "Sarah Chen",
        reviewNote: "The code demonstrates basic understanding but lacks documentation, tests, and error handling. The implementations are incomplete. Please resubmit with proper test coverage (min 80%) and JSDoc comments.",
        level: "Lv 2/5",
        confidence: 60,
    },
    {
        id: "ev-ts",
        skill: "TypeScript",
        category: "Programming & Languages",
        type: "github",
        url: "https://github.com/ahmed-khalil/ts-api",
        description: "RESTful API built with TypeScript, Express, and Prisma ORM. Includes authentication, rate limiting, and OpenAPI documentation.",
        status: "revision",
        submittedAt: "2026-08-25",
        reviewedAt: "2026-08-27",
        reviewer: "Sarah Chen",
        reviewNote: "Good foundation! To approve this, please: (1) Enable TypeScript strict mode, (2) Add complete type definitions for all API responses, (3) Fix the 3 type errors in /src/routes/auth.ts. Resubmit when resolved.",
        level: "Lv 3/5",
        confidence: 78,
    },
    {
        id: "ev-sql",
        skill: "SQL",
        category: "Databases",
        type: "document",
        url: "database-design-report.pdf",
        description: "Comprehensive database design report including ERD diagrams, normalization analysis, query optimization report, and indexed query comparisons for a healthcare management system.",
        status: "pending",
        submittedAt: "2026-08-29",
        reviewedAt: null,
        reviewer: null,
        reviewNote: null,
        level: "Lv 3/5",
        confidence: 70,
    },
];

export function fmt(value) {
    if (!value) return "";
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function validateUrl(type, value) {
    const url = value.trim();
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

export function validateFile(file) {
    const allowed = [".pdf", ".doc", ".docx"];
    if (!file) return "Choose a file.";
    const extension = `.${file.name.split(".").pop().toLowerCase()}`;
    if (!allowed.includes(extension)) {
        return `Unsupported file type. Use ${allowed.join(", ")}.`;
    }
    if (file.size > 20 * 1024 * 1024) {
        return "File is too large. Maximum size is 20 MB.";
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