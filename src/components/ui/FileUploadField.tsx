"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { FormFieldLabel } from "@/components/ui/FormFieldLabel";
import { formatFileSize, LOGO_ACCEPT, LOGO_MAX_SIZE_MB } from "@/lib/file-upload";
import { resolvePublicFileUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

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
    file?.name ??
    existingName ??
    (existingUrl ? existingUrl.split("/").pop() : "");

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    onChange(null);
  };

  return (
    <div>
      <FormFieldLabel htmlFor={inputId} label={label} required={required} />
      <div className={cn("file-upload", error && "is-invalid")}>
        {previewUrl && !previewFailed ? (
          <img
            src={previewUrl}
            alt={`${label} preview`}
            className="file-upload-preview"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <span className="file-upload-placeholder" aria-hidden="true">
            <ImagePlus size={18} strokeWidth={2} />
          </span>
        )}
        <div className="file-upload-meta">
          <div className="file-upload-actions">
            <label htmlFor={inputId} className="btn btn-outline-primary file-upload-choose">
              {file || existingUrl ? "Change file" : "Choose file"}
            </label>
            {file || existingUrl ? (
              <button type="button" className="btn btn-outline-danger file-upload-clear" onClick={clear} disabled={disabled}>
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
