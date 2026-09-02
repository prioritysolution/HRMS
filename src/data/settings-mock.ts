export type NumberingSequenceType = {
  id: number;
  entityModule: string;
  customPrefix?: string;
  nextCounter?: number;
  paddingDigits?: number;
  suffix?: string;
  liveFormattedSample?: string;
  status: number;
};

export const MOCK_NUMBERING_SEQUENCES: NumberingSequenceType[] = [
  {
    id: 1,
    entityModule: "Kendra Centre Code Series",
    customPrefix: "CEN-",
    nextCounter: 3,
    paddingDigits: 2,
    suffix: "",
    liveFormattedSample: "CEN-03",
    status: 1
  },
  {
    id: 2,
    entityModule: "Borrower / Member ID Series",
    customPrefix: "CUST-2026-",
    nextCounter: 4,
    paddingDigits: 4,
    suffix: "",
    liveFormattedSample: "CUST-2026-0004",
    status: 1
  },
  {
    id: 3,
    entityModule: "Staff / Employee ID Series",
    customPrefix: "EMP-",
    nextCounter: 5,
    paddingDigits: 3,
    suffix: "",
    liveFormattedSample: "EMP-005",
    status: 1
  },
  {
    id: 4,
    entityModule: "Joint Liability Group (JLG) Code",
    status: 1
  },
  {
    id: 5,
    entityModule: "Legal Demand Notice Reference Series",
    status: 1
  },
  {
    id: 6,
    entityModule: "Loan Account Number Series",
    customPrefix: "LN-2026-",
    nextCounter: 4,
    paddingDigits: 5,
    suffix: "",
    liveFormattedSample: "LN-2026-00004",
    status: 1
  },
  {
    id: 7,
    entityModule: "No Objection Certificate (NOC) Series",
    status: 1
  },
  {
    id: 8,
    entityModule: "Double-Entry Journal Voucher Series",
    status: 1
  }
];
