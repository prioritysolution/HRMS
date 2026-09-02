import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { resolvePublicFileUrl } from "@/lib/env";
import type { HrmsRow } from "@/types/hrms";
import type {
  EmployeeDetail,
  EmployeeRecord,
  EmployeeCreatePayload,
  EmployeeUpdatePayload,
} from "@/lib/api/types";

const EMPLOYEE_PHOTO_FOLDER = "storage/employees/photos";

function getEmployeePhotoFile(row: HrmsRow): File | null {
  return row.Photo instanceof File ? row.Photo : null;
}

function normalizeStoredPhotoPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;

  try {
    const pathname = new URL(trimmed).pathname.replace(/^\/+/, "");
    const storageIndex = pathname.indexOf("storage/");
    return storageIndex >= 0 ? pathname.slice(storageIndex) : trimmed;
  } catch {
    return trimmed;
  }
}

function applyEmployeePhotoFields(
  row: HrmsRow,
  payload: EmployeeCreatePayload | EmployeeUpdatePayload,
): void {
  const photoFile = getEmployeePhotoFile(row);

  if (photoFile) {
    payload.photo = photoFile;
    return;
  }

  if (row.Photo_path !== undefined) {
    const photoPath = normalizeStoredPhotoPath(optionalText(row.Photo_path));
    if (photoPath) {
      payload.photo_path = photoPath;
    }
  }
}

/**
 * Convert unknown value to a plain object.
 */
function asRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

/**
 * Read the first available value from a set of keys.
 * This keeps the service tolerant of backend casing
 * differences without spreading that logic through UI code.
 */
function readValue(
  record: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const key of keys) {
    if (
      record[key] !== undefined &&
      record[key] !== null
    ) {
      return record[key];
    }
  }

  return undefined;
}

/**
 * Convert optional API value to string.
 */
function optionalText(
  value: unknown,
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

/**
 * Build the employee name shown in lists and sent as display_name.
 * Prefer first/middle/last so list updates when legal name changes.
 */
function composeEmployeeDisplayName(parts: {
  firstName?: unknown;
  middleName?: unknown;
  lastName?: unknown;
  displayName?: unknown;
}): string {
  const composed = [
    optionalText(parts.firstName),
    optionalText(parts.middleName),
    optionalText(parts.lastName),
  ]
    .filter(Boolean)
    .join(" ");

  return composed || optionalText(parts.displayName);
}

/**
 * Convert value to an array of numbers (handles comma-separated).
 */
function parseMultipleIds(value: unknown): number[] {
  if (value === undefined || value === null) return [];
  if (typeof value === "number") return Number.isFinite(value) ? [value] : [];
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  }
  return [];
}

/**
 * Convert value to nullable number.
 */
function nullableNumber(
  value: unknown,
): number | null {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}

/**
 * Safely extracts a numeric ID, preferring the UI field over the old backend field.
 */
function extractId(uiField: unknown, backendId: unknown): number | null {
  const parsedUI = nullableNumber(uiField);
  if (parsedUI !== null) return parsedUI;
  return nullableNumber(backendId);
}

/**
 * Safely extracts multiple IDs, preferring the UI field over the old backend field.
 */
function extractIds(uiField: unknown, backendId: unknown): number[] {
  const parsedUI = parseMultipleIds(uiField);
  if (parsedUI.length > 0) return parsedUI;
  return parseMultipleIds(backendId);
}

/**
 * Convert backend Status to UI label.
 */
function statusLabel(
  value: unknown,
): "Active" | "Inactive" {
  if (
    value === 0 ||
    value === "0" ||
    value === false
  ) {
    return "Inactive";
  }

  if (
    typeof value === "string" &&
    value.trim().toLowerCase() ===
    "inactive"
  ) {
    return "Inactive";
  }

  return "Active";
}

/**
 * Parse employee list response.
 *
 * Supports:
 *   data: []
 * and a raw [] response.
 */
function asEmployeeList(
  payload: unknown,
): EmployeeRecord[] {
  if (Array.isArray(payload)) {
    return payload as EmployeeRecord[];
  }

  const record = asRecord(payload);

  if (!record) {
    return [];
  }

  if (Array.isArray(record.data)) {
    return record.data as EmployeeRecord[];
  }

  return [];
}

/**
 * Parse a single employee from create/update/detail envelopes.
 */
function asSingleEmployeeRecord(
  payload: unknown,
): EmployeeRecord | null {
  const records = asEmployeeList(payload);
  if (records.length > 0) {
    return records[0];
  }

  const record = asRecord(payload);
  if (!record) {
    return null;
  }

  const data = asRecord(record.data) ?? record;
  const nestedEmployee = asRecord(data.employee);

  if (nestedEmployee) {
    return nestedEmployee as unknown as EmployeeRecord;
  }

  if (
    readValue(data, ["Employee_id", "employee_id", "id"]) !==
    undefined
  ) {
    return data as unknown as EmployeeRecord;
  }

  if (
    readValue(record, ["Employee_id", "employee_id", "id"]) !==
    undefined
  ) {
    return record as unknown as EmployeeRecord;
  }

  return null;
}

function employeeRowFromSaveResponse(
  payload: unknown,
  fallbackRow: HrmsRow,
  employeeId?: number,
): HrmsRow {
  const parsed = asSingleEmployeeRecord(payload);

  if (parsed) {
    return employeeToRow(parsed);
  }

  const resolvedId =
    employeeId ??
    Number(fallbackRow.Employee_id ?? fallbackRow.id ?? 0);

  return {
    ...fallbackRow,
    id: String(resolvedId || fallbackRow.id || ""),
    Employee_id: resolvedId || Number(fallbackRow.Employee_id ?? 0),
    Display_name:
      composeEmployeeDisplayName({
        firstName: fallbackRow.First_name,
        middleName: fallbackRow.Middle_name,
        lastName: fallbackRow.Last_name,
        displayName: fallbackRow.Display_name,
      }) || String(fallbackRow.Employee_code ?? "Employee"),
  };
}

/**
 * Parse employee detail response.
 *
 * Documented API:
 *
 * {
 *   employee: {...},
 *   banks: [...],
 *   identifications: [...],
 *   statutory: {...}
 * }
 */
function asEmployeeDetail(
  payload: unknown,
): EmployeeDetail {
  const record = asRecord(payload);

  if (!record) {
    throw new Error(
      "Invalid employee detail response.",
    );
  }

  const data =
    asRecord(record.data) ?? record;

  const employee =
    asRecord(data.employee);

  if (!employee) {
    throw new Error(
      "Employee detail response does not contain employee data.",
    );
  }

  const banks = Array.isArray(data.banks)
    ? data.banks
    : [];

  const identifications =
    Array.isArray(
      data.identifications,
    )
      ? data.identifications
      : [];

  const statutory =
    data.statutory &&
      typeof data.statutory ===
      "object" &&
      !Array.isArray(data.statutory)
      ? data.statutory
      : null;

  return {
    employee:
      employee as unknown as EmployeeDetail["employee"],

    banks:
      banks as EmployeeDetail["banks"],

    identifications:
      identifications as EmployeeDetail[
      "identifications"
      ],

    statutory:
      statutory as EmployeeDetail["statutory"],
  };
}

/**
 * API employee record -> project HrmsRow.
 *
 * No separate mapper file is required.
 */
export function employeeToRow(
  record: EmployeeRecord,
): HrmsRow {
  const source =
    record as unknown as Record<
      string,
      unknown
    >;

  const employeeId = readValue(
    source,
    [
      "Employee_id",
      "employee_id",
      "id",
    ],
  );

  const deptId = readValue(
    source,
    [
      "Dept_Id",
      "dept_id",
    ],
  );

  const desigId = readValue(
    source,
    [
      "Desig_Id",
      "desig_id",
    ],
  );

  const shiftId = readValue(
    source,
    [
      "Shift_id",
      "Shift_Id",
      "shift_id",
    ],
  );

  const empTypeId = readValue(
    source,
    [
      "Emp_type_id",
      "emp_type_id",
    ],
  );

  const employmentStatus =
    readValue(
      source,
      [
        "Employment_status",
        "employment_status",
      ],
    );

  return {
    id: String(employeeId ?? ""),

    Employee_id:
      Number(employeeId ?? 0),

    Employee_code:
      optionalText(
        readValue(source, [
          "Employee_code",
          "employee_code",
        ]),
      ),

    First_name:
      optionalText(
        readValue(source, [
          "First_name",
          "first_name",
        ]),
      ),

    Middle_name:
      optionalText(
        readValue(source, [
          "Middle_name",
          "middle_name",
        ]),
      ),

    Last_name:
      optionalText(
        readValue(source, [
          "Last_name",
          "last_name",
        ]),
      ),

    Display_name: composeEmployeeDisplayName({
      firstName: readValue(source, ["First_name", "first_name"]),
      middleName: readValue(source, ["Middle_name", "middle_name"]),
      lastName: readValue(source, ["Last_name", "last_name"]),
      displayName: readValue(source, ["Display_name", "display_name"]),
    }),

    Email:
      optionalText(
        readValue(source, [
          "Email",
          "email",
        ]),
      ),

    Mobile:
      optionalText(
        readValue(source, [
          "Mobile",
          "mobile",
        ]),
      ),

    Org_Name:
      optionalText(
        readValue(source, [
          "Org_Name",
          "org_name",
        ]),
      ),

    Dept_Id:
      nullableNumber(deptId),

    Department:
      optionalText(
        readValue(source, [
          "Dept_Name",
          "Department",
        ]),
      ),

    Desig_Id:
      nullableNumber(desigId),

    Designation:
      optionalText(
        readValue(source, [
          "Desig_Name",
          "Designation",
        ]),
      ),

    Grade_Name:
      optionalText(
        readValue(source, [
          "Grade_Name",
        ]),
      ),

    Emp_type_name:
      optionalText(
        readValue(source, [
          "Emp_type_name",
        ]),
      ),

    Employment_status_name:
      optionalText(
        readValue(source, [
          "Employment_status_name",
        ]),
      ),

    Shift_name:
      optionalText(
        readValue(source, [
          "Shift_name",
        ]),
      ),

    Date_of_joining:
      optionalText(
        readValue(source, [
          "Date_of_joining",
          "date_of_joining",
        ]),
      ),

    Employment_status:
      employmentStatus ?? "",

    Status: Number(
      readValue(source, [
        "Status",
        "status",
      ]) ?? 0,
    ),

    Photo_path: (() => {
      const photoPath = optionalText(
        readValue(source, [
          "Photo_path",
          "photo_path",
        ]),
      );
      return photoPath
        ? resolvePublicFileUrl(photoPath, EMPLOYEE_PHOTO_FOLDER)
        : "";
    })(),

    Branch_Id:
      nullableNumber(
        readValue(source, [
          "Branch_Id",
          "branch_id",
        ]),
      ),

    Shift_id:
      Array.isArray(shiftId) 
        ? shiftId.join(",") 
        : nullableNumber(shiftId),

    Emp_type_id:
      nullableNumber(empTypeId),
  };
}

/**
 * Convert UI row to CREATE payload.
 */
export function rowToEmployeeCreatePayload(
  row: HrmsRow,
): EmployeeCreatePayload {
  const branchId = extractId(row.Branch, row.Branch_Id);
  const deptId = extractId(row.Department, row.Dept_Id);
  const desigId = extractId(row.Designation, row.Desig_Id);
  const gradeId = extractId(row.Grade, row.Grade_Id);
  const shiftIds = extractIds(row.Shift, row.Shift_id ?? row.Shift_Id);
  const empTypeId = extractId(row.Employment_type, row.Emp_type_id);

  const employmentStatus =
    nullableNumber(
      row.Employment_status,
    );

  const firstName =
    String(
      row.First_name ?? "",
    ).trim();

  const middleName =
    optionalText(
      row.Middle_name,
    );

  const lastName =
    String(
      row.Last_name ?? "",
    ).trim();

  const displayName =
    composeEmployeeDisplayName({
      firstName,
      middleName,
      lastName,
      displayName: row.Display_name,
    });

  const payload: EmployeeCreatePayload = {
    employee_code:
      String(
        row.Employee_code ?? "",
      ).trim(),

    first_name:
      firstName,

    middle_name:
      middleName || null,

    last_name:
      lastName,

    display_name:
      displayName || null,

    gender:
      nullableNumber(row.Gender),

    date_of_birth:
      optionalText(
        row.Date_of_birth,
      ) || null,

    blood_group:
      nullableNumber(
        row.Blood_group,
      ),

    marital_status:
      nullableNumber(
        row.Marital_status,
      ),

    mobile:
      optionalText(row.Mobile) ||
      null,

    email:
      optionalText(row.Email) ||
      null,

    address_line1:
      optionalText(
        row.Address_line1,
      ) || null,

    city:
      optionalText(row.City) ||
      null,

    state:
      optionalText(row.State) ||
      null,

    country:
      optionalText(
        row.Country,
      ) || null,

    pincode:
      optionalText(
        row.Pincode,
      ) || null,

    branch_id:
      branchId ?? 0,

    dept_id:
      deptId ?? 0,

    desig_id:
      desigId ?? 0,

    grade_id:
      gradeId ?? 0,

    shift_id:
      shiftIds,

    emp_type_id:
      empTypeId ?? 0,

    date_of_joining:
      String(
        row.Date_of_joining ?? "",
      ).trim(),

    employment_status:
      employmentStatus ?? 0,

    status:
      Number(row.Status ?? 1),
  };

  applyEmployeePhotoFields(row, payload);


  const bankName =
    optionalText(row.Bank_name);

  const bankBranch =
    optionalText(
      row.Bank_branch,
    );

  const accountHolderName =
    optionalText(
      row.Account_holder_name,
    );

  const accountNumber =
    optionalText(
      row.Account_number,
    );

  const ifscCode =
    optionalText(row.IFSC_code);

  if (
    bankName ||
    bankBranch ||
    accountHolderName ||
    accountNumber ||
    ifscCode
  ) {
    payload.bank = {
      bank_name:
        bankName,

      branch_name:
        bankBranch || null,

      account_holder_name:
        accountHolderName ||
        displayName ||
        null,

      account_number:
        accountNumber,

      ifsc_code:
        ifscCode,

      account_type:
        optionalText(
          row.Account_type,
        ) || null,
    };
  }

  const identifications = [
    {
      id_type: 1,
      id_number: optionalText(
        row.PAN,
      ),
    },
    {
      id_type: 2,
      id_number: optionalText(
        row.Aadhaar_no,
      ),
    },
    {
      id_type: 3,
      id_number: optionalText(
        row.Passport_no,
      ),
    },
    {
      id_type: 4,
      id_number: optionalText(
        row.Driving_licence,
      ),
    },
  ]
    .filter(
      (item) => item.id_number,
    )
    .map((item) => ({
      id_type:
        item.id_type,
      id_number:
        item.id_number,
      issue_date: null,
      expiry_date: null,
    }));

  if (
    identifications.length > 0
  ) {
    payload.identifications =
      identifications;
  }

  const hasStatutory =
    row.PF_number !==
    undefined ||
    row.UAN !== undefined ||
    row.ESI_number !==
    undefined ||
    row.Professional_tax !==
    undefined ||
    row.TDS !== undefined;

  if (hasStatutory) {
    payload.statutory = {
      pf_no:
        optionalText(
          row.PF_number,
        ) || null,

      uan_no:
        optionalText(
          row.UAN,
        ) || null,

      esi_no:
        optionalText(
          row.ESI_number,
        ) || null,

      ptax_no:
        optionalText(
          row.Professional_tax,
        ) || null,

      tds_applicable:
        Number(row.TDS ?? 0),
    };
  }

  return payload;
}

/**
 * Convert UI row to UPDATE payload.
 *
 * Only fields defined by the Employee update
 * contract are sent.
 */
// export function rowToEmployeeUpdatePayload(
//   row: HrmsRow,
// ): EmployeeUpdatePayload {
//   const payload: EmployeeUpdatePayload =
//     {};

//   const branchId =
//     nullableNumber(
//       row.Branch_Id ??
//       row.Branch,
//     );

//   const deptId =
//     nullableNumber(
//       row.Dept_Id ??
//       row.Department,
//     );

//   const desigId =
//     nullableNumber(
//       row.Desig_Id ??
//       row.Designation,
//     );

//   const gradeId =
//     nullableNumber(
//       row.Grade_Id ??
//       row.Grade,
//     );

//   const shiftId =
//     nullableNumber(
//       row.Shift_id ??
//       row.Shift_Id ??
//       row.Shift,
//     );

//   const empTypeId =
//     nullableNumber(
//       row.Emp_type_id ??
//       row.Employment_type,
//     );

//     const fatherName =
//       optionalText(
//         row.Father_name,
//       )

//       if(fatherName){
//         payload.father_name = fatherName;
//       }

//     const motherName =
//       optionalText(
//         row.Mother_name,
//       );

//     if(motherName){
//       payload.mother_name = motherName;
//     }

//   const employmentStatus =
//     nullableNumber(
//       row.Employment_status,
//     );

//   if (
//     row.Employee_code !==
//     undefined
//   ) {
//     payload.employee_code =
//       String(
//         row.Employee_code,
//       ).trim();
//   }

//   if (
//     row.First_name !== undefined
//   ) {
//     payload.first_name =
//       String(
//         row.First_name,
//       ).trim();
//   }

//   if (
//     row.Middle_name !== undefined
//   ) {
//     payload.middle_name =
//       optionalText(
//         row.Middle_name,
//       ) || null;
//   }

//   if (
//     row.Last_name !== undefined
//   ) {
//     payload.last_name =
//       String(
//         row.Last_name,
//       ).trim();
//   }

//   if (
//     row.Display_name !==
//     undefined
//   ) {
//     payload.display_name =
//       optionalText(
//         row.Display_name,
//       ) || null;
//   }

//   if (row.Gender !== undefined) {
//     payload.gender =
//       nullableNumber(row.Gender);
//   }

//   if (
//     row.Date_of_birth !==
//     undefined
//   ) {
//     payload.date_of_birth =
//       optionalText(
//         row.Date_of_birth,
//       ) || null;
//   }

//   if (
//     row.Blood_group !==
//     undefined
//   ) {
//     payload.blood_group =
//       nullableNumber(
//         row.Blood_group,
//       );
//   }

//   if (
//     row.Marital_status !==
//     undefined
//   ) {
//     payload.marital_status =
//       nullableNumber(
//         row.Marital_status,
//       );
//   }

//   if (row.Mobile !== undefined) {
//     payload.mobile =
//       optionalText(row.Mobile) ||
//       null;
//   }

//   if (row.Email !== undefined) {
//     payload.email =
//       optionalText(row.Email) ||
//       null;
//   }

//   if (
//     row.Address_line1 !==
//     undefined
//   ) {
//     payload.address_line1 =
//       optionalText(
//         row.Address_line1,
//       ) || null;
//   }

//   if (row.City !== undefined) {
//     payload.city =
//       optionalText(row.City) ||
//       null;
//   }

//   if (row.State !== undefined) {
//     payload.state =
//       optionalText(row.State) ||
//       null;
//   }

//   if (
//     row.Country !== undefined
//   ) {
//     payload.country =
//       optionalText(row.Country) ||
//       null;
//   }

//   if (
//     row.Pincode !== undefined
//   ) {
//     payload.pincode =
//       optionalText(
//         row.Pincode,
//       ) || null;
//   }

//   if (
//     row.Branch !== undefined ||
//     row.Branch_Id !== undefined
//   ) {
//     payload.branch_id =
//       branchId;
//   }

//   if (
//     row.Department !==
//     undefined ||
//     row.Dept_Id !== undefined
//   ) {
//     payload.dept_id =
//       deptId;
//   }

//   if (
//     row.Designation !==
//     undefined ||
//     row.Desig_Id !== undefined
//   ) {
//     payload.desig_id =
//       desigId;
//   }

//   if (
//     row.Grade !== undefined ||
//     row.Grade_Id !== undefined
//   ) {
//     payload.grade_id =
//       gradeId;
//   }

//   if (
//     row.Shift !== undefined ||
//     row.Shift_Id !== undefined ||
//     row.Shift_id !== undefined
//   ) {
//     payload.shift_id =
//       shiftId;
//   }

//   if (
//     row.Employment_type !==
//     undefined ||
//     row.Emp_type_id !==
//     undefined
//   ) {
//     payload.emp_type_id =
//       empTypeId;
//   }

//   if (
//     row.Date_of_joining !==
//     undefined
//   ) {
//     payload.date_of_joining =
//       optionalText(
//         row.Date_of_joining,
//       ) || null;
//   }

//   if (
//     row.Employment_status !==
//     undefined
//   ) {
//     payload.employment_status =
//       employmentStatus;
//   }

//   if (row.Status !== undefined) {
//     payload.status =
//       Number(row.Status);
//   }

//   /**
//    * Statutory is documented for UPDATE.
//    */
//   const hasStatutory =
//     row.PF_number !==
//     undefined ||
//     row.UAN !== undefined ||
//     row.ESI_number !==
//     undefined ||
//     row.Professional_tax !==
//     undefined ||
//     row.TDS !== undefined;

//   if (hasStatutory) {
//     payload.statutory = {
//       pf_no:
//         optionalText(
//           row.PF_number,
//         ) || null,

//       uan_no:
//         optionalText(
//           row.UAN,
//         ) || null,

//       esi_no:
//         optionalText(
//           row.ESI_number,
//         ) || null,

//       ptax_no:
//         optionalText(
//           row.Professional_tax,
//         ) || null,

//       tds_applicable:
//         Number(row.TDS ?? 0),
//     };
//   }
//   // --- Add Bank Mapping ---
//   const bankName = optionalText(row.Bank_name);
//   const bankBranch = optionalText(row.Bank_branch);
//   const accountHolderName = optionalText(row.Account_holder_name);
//   const accountNumber = optionalText(row.Account_number);
//   const ifscCode = optionalText(row.IFSC_code);

//   if (bankName || bankBranch || accountHolderName || accountNumber || ifscCode) {
//     payload.bank = {
//       bank_name: bankName,
//       branch_name: bankBranch || null,
//       account_holder_name: accountHolderName || optionalText(row.Display_name) || null,
//       account_number: accountNumber,
//       ifsc_code: ifscCode,
//       account_type: optionalText(row.Account_type) || null,
//     };
//   }

//   // --- Add Identifications Mapping ---
//   const identifications = [
//     { id_type: 1, id_number: optionalText(row.PAN) },
//     { id_type: 2, id_number: optionalText(row.Aadhaar_no) },
//     { id_type: 3, id_number: optionalText(row.Passport_no) },
//     { id_type: 4, id_number: optionalText(row.Driving_licence) },
//   ]
//     .filter((item) => item.id_number)
//     .map((item) => ({
//       id_type: item.id_type,
//       id_number: item.id_number,
//       issue_date: null,
//       expiry_date: null,
//     }));

//   if (identifications.length > 0) {
//     payload.identifications = identifications;
//   }

//   return payload;
// }


export function rowToEmployeeUpdatePayload(
  row: HrmsRow,
): EmployeeUpdatePayload {
  const payload: EmployeeUpdatePayload = {};

  /**
   * ---------------------------------------------------------
   * Helper: convert a UI value to number when possible.
   * ---------------------------------------------------------
   */
  const toId = (value: unknown): number | null => {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return null;
    }

    const numberValue = Number(value);

    return Number.isFinite(numberValue)
      ? numberValue
      : null;
  };

  /**
   * ---------------------------------------------------------
   * Helper: text normalization.
   * ---------------------------------------------------------
   */
  const text = (value: unknown): string | null => {
    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }

    const valueText = String(value).trim();

    return valueText === ""
      ? null
      : valueText;
  };

  /**
   * ---------------------------------------------------------
   * Employee master-data IDs
   *
   * UI fields can be:
   *   Branch
   *   Department
   *   Designation
   *   Grade
   *   Shift
   *   Employment_type
   *
   * API fields:
   *   branch_id
   *   dept_id
   *   desig_id
   *   grade_id
   *   shift_id
   *   emp_type_id
   * ---------------------------------------------------------
   */
  const branchId = extractId(row.Branch, row.Branch_Id);
  const deptId = extractId(row.Department, row.Dept_Id);
  const desigId = extractId(row.Designation, row.Desig_Id);
  const gradeId = extractId(row.Grade, row.Grade_Id);
  const shiftIds = extractIds(row.Shift, row.Shift_id ?? row.Shift_Id);
  const empTypeId = extractId(row.Employment_type, row.Emp_type_id);

  /**
   * Employment status.
   *
   * Prefer numeric ID.
   */
  let employmentStatus = toId(
    row.Employment_status,
  );

  /**
   * Your current form data showed:
   *
   *   Employment_status: "Active"
   *
   * That is a label, not an API ID.
   *
   * The backend documentation uses 1 for Active,
   * so support the documented Active/Inactive values.
   *
   * For any additional employment statuses, the form
   * must provide the actual numeric Emp_status_id.
   */
  if (
    employmentStatus === null &&
    typeof row.Employment_status === "string"
  ) {
    const statusText =
      row.Employment_status
        .trim()
        .toLowerCase();

    if (statusText === "active") {
      employmentStatus = 1;
    } else if (
      statusText === "inactive"
    ) {
      employmentStatus = 0;
    }
  }

  /**
   * =========================================================
   * CORE EMPLOYEE INFORMATION
   * =========================================================
   */

  if (
    row.Employee_code !== undefined
  ) {
    payload.employee_code =
      String(
        row.Employee_code,
      ).trim();
  }

  if (
    row.First_name !== undefined
  ) {
    payload.first_name =
      String(
        row.First_name,
      ).trim();
  }

  if (
    row.Middle_name !== undefined
  ) {
    payload.middle_name =
      text(row.Middle_name);
  }

  if (
    row.Last_name !== undefined
  ) {
    payload.last_name =
      String(
        row.Last_name,
      ).trim();
  }

  if (
    row.First_name !== undefined ||
    row.Middle_name !== undefined ||
    row.Last_name !== undefined
  ) {
    payload.display_name =
      composeEmployeeDisplayName({
        firstName: row.First_name,
        middleName: row.Middle_name,
        lastName: row.Last_name,
        displayName: row.Display_name,
      }) || null;
  } else if (
    row.Display_name !== undefined
  ) {
    payload.display_name =
      text(row.Display_name);
  }

  if (
    row.Title !== undefined
  ) {
    payload.title =
      text(row.Title);
  }

  /**
   * =========================================================
   * PERSONAL INFORMATION
   * =========================================================
   */

  if (
    row.Gender !== undefined
  ) {
    payload.gender =
      toId(row.Gender);
  }

  if (
    row.Date_of_birth !== undefined
  ) {
    payload.date_of_birth =
      text(row.Date_of_birth);
  }

  if (
    row.Blood_group !== undefined
  ) {
    payload.blood_group =
      toId(row.Blood_group);
  }

  if (
    row.Marital_status !== undefined
  ) {
    payload.marital_status =
      toId(row.Marital_status);
  }

  if (
    row.Father_name !== undefined
  ) {
    payload.father_name =
      text(row.Father_name);
  }

  if (
    row.Mother_name !== undefined
  ) {
    payload.mother_name =
      text(row.Mother_name);
  }

  if (
    row.Spouse_name !== undefined
  ) {
    payload.spouse_name =
      text(row.Spouse_name);
  }

  if (
    row.Mobile !== undefined
  ) {
    payload.mobile =
      text(row.Mobile);
  }

  if (
    row.Alternate_mobile !== undefined
  ) {
    payload.alternate_mobile =
      text(row.Alternate_mobile);
  }

  if (
    row.Email !== undefined
  ) {
    payload.email =
      text(row.Email);
  }

  /**
   * =========================================================
   * ADDRESS
   * =========================================================
   */

  if (
    row.Address_line1 !== undefined
  ) {
    payload.address_line1 =
      text(row.Address_line1);
  }

  if (
    row.Address_line2 !== undefined
  ) {
    payload.address_line2 =
      text(row.Address_line2);
  }

  if (
    row.City !== undefined
  ) {
    payload.city =
      text(row.City);
  }

  if (
    row.State !== undefined
  ) {
    payload.state =
      text(row.State);
  }

  if (
    row.Country !== undefined
  ) {
    payload.country =
      text(row.Country);
  }

  if (
    row.Pincode !== undefined
  ) {
    payload.pincode =
      text(row.Pincode);
  }

  if (
    row.Emergency_contact !== undefined
  ) {
    payload.emergency_contact =
      text(row.Emergency_contact);
  }

  /**
   * =========================================================
   * EMPLOYMENT INFORMATION
   * =========================================================
   */

  if (
    row.Branch !== undefined ||
    row.Branch_Id !== undefined
  ) {
    payload.branch_id =
      branchId;
  }

  if (
    row.Department !== undefined ||
    row.Dept_Id !== undefined
  ) {
    payload.dept_id =
      deptId;
  }

  if (
    row.Designation !== undefined ||
    row.Desig_Id !== undefined
  ) {
    payload.desig_id =
      desigId;
  }

  if (
    row.Grade !== undefined ||
    row.Grade_Id !== undefined
  ) {
    payload.grade_id =
      gradeId;
  }

  if (
    row.Shift !== undefined ||
    row.Shift_Id !== undefined ||
    row.Shift_id !== undefined
  ) {
    payload.shift_id =
      shiftIds;
  }

  if (
    row.Employment_type !== undefined ||
    row.Emp_type_id !== undefined
  ) {
    payload.emp_type_id =
      empTypeId;
  }

  if (
    row.Reporting_manager_id !==
    undefined
  ) {
    payload.reporting_manager_id =
      toId(
        row.Reporting_manager_id,
      );
  }

  if (
    row.Reporting_manager !==
    undefined
  ) {
    payload.reporting_manager =
      text(row.Reporting_manager);
  }

  if (
    row.Date_of_joining !== undefined
  ) {
    payload.date_of_joining =
      text(row.Date_of_joining);
  }

  if (
    row.Confirmation_date !== undefined
  ) {
    payload.confirmation_date =
      text(row.Confirmation_date);
  }

  if (
    row.Probation_end_date !== undefined
  ) {
    payload.probation_end_date =
      text(row.Probation_end_date);
  }

  if (
    row.Probation_period !== undefined
  ) {
    payload.probation_period =
      toId(row.Probation_period);
  }

  if (
    row.Employment_status !== undefined
  ) {
    payload.employment_status =
      employmentStatus;
  }

  if (
    row.Work_location !== undefined
  ) {
    payload.work_location =
      text(row.Work_location);
  }

  /**
   * =========================================================
   * STATUS
   * =========================================================
   */

  if (
    row.Status !== undefined
  ) {
    payload.status =
      Number(row.Status);
  }

  /**
   * =========================================================
   * PHOTO
   * =========================================================
   */
  applyEmployeePhotoFields(row, payload);


  /**
   * =========================================================
   * STATUTORY
   * =========================================================
   */

  const hasStatutoryData =
    row.PF_number !== undefined ||
    row.UAN !== undefined ||
    row.ESI_number !== undefined ||
    row.Professional_tax !== undefined ||
    row.TDS !== undefined ||
    row.Other_statutory !== undefined;

  if (hasStatutoryData) {
    payload.statutory = {
      pf_no:
        text(row.PF_number),

      uan_no:
        text(row.UAN),

      esi_no:
        text(row.ESI_number),

      ptax_no:
        text(row.Professional_tax),

      tds_applicable:
        Number(row.TDS ?? 0),
    };

    /**
     * Keep Other_statutory separate only if your
     * backend update DTO supports it.
     */
    if (
      row.Other_statutory !== undefined
    ) {
      payload.statutory.other_statutory =
        text(
          row.Other_statutory,
        );
    }
  }

  /**
   * =========================================================
   * BANK
   * =========================================================
   *
   * The API documentation explicitly shows bank on CREATE.
   * Your frontend can prepare the object here for UPDATE,
   * but the backend PUT endpoint must support it for the
   * values to persist.
   */
  const hasBankData =
    row.Bank_name !== undefined ||
    row.Bank_branch !== undefined ||
    row.Account_holder_name !== undefined ||
    row.Account_number !== undefined ||
    row.IFSC_code !== undefined ||
    row.Account_type !== undefined;

  if (hasBankData) {
    payload.bank = {
      bank_name:
        text(row.Bank_name) ?? "",

      branch_name:
        text(row.Bank_branch),

      account_holder_name:
        text(
          row.Account_holder_name,
        ),

      account_number:
        text(
          row.Account_number,
        ) ?? "",

      ifsc_code:
        text(row.IFSC_code) ?? "",

      account_type:
        text(row.Account_type),
    };
  }

  /**
   * =========================================================
   * IDENTIFICATIONS
   * =========================================================
   */

  const identificationInputs = [
    {
      id_type: 1,
      id_number: text(row.PAN),
    },
    {
      id_type: 2,
      id_number: text(
        row.Aadhaar_no,
      ),
    },
    {
      id_type: 3,
      id_number: text(
        row.Passport_no,
      ),
    },
    {
      id_type: 4,
      id_number: text(
        row.Driving_licence,
      ),
    },
  ];

  const hasIdentificationFields =
    row.PAN !== undefined ||
    row.Aadhaar_no !== undefined ||
    row.Passport_no !== undefined ||
    row.Driving_licence !== undefined ||
    row.Other_identification !==
    undefined;

  if (hasIdentificationFields) {
    payload.identifications =
      identificationInputs
        .filter(
          (item) =>
            item.id_number !== null,
        )
        .map((item) => ({
          id_type: item.id_type,
          id_number:
            item.id_number ?? "",
          issue_date: null,
          expiry_date: null,
        }));

    /**
     * Other_identification is not part of the
     * documented identification DTO.
     *
     * Do not invent an ID type for it.
     */
  }

  return payload;
}


/**
 * Convert full employee detail response to
 * the existing flat Employee form structure.
 */
export function employeeDetailToForm(
  detail: EmployeeDetail,
): HrmsRow {
  const employee =
    detail.employee;

  const bank =
    detail.banks?.slice().reverse().find((b) => b.Status === 1) ??
    detail.banks?.[(detail.banks?.length ?? 1) - 1] ??
    null;

  const statutory =
    detail.statutory;

  const identifications =
    detail.identifications ?? [];

  const getIdentification =
    (type: number): string => {
      const item =
        identifications.slice().reverse().find(
          (record) =>
            Number(
              record.Id_type,
            ) === type && record.Status === 1,
        ) ??
        identifications.slice().reverse().find(
          (record) =>
            Number(
              record.Id_type,
            ) === type,
        );

      return (
        item?.Id_number ?? ""
      );
    };

  return {
    id: String(
      employee.Employee_id,
    ),

    Employee_id:
      employee.Employee_id,

    Employee_code:
      employee.Employee_code ??
      "",

    Title:
      employee.Title ?? "",

    First_name:
      employee.First_name ?? "",

    Middle_name:
      employee.Middle_name ?? "",

    Last_name:
      employee.Last_name ?? "",

    Display_name: composeEmployeeDisplayName({
      firstName: employee.First_name,
      middleName: employee.Middle_name,
      lastName: employee.Last_name,
      displayName: employee.Display_name,
    }),

    Gender:
      employee.Gender ?? null,

    Date_of_birth:
      employee.Date_of_birth ?? "",

    Blood_group:
      employee.Blood_group ?? null,

    Marital_status:
      employee.Marital_status ?? null,

    Father_name:
      employee.Father_name ?? "",

    Mother_name:
      employee.Mother_name ?? "",

    Spouse_name:
      employee.Spouse_name ?? "",

    Mobile:
      employee.Mobile ?? "",

    Alternate_mobile:
      employee.Alternate_mobile ??
      "",

    Email:
      employee.Email ?? "",

    Address_line1:
      employee.Address_line1 ??
      "",

    Address_line2:
      employee.Address_line2 ??
      "",

    City:
      employee.City ?? "",

    State:
      employee.State ?? "",

    Country:
      employee.Country ?? "",

    Pincode:
      employee.Pincode ?? "",

    Emergency_contact:
      employee.Emergency_contact ??
      "",

    Branch_Id:
      employee.Branch_Id ?? null,

    Dept_Id:
      employee.Dept_Id ?? null,

    Desig_Id:
      employee.Desig_Id ?? null,

    Grade_Id:
      employee.Grade_Id ?? null,

    Shift_id:
      employee.Shift_id ?? null,

    Emp_type_id:
      employee.Emp_type_id ?? null,

    Reporting_manager_id:
      employee.Reporting_manager_id ??
      null,

    Date_of_joining:
      employee.Date_of_joining ??
      "",

    Confirmation_date:
      employee.Confirmation_date ??
      "",

    Probation_end_date:
      employee.Probation_end_date ??
      "",

    Work_location:
      employee.Work_location ??
      "",

    Photo_path:
      employee.Photo_path ?? "",

    Status:
      employee.Status ?? 0,

    /**
     * Form select values.
     */
    Branch:
      toFormSelectValue(
        employee.Branch_Id,
      ),

    Department:
      toFormSelectValue(
        employee.Dept_Id,
      ),

    Designation:
      toFormSelectValue(
        employee.Desig_Id,
      ),

    Grade:
      toFormSelectValue(
        employee.Grade_Id,
      ),

    Shift:
      toFormSelectValue(
        employee.Shift_id,
      ),

    Employment_type:
      toFormSelectValue(
        employee.Emp_type_id,
      ),

    Employment_status:
      toFormSelectValue(
        employee.Employment_status,
      ),
    /**
     * Identification.
     */
    PAN:
      getIdentification(1),

    Aadhaar_no:
      getIdentification(2),

    Passport_no:
      getIdentification(3),

    Driving_licence:
      getIdentification(4),

    /**
     * Bank.
     */
    Bank_name:
      bank?.Bank_name ?? "",

    Bank_branch:
      bank?.Branch_name ?? "",

    Account_holder_name:
      bank?.Account_holder_name ??
      "",

    Account_number:
      bank?.Account_number ?? "",

    IFSC_code:
      bank?.Ifsc_code ?? "",

    Account_type:
      bank?.Account_type ?? "",

    /**
     * Statutory.
     */
    PF_number:
      statutory?.Pf_no ?? "",

    UAN:
      statutory?.Uan_no ?? "",

    ESI_number:
      statutory?.Esi_no ?? "",

    Professional_tax:
      statutory?.Ptax_no ?? "",

    TDS:
      statutory?.Tds_applicable === 1
        ? "1"
        : "0",
  };
}

function toFormSelectValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "";
  }

  return String(value);
}

/**
 * Employee service.
 */
function buildFormData(formData: FormData, data: any, parentKey?: string) {
  if (data && typeof data === 'object' && !(data instanceof Date) && !(data instanceof File)) {
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        buildFormData(formData, item, parentKey ? `${parentKey}[${index}]` : `${index}`);
      });
    } else {
      Object.entries(data).forEach(([key, value]) => {
        buildFormData(formData, value, parentKey ? `${parentKey}[${key}]` : key);
      });
    }
  } else if (data !== null && data !== undefined) {
    const value = data instanceof Date ? data.toISOString() : data;
    formData.append(parentKey!, value instanceof File ? value : String(value));
  }
}

function toEmployeeFormData(payload: EmployeeUpdatePayload | EmployeeCreatePayload): FormData {
  const formData = new FormData();
  const { photo, ...rest } = payload;
  buildFormData(formData, rest);

  if (photo instanceof File) {
    formData.append("photo", photo, photo.name);
  }

  return formData;
}

function shouldUseEmployeeMultipart(
  row: HrmsRow,
  payload: EmployeeCreatePayload | EmployeeUpdatePayload,
): boolean {
  return getEmployeePhotoFile(row) !== null || payload.photo instanceof File;
}

export const employeeService = {
  /**
   * GET /api/v1/employee/list
   */
  list: async (
    params?: {
      status?: number;
      employee_code?: string;
      employee_id?: number;
      with_details?: 0 | 1;
    },
  ) => {
    const query =
      new URLSearchParams();

    if (
      params?.status !== undefined
    ) {
      query.set(
        "status",
        String(params.status),
      );
    }

    if (
      params?.employee_code
    ) {
      query.set(
        "employee_code",
        params.employee_code.trim(),
      );
    }

    if (
      params?.employee_id !== undefined
    ) {
      query.set(
        "employee_id",
        String(params.employee_id),
      );
    }

    if (
      params?.with_details !==
      undefined
    ) {
      query.set(
        "with_details",
        String(
          params.with_details,
        ),
      );
    }

    const suffix =
      query.toString();

    const path = suffix
      ? `${API_ENDPOINTS.employee.list}?${suffix}`
      : API_ENDPOINTS.employee.list;

    const payload =
      await apiClient.get<unknown>(
        path,
      );

    return asEmployeeList(payload).map(
      employeeToRow,
    );
  },

  /**
   * GET
   * /api/v1/employee/list
   * ?employee_id=X&with_details=1
   */
  getById: async (
    id: string | number,
  ) => {
    const employeeId =
      Number(id);

    if (
      !Number.isInteger(
        employeeId,
      ) ||
      employeeId <= 0
    ) {
      throw new Error(
        "Invalid employee ID",
      );
    }

    const query =
      new URLSearchParams();

    query.set(
      "employee_id",
      String(employeeId),
    );

    query.set(
      "with_details",
      "1",
    );

    const payload =
      await apiClient.get<unknown>(
        `${API_ENDPOINTS.employee.list}?${query.toString()}`,
      );

    return employeeDetailToForm(
      asEmployeeDetail(payload),
    );
  },

  /**
   * POST /api/v1/employee/create
   */
  create: async (
    row: HrmsRow,
  ) => {
    const payload =
      rowToEmployeeCreatePayload(
        row,
      );

    const useMultipart = shouldUseEmployeeMultipart(row, payload);
    const body = useMultipart ? toEmployeeFormData(payload) : payload;

    const response =
      await apiClient.post<unknown>(
        API_ENDPOINTS.employee.create,
        body,
      );

    return employeeRowFromSaveResponse(response, row);
  },

  /**
   * PUT /api/v1/employee/update/:id
   */
  update: async (
    id: string | number,
    row: HrmsRow,
  ) => {
    const employeeId =
      Number(id);

    if (
      !Number.isInteger(
        employeeId,
      ) ||
      employeeId <= 0
    ) {
      throw new Error(
        "Invalid employee ID",
      );
    }

    const payload =
      rowToEmployeeUpdatePayload(
        row,
      );

    const useMultipart = shouldUseEmployeeMultipart(row, payload);
    const body = useMultipart ? toEmployeeFormData(payload) : payload;

    if (useMultipart) {
      (body as FormData).append("_method", "PUT");
    }

    const response =
      await (useMultipart ? apiClient.post<unknown> : apiClient.put<unknown>)(
        API_ENDPOINTS.employee.update(
          employeeId,
        ),
        body,
      );

    return employeeRowFromSaveResponse(
      response,
      row,
      employeeId,
    );
  },

  /**
   * DELETE /api/v1/employee/delete/:id
   *
   * Backend performs soft deactivation.
   */
  remove: async (
    id: string | number,
  ) => {
    const employeeId =
      Number(id);

    if (
      !Number.isInteger(
        employeeId,
      ) ||
      employeeId <= 0
    ) {
      throw new Error(
        "Invalid employee ID",
      );
    }

    return apiClient.delete<{
      success?: boolean;
      message?: string;
      data?: null;
    }>(
      API_ENDPOINTS.employee.remove(
        employeeId,
      ),
      {
        unwrap: false,
      },
    );
  },
};