type FormFieldLabelProps = {
  htmlFor: string;
  label: string;
  required?: boolean;
};

export function FormFieldLabel({ htmlFor, label, required }: FormFieldLabelProps) {
  return (
    <label className="form-field-label" htmlFor={htmlFor}>
      {label}
      {required ? <span className="field-required">*</span> : null}
    </label>
  );
}
