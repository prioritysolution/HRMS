export const analyticsStats = [
  {
    title: "Total Employees",
    value: "215",
    change: "+5%",
    hint: "190 Active, 15 New",
    description: "Workforce headcount summary",
    tone: "primary" as const,
    positive: true,
    href: "/employees",
  },
  {
    title: "Employees on Leave",
    value: "12",
    change: "-2%",
    hint: "vs last mo.",
    description: "Staff currently on approved leave",
    tone: "danger" as const,
    positive: false,
    href: "/leave/approval?status=Approved",
  },
  {
    title: "Employees Absent Today",
    value: "8",
    change: "-1%",
    hint: "vs yesterday",
    description: "Employees marked as absent",
    tone: "orange" as const,
    positive: false,
    href: "/attendance/daily?status=Absent",
  },
  {
    title: "Employees Present Today",
    value: "195",
    change: "+3%",
    hint: "vs yesterday",
    description: "Employees marked as present",
    tone: "success" as const,
    positive: true,
    href: "/attendance/daily?status=Present",
  },
  {
    title: "Late Employees",
    value: "15",
    change: "+1%",
    hint: "vs yesterday",
    description: "Employees who arrived late",
    tone: "warning" as const,
    positive: false,
    href: "/attendance/daily?status=Late",
  },
  {
    title: "Employees on Probation",
    value: "25",
    change: "0%",
    hint: "no change",
    description: "Staff currently under probation",
    tone: "info" as const,
    positive: true,
    href: "/employees?Employment_status_name=Probation",
  },
];

export type PerformanceRow = {
  id: string;
  name: string;
  avatar: string;
  jobTitle: string;
  employmentType: string;
  kpi: string;
  rating: string;
  ratingIcon: "star" | "thumbs" | "circle" | "danger";
};

export const highPerformanceEmployees: PerformanceRow[] = [
  {
    id: "EMP-0234",
    name: "Tiger Nixon",
    avatar: "/images/avatars/avatar2.jpg",
    jobTitle: "Marketing",
    employmentType: "Full-time",
    kpi: "9.5",
    rating: "Excellent",
    ratingIcon: "star",
  },
  {
    id: "EMP-0117",
    name: "Joyce Neal",
    avatar: "/images/avatars/avatar1.jpg",
    jobTitle: "Project Manager",
    employmentType: "Part-time",
    kpi: "8.0",
    rating: "Very Good",
    ratingIcon: "thumbs",
  },
  {
    id: "EMP-0223",
    name: "Ethan Ray",
    avatar: "/images/avatars/avatar3.jpg",
    jobTitle: "Custmor Support",
    employmentType: "Full-time",
    kpi: "8.5",
    rating: "Excellent",
    ratingIcon: "star",
  },
  {
    id: "EMP-0458",
    name: "Kelvin Yia",
    avatar: "/images/avatars/avatar4.jpg",
    jobTitle: "Graphic Designer",
    employmentType: "Full-time",
    kpi: "6.5",
    rating: "Good",
    ratingIcon: "star",
  },
  {
    id: "EMP-0348",
    name: "Ollivia Joy",
    avatar: "/images/avatars/avatar5.jpg",
    jobTitle: "Site Supervisior",
    employmentType: "Freelance",
    kpi: "7.0",
    rating: "Very Good",
    ratingIcon: "thumbs",
  },
];

export const lowPerformanceEmployees: PerformanceRow[] = [
  {
    id: "EMP-0897",
    name: "Sarah Khan",
    avatar: "/images/avatars/avatar3.jpg",
    jobTitle: "Engineering",
    employmentType: "Internship",
    kpi: "5.5",
    rating: "Coaching Required",
    ratingIcon: "circle",
  },
  {
    id: "EMP-0742",
    name: "Emily Davis",
    avatar: "/images/avatars/avatar5.jpg",
    jobTitle: "Custmor Support",
    employmentType: "Full-time",
    kpi: "5.0",
    rating: "Coaching Required",
    ratingIcon: "circle",
  },
  {
    id: "EMP-0723",
    name: "Mark Lee",
    avatar: "/images/avatars/avatar6.jpg",
    jobTitle: "Data Scientist",
    employmentType: "Part-time",
    kpi: "4.5",
    rating: "Monitor",
    ratingIcon: "circle",
  },
  {
    id: "EMP-0653",
    name: "Kelvin Yia",
    avatar: "/images/avatars/avatar1.jpg",
    jobTitle: "DevOps Engineer",
    employmentType: "Freelance",
    kpi: "3",
    rating: "Training Needed",
    ratingIcon: "danger",
  },
  {
    id: "EMP-0124",
    name: "Ollivia Joy",
    avatar: "/images/avatars/avatar2.jpg",
    jobTitle: "Frontend Developer",
    employmentType: "Part-time",
    kpi: "4.0",
    rating: "Training Needed",
    ratingIcon: "danger",
  },
];

export const employmentTypes = [
  { label: "Full-time", value: 78, tone: "primary" },
  { label: "Part-time", value: 50, tone: "info" },
  { label: "Internship", value: 35, tone: "success" },
  { label: "Freelance", value: 25, tone: "warning" },
  { label: "Contract", value: 10, tone: "blue" },
];

export const locationDistribution = [
  { label: "New York", value: 35, tone: "info" },
  { label: "Bangalore", value: 25, tone: "warning" },
  { label: "London", value: 25, tone: "blue" },
  { label: "San Francisco", value: 15, tone: "orange" },
];

export const activeEmployees = [
  {
    name: "Sarah Khan",
    role: "Software Engineer",
    avatar: "/images/avatars/avatar3.jpg",
    mode: "On-site",
    time: "10 Min Ago",
    icon: "circle",
  },
  {
    name: "Mark Lee",
    role: "Data Scientist",
    avatar: "/images/avatars/avatar6.jpg",
    mode: "Remote",
    time: "30 Min Ago",
    icon: "square",
  },
  {
    name: "Ollivia Joy",
    role: "Frontend Developer",
    avatar: "/images/avatars/avatar2.jpg",
    mode: "Hybrid",
    time: "45 Min Ago",
    icon: "outline",
  },
  {
    name: "Kelvin Yia",
    role: "Backend Developer",
    avatar: "/images/avatars/avatar1.jpg",
    mode: "On-site",
    time: "1 Hours Ago",
    icon: "circle",
  },
];

export const performanceBarData = [80, 60, 90, 75, 50, 45, 60, 65, 65, 70, 55, 85];
export const performanceBarCategories = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "July",
  "Aug",
  "Sep",
  "oct",
  "Nov",
  "Dec",
];

export const satisfactionRadial = {
  series: [82, 65, 90, 10],
  labels: [
    "Job Satisfaction",
    "Employee NPS",
    "Training Completed",
    "Internal Promotions",
  ],
};

export const genderRatio = {
  series: [25, 75],
  labels: ["Women", "Men"],
};

// --- New Graphical Reports Mock Data ---

export const branchCountCategories = ["Head Office", "North Branch", "South Branch", "West Branch", "East Branch"];
export const branchCountData = [125, 45, 60, 30, 20];

export const departmentCountCategories = ["Operations", "Sales", "IT", "HR", "Finance", "Marketing"];
export const departmentCountData = [80, 65, 45, 25, 35, 30];

export const attendancePercentageCategories = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const attendancePercentageData = [98, 96, 97, 95, 92, 45, 10];

export const leaveUtilizationLabels = ["Sick Leave", "Casual Leave", "Earned Leave", "Maternity Leave"];
export const leaveUtilizationData = [35, 45, 15, 5];

export const payrollSummaryCategories = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
export const payrollSummaryData = [120000, 122000, 125000, 125500, 128000, 130000, 131500];
