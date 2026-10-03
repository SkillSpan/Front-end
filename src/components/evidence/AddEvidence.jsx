import { useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  Link2,
  Loader2,
  Paperclip,
} from "lucide-react";

import {
  SEED_EVIDENCE,
  TYPE_META,
  isHttpUrl,
  validateFile,
  validateUrl,
} from "./lib/evidenceMeta";

import { TypeIcon } from "./Shared";

export default function AddEvidence({
  skill = SEED_EVIDENCE[0],
  resubmitRecord = null,
  onCancel = () => {},
  onSubmit = () => {},
}) {
  const isResubmit = Boolean(resubmitRecord);
  const activeSkill = resubmitRecord || skill || SEED_EVIDENCE[0];

  const resubmitWasFile =
    isResubmit &&
    TYPE_META[resubmitRecord.type]?.mode === 'file' &&
    !isHttpUrl(resubmitRecord.url);

  const previousFileName = resubmitWasFile
    ? String(resubmitRecord.url || "").split("/").pop()
    : "";

  /*
   * IMPORTANT:
   * Evidence Type is the source of truth.
   *
   * github -> url
   * live   -> url
   * design -> file
   * document -> file
   */
  const [evidenceType, setEvidenceType] = useState(
    isResubmit ? resubmitRecord.type : "live"
  );

  const [mode, setMode] = useState(
    resubmitWasFile ? "file" : "url"
  );

  const [url, setUrl] = useState(
    isResubmit && !resubmitWasFile
      ? resubmitRecord.url
      : ""
  );

  const [file, setFile] = useState(null);

  const [description, setDescription] = useState(
    isResubmit ? resubmitRecord.description : ""
  );

  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fileInputRef = useRef(null);

  const meta =
    TYPE_META[evidenceType] || TYPE_META.document;

  const fileExtensions = meta.fileExtensions || [];

  /*
   * Determines the correct input mode automatically.
   */
  function getModeForType(type) {
    return TYPE_META[type]?.mode === 'file'
      ? "file"
      : "url";
  }

  /*
   * File selection.
   */
  function chooseFile(nextFile) {
    if (!nextFile) {
      setFile(null);
      return;
    }

    const error = validateFile(
      nextFile,
      evidenceType
    );

    if (error) {
      setFile(null);

      setErrors((current) => ({
        ...current,
        file: error,
      }));

      return;
    }

    setFile(nextFile);

    setErrors((current) => ({
      ...current,
      file: "",
    }));

    setSubmitError("");
  }

  /*
   * Evidence Type selection.
   *
   * THIS IS THE MAIN FIX.
   */
  function selectType(type) {
    const nextMode = getModeForType(type);

    setEvidenceType(type);
    setMode(nextMode);

    /*
     * If we are switching to file evidence,
     * remove the previous URL.
     */
    if (nextMode === "file") {
      setUrl("");
    }

    /*
     * If we are switching to URL evidence,
     * remove the previous file.
     */
    if (nextMode === "url") {
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }

    setErrors((current) => ({
      ...current,
      url: "",
      file: "",
    }));

    setSubmitError("");
  }

  /*
   * Top tabs.
   *
   * They are synchronized with Evidence Type.
   */
  function selectMode(nextMode) {
    if (nextMode === "file") {
      /*
       * If current evidence type is not a file type,
       * switch to Document as the default file type.
       */
      if (TYPE_META[evidenceType]?.mode !== 'file') {
        setEvidenceType("document");
      }

      setMode("file");
      setUrl("");

      setErrors((current) => ({
        ...current,
        url: "",
        file: "",
      }));

      return;
    }

    /*
     * Reference URL mode.
     *
     * If currently on a file evidence type,
     * switch to Live Deployment.
     */
    if (TYPE_META[evidenceType]?.mode === 'file') {
      setEvidenceType("live");
    }

    setMode("url");
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setErrors((current) => ({
      ...current,
      url: "",
      file: "",
    }));

    setSubmitError("");
  }

  /*
   * Submit Evidence.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    const nextErrors = {};

    /*
     * URL validation.
     */
    if (mode === "url") {
      const error = validateUrl(
        evidenceType,
        url
      );

      if (error) {
        nextErrors.url = error;
      }
    }

    /*
     * File validation.
     */
    if (mode === "file") {
      const error = validateFile(
        file,
        evidenceType
      );

      if (error) {
        nextErrors.file = error;
      }
    }

    /*
     * Description validation.
     */
    if (description.trim().length < 50) {
      nextErrors.description =
        "Describe what this evidence demonstrates (at least 50 characters).";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      await onSubmit({
        id: isResubmit
          ? resubmitRecord.id
          : null,

        skill: activeSkill.skill,

        skillId: activeSkill.skillId,

        category: activeSkill.category,

        /*
         * IMPORTANT:
         * The selected evidence type is sent exactly.
         */
        type: evidenceType,

        /*
         * URL evidence:
         * send the URL.
         *
         * File evidence:
         * send the filename as URL/reference
         * and the actual File object separately.
         */
        url:
          mode === "file"
            ? file.name
            : url.trim(),

        /*
         * IMPORTANT:
         * Send the REAL File object.
         */
        evidence_file:
          mode === "file"
            ? file
            : undefined,

        description:
          description.trim(),

        confidence:
          activeSkill.confidence,

        level:
          activeSkill.level,

        status: "pending",
      });
    } catch (error) {
      setSubmitError(
        error?.message ||
          "Something went wrong while submitting. Please try again."
      );

      if (error?.fieldErrors) {
        setErrors((current) => ({
          ...current,
          ...error.fieldErrors,
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    (
      mode === "url"
        ? url.trim().length > 5
        : Boolean(file)
    ) &&
    description.trim().length >= 50;

  const modeTabs = [
    ["url", "Reference URL", Link2],
    ["file", "File Upload", Paperclip],
  ];

  return (
    <div className="flex flex-col">
      <div className="flex flex-1 flex-col lg:flex-row">
        <section className="min-w-0 flex-1">
          <div className="mx-auto max-w-[820px]">

            {/* HEADER */}
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h1 className="figma-title text-[18px]">
                  {isResubmit
                    ? "Resubmit Evidence"
                    : "Add Evidence"}
                </h1>

                <p className="figma-subtitle">
                  {isResubmit
                    ? "Update your evidence based on the reviewer’s notes, then resubmit for review."
                    : `Submit proof of your ${activeSkill.skill} proficiency — a reviewer will verify and update your confidence score.`}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="figma-card p-5 sm:p-7"
            >

              {/* TITLE */}
              <div className="mb-7 flex items-center justify-between border-b border-[#f0f2f5] pb-5">
                <div>
                  <h2 className="m-0 text-sm font-semibold text-[#101828]">
                    Evidence details
                  </h2>

                  <p className="m-0 mt-1 text-xs text-[#667085]">
                    Choose one way to share your work.
                  </p>
                </div>

                <span className="text-[11px] text-[#98a2b3]">
                  Required fields *
                </span>
              </div>

              {/* MODE TABS */}
              <div
                className="mb-7 inline-flex rounded-lg border border-[#e4e7ec] bg-white p-0"
                role="tablist"
                aria-label="Evidence submission method"
              >
                {modeTabs.map(
                  ([key, label, Icon]) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={
                        mode === key
                      }
                      onClick={() =>
                        selectMode(key)
                      }
                      className={`inline-flex min-h-9 items-center gap-2 rounded-md px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]/40 ${
                        mode === key
                          ? "bg-[#101010] text-white"
                          : "text-[#667085] hover:text-[#344054]"
                      }`}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  )
                )}
              </div>

              {/* EVIDENCE TYPES */}
              <div className="mb-7">
                <p className="mb-3 text-xs font-semibold text-[#344054]">
                  Evidence type
                </p>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">

                  {Object.entries(TYPE_META).map(
                    ([type, typeMeta]) => {

                      const active =
                        evidenceType === type;

                      return (
                        <button
                          key={type}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            selectType(type)
                          }
                          className={`group flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-lg border px-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]/40 ${
                            active
                              ? "border-[#101010] bg-[#eef3ff]"
                              : "border-[#e4e7ec] bg-white hover:border-[#b8c7f7] hover:bg-[#f9fbff]"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              active
                                ? "bg-white text-[#2f5bea]"
                                : "bg-[#f2f4f7] text-[#667085]"
                            }`}
                          >
                            <TypeIcon
                              type={type}
                              size={18}
                            />
                          </span>

                          <span
                            className={`text-[11px] font-medium ${
                              active
                                ? "text-[#2348c5]"
                                : "text-[#344054]"
                            }`}
                          >
                            {typeMeta.label}
                          </span>
                        </button>
                      );
                    }
                  )}

                </div>
              </div>

              {/* =========================
                  URL INPUT
                 ========================= */}
              {mode === "url" && (
                <div className="mb-7">

                  <label
                    htmlFor="evidence-url"
                    className="mb-2 block text-xs font-semibold text-[#344054]"
                  >
                    {meta.urlLabel}

                    <span className="text-[#d92d20]">
                      {" "}*
                    </span>
                  </label>

                  <input
                    id="evidence-url"
                    type="url"
                    value={url}
                    onChange={(event) => {
                      setUrl(
                        event.target.value
                      );

                      setErrors(
                        (current) => ({
                          ...current,
                          url: "",
                        })
                      );
                    }}
                    placeholder={
                      meta.placeholder
                    }
                    className={`figma-input h-11 px-3 text-sm ${
                      errors.url
                        ? "border-[#f04438]"
                        : ""
                    }`}
                  />

                  {errors.url && (
                    <p className="mt-2 text-xs text-[#b42318]">
                      {errors.url}
                    </p>
                  )}

                </div>
              )}

              {/* =========================
                  FILE UPLOAD
                 ========================= */}
              {mode === "file" && (
                <div className="mb-7">

                  <label
                    htmlFor="evidence-file"
                    className="mb-2 block text-xs font-semibold text-[#344054]"
                  >
                    {meta.fileLabel ||
                      "Upload file"}

                    <span className="text-[#d92d20]">
                      {" "}*
                    </span>
                  </label>

                  <div
                    role="button"
                    tabIndex={0}

                    onClick={() =>
                      fileInputRef.current?.click()
                    }

                    onKeyDown={(event) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        fileInputRef.current?.click();
                      }
                    }}

                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}

                    onDragLeave={() =>
                      setIsDragging(false)
                    }

                    onDrop={(event) => {
                      event.preventDefault();

                      setIsDragging(false);

                      chooseFile(
                        event.dataTransfer.files?.[0]
                      );
                    }}

                    className={`flex min-h-[184px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]/40 ${
                      errors.file
                        ? "border-[#f04438] bg-[#fffbfa]"
                        : isDragging
                        ? "border-[#2f5bea] bg-[#eef3ff]"
                        : "border-[#d0d5dd] bg-[#fcfcfd] hover:border-[#2f5bea] hover:bg-[#f9fbff]"
                    }`}
                  >

                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#eef3ff] text-[#2f5bea]">
                      <Paperclip size={18} />
                    </span>

                    <p className="m-0 text-sm font-medium text-[#344054]">
                      {file
                        ? file.name
                        : "Drag & drop or click to upload"}
                    </p>

                    <p className="m-0 mt-1 text-xs text-[#98a2b3]">
                      {meta.fileHint}
                    </p>

                    {!file &&
                      previousFileName && (
                        <p className="m-0 mt-2 text-xs text-[#667085]">
                          Previously submitted:{" "}
                          {previousFileName}.
                          Choose the file again
                          to resubmit.
                        </p>
                      )}

                  </div>

                  <input
                    ref={fileInputRef}
                    id="evidence-file"
                    type="file"
                    accept={fileExtensions.join(",")}
                    className="hidden"
                    onChange={(event) =>
                      chooseFile(
                        event.target.files?.[0]
                      )
                    }
                  />

                  {errors.file && (
                    <p className="mt-2 text-xs text-[#b42318]">
                      {errors.file}
                    </p>
                  )}

                </div>
              )}

              {/* DESCRIPTION */}
              <div className="mb-6">

                <div className="flex items-center justify-between gap-3">

                  <label
                    htmlFor="evidence-description"
                    className="mb-2 block text-xs font-semibold text-[#344054]"
                  >
                    Evidence description{" "}
                    <span className="text-[#d92d20]">
                      *
                    </span>
                  </label>

                  <span className="text-[11px] text-[#98a2b3]">
                    {description.length} / min
                    50 chars
                  </span>

                </div>

                <textarea
                  id="evidence-description"
                  value={description}
                  onChange={(event) => {
                    setDescription(
                      event.target.value
                    );

                    setErrors(
                      (current) => ({
                        ...current,
                        description: "",
                      })
                    );
                  }}
                  rows={5}
                  placeholder="Describe what this evidence demonstrates — what you built, the technologies used, your specific contribution, and the scale or complexity of the project..."
                  className={`figma-input resize-y px-3 py-3 text-sm leading-6 ${
                    errors.description
                      ? "border-[#f04438]"
                      : ""
                  }`}
                />

                {errors.description ? (
                  <p className="mt-2 text-xs text-[#b42318]">
                    {errors.description}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-[#98a2b3]">
                    Tip: Include technologies,
                    scale, your specific role,
                    and any measurable
                    outcomes.
                  </p>
                )}

              </div>

              {/* INFO */}
              <div className="mb-7 flex gap-2.5 rounded-lg border border-[#d9e5ff] bg-[#f5f8ff] px-3.5 py-3 text-xs leading-5 text-[#344054]">

                <Check
                  size={15}
                  className="mt-0.5 shrink-0 text-[#2f5bea]"
                />

                <p className="m-0">
                  <span className="font-semibold">
                    AC-01 / BR-01:
                  </span>{" "}
                  This evidence will be
                  linked to your{" "}
                  {activeSkill.skill} skill
                  record and associated with
                  your learner profile. New
                  submissions enter{" "}
                  <code>
                    pending_review
                  </code>{" "}
                  status (BR-04).
                </p>

              </div>

              {/* ERROR */}
              {submitError && (
                <div className="mb-5 flex items-start gap-2 rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3.5 py-3 text-xs leading-5 text-[#b42318]">

                  <AlertTriangle
                    size={15}
                    className="mt-0.5 shrink-0"
                  />

                  <p className="m-0">
                    {submitError}
                  </p>

                </div>
              )}

              {/* BUTTONS */}
              <div className="flex flex-col-reverse gap-2.5 border-t border-[#f0f2f5] pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="figma-btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    !canSubmit ||
                    isSubmitting
                  }
                  className={`figma-btn-primary ${
                    !canSubmit ||
                    isSubmitting
                      ? "opacity-40"
                      : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                      Submitting…
                    </>
                  ) : (
                    <>
                      {isResubmit
                        ? "Resubmit for review"
                        : "Submit for review"}

                      <ChevronLeft
                        className="rotate-180"
                        size={14}
                      />
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        </section>
      </div>
    </div>
  );
}