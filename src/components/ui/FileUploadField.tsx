"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Eye, FileText, ImagePlus, X } from "lucide-react";
import { FormFieldLabel } from "@/components/ui/FormFieldLabel";
import { formatFileSize, LOGO_ACCEPT, LOGO_MAX_SIZE_MB } from "@/lib/file-upload";
import { resolvePublicFileUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

function fileLabelFromPath(value?: string): string {
  if (!value) return "";
  const cleaned = value.split("?")[0].replace(/\\/g, "/");
  return cleaned.split("/").filter(Boolean).pop() || value;
}

function isPdfSource(file: File | null, existingUrl?: string, existingName?: string): boolean {
  if (file) {
    if (file.type === "application/pdf") return true;
    return file.name.toLowerCase().endsWith(".pdf");
  }

  const name = (existingName || existingUrl || "").toLowerCase().split("?")[0];
  return name.endsWith(".pdf");
}

type FileUploadFieldProps = {
  id?: string;
  name: string;
  label: string;
  required?: boolean;
  accept?: string;
  maxSizeMb?: number;
  hint?: string;
  file: File | null;
  existingUrl?: string;
  existingName?: string;
  error?: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
};

export function FileUploadField({
  id,
  name,
  label,
  required,
  accept = LOGO_ACCEPT,
  maxSizeMb = LOGO_MAX_SIZE_MB,
  hint,
  file,
  existingUrl,
  existingName,
  error,
  disabled,
  onChange,
}: FileUploadFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    if (!file) {
      setObjectUrl("");
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setObjectUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  useEffect(() => {
    setPreviewFailed(false);
  }, [existingUrl, objectUrl]);

  const previewUrl = objectUrl || resolvePublicFileUrl(existingUrl ?? "");
  const fileName =
    file?.name || fileLabelFromPath(existingName) || fileLabelFromPath(existingUrl);
  const hasFile = Boolean(file || existingUrl);
  const isPdf = isPdfSource(file, existingUrl, existingName);
  const canPreviewImage = Boolean(previewUrl) && !isPdf && !previewFailed;

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    onChange(null);
  };

  const openFile = () => {
    if (!previewUrl) return;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <FormFieldLabel htmlFor={inputId} label={label} required={required} />
      <div className={cn("file-upload", error && "is-invalid")}>
        {canPreviewImage ? (
          <img
            src={previewUrl}
            alt={`${label} preview`}
            className="file-upload-preview"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <span
            className={cn(
              "file-upload-placeholder",
              isPdf && hasFile && "file-upload-placeholder--pdf",
            )}
            aria-hidden="true"
          >
            {isPdf && hasFile ? (
              <FileText size={18} strokeWidth={2} />
            ) : (
              <ImagePlus size={18} strokeWidth={2} />
            )}
          </span>
        )}
        <div className="file-upload-meta">
          <div className="file-upload-actions">
            <label htmlFor={inputId} className="btn btn-outline-primary file-upload-choose">
              {hasFile ? "Change file" : "Choose file"}
            </label>
            {hasFile && previewUrl ? (
              <button
                type="button"
                className="btn btn-outline-primary file-upload-view"
                onClick={openFile}
                disabled={disabled}
              >
                <Eye size={14} strokeWidth={2.25} />
                {isPdf ? "View PDF" : "View"}
              </button>
            ) : null}
            {hasFile ? (
              <button
                type="button"
                className="btn btn-outline-danger file-upload-clear"
                onClick={clear}
                disabled={disabled}
              >
                <X size={14} strokeWidth={2.25} />
                Remove
              </button>
            ) : null}
          </div>
          <p className="file-upload-name">
            {fileName || "No file chosen"}
            {file ? ` · ${formatFileSize(file.size)}` : ""}
          </p>
          <p className="file-upload-hint">
            {hint ?? `JPG, JPEG, PNG, WEBP · max ${maxSizeMb} MB · optional`}
          </p>
          {error ? (
            <p className="form-field-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          className="file-upload-input"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
