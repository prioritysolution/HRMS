export const MOCK_EMPLOYEES = [
  { 
    id: 1, 
    Employee_code: "EMP-001", 
    Display_name: "John Doe", 
    Branch: "HQ - New York", 
    Department: "Engineering", 
    Designation: "Senior Developer", 
    Category: "Permanent", 
    Date_of_joining: "2022-01-15", 
    Status: 1 
  },
  { 
    id: 2, 
    Employee_code: "EMP-002", 
    Display_name: "Jane Smith", 
    Branch: "London Office", 
    Department: "Human Resources", 
    Designation: "HR Manager", 
    Category: "Permanent", 
    Date_of_joining: "2021-11-01", 
    Status: 1 
  },
  { 
    id: 3, 
    Employee_code: "EMP-003", 
    Display_name: "Robert Johnson", 
    Branch: "HQ - New York", 
    Department: "Sales", 
    Designation: "Sales Executive", 
    Category: "Contractual", 
    Date_of_joining: "2023-03-10", 
    Status: 1 
  },
  { 
    id: 4, 
    Employee_code: "EMP-004", 
    Display_name: "Emily Davis", 
    Branch: "Remote", 
    Department: "Marketing", 
    Designation: "Content Strategist", 
    Category: "Permanent", 
    Date_of_joining: "2022-08-22", 
    Status: 0 
  },
  { 
    id: 5, 
    Employee_code: "EMP-005", 
    Display_name: "Michael Wilson", 
    Branch: "HQ - New York", 
    Department: "Engineering", 
    Designation: "QA Engineer", 
    Category: "Probationary", 
    Date_of_joining: "2024-01-05", 
    Status: 1 
  },
  { 
    id: 6, 
    Employee_code: "EMP-006", 
    Display_name: "Sarah Brown", 
    Branch: "London Office", 
    Department: "Finance", 
    Designation: "Accountant", 
    Category: "Permanent", 
    Date_of_joining: "2020-05-18", 
    Status: 1 
  },
  { 
    id: 7, 
    Employee_code: "EMP-007", 
    Display_name: "David Miller", 
    Branch: "Remote", 
    Department: "Engineering", 
    Designation: "Frontend Developer", 
    Category: "Consultant", 
    Date_of_joining: "2023-09-01", 
    Status: 1 
  },
];

export type EmployeeRegisterType = typeof MOCK_EMPLOYEES[0];
