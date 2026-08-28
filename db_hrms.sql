-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 116.193.129.229    Database: db_hrms
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `mst_appl_options`
--

DROP TABLE IF EXISTS `mst_appl_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_appl_options` (
  `Option_Id` smallint NOT NULL AUTO_INCREMENT,
  `Opt_Grp_Id` smallint NOT NULL,
  `Opt_Group` varchar(100) DEFAULT NULL,
  `Opt_Code` tinyint DEFAULT NULL,
  `Opt_Description` varchar(100) DEFAULT NULL,
  `Is_Active` bit(1) NOT NULL,
  `Srl_No` tinyint DEFAULT NULL,
  PRIMARY KEY (`Option_Id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb3 AVG_ROW_LENGTH=303;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_appl_options`
--

LOCK TABLES `mst_appl_options` WRITE;
/*!40000 ALTER TABLE `mst_appl_options` DISABLE KEYS */;
INSERT INTO `mst_appl_options` VALUES (1,1,'Salutation',1,'Mr.',_binary '',1),(2,1,'Salutation',2,'Ms.',_binary '',2),(3,1,'Salutation',3,'Mrs.',_binary '',3),(4,1,'Salutation',4,'Dr.',_binary '',4),(5,2,'Gender',1,'Male',_binary '',1),(6,2,'Gender',2,'Female',_binary '',2),(7,2,'Gender',3,'Transgender',_binary '',3),(8,2,'Gender',4,'Not Specified',_binary '',4),(9,3,'Blood Group',1,'A+',_binary '',1),(10,3,'Blood Group',2,'A-',_binary '',2),(11,3,'Blood Group',3,'B+',_binary '',3),(12,3,'Blood Group',4,'B-',_binary '',4),(13,3,'Blood Group',5,'AB+',_binary '',5),(14,3,'Blood Group',6,'AB-',_binary '',6),(15,3,'Blood Group',7,'O+',_binary '',7),(16,3,'Blood Group',8,'O-',_binary '',8),(17,4,'Marital Status',1,'Single',_binary '',1),(18,4,'Marital Status',2,'Married',_binary '',2),(19,4,'Marital Status',3,'Divorced',_binary '',3),(20,4,'Marital Status',4,'Widowed',_binary '',4),(21,4,'Marital Status',5,'Separated',_binary '',5),(22,5,'Documents',1,'Aadhaar Id',_binary '',1),(23,5,'Documents',2,'PAN',_binary '',2),(24,5,'Documents',3,'Passport',_binary '',3),(25,5,'Documents',4,'Driving Licence',_binary '',4),(26,5,'Documents',5,'Other identification documents',_binary '',5),(27,6,'Service History',1,'Joining',_binary '',1),(28,6,'Service History',2,'Confirmation',_binary '',2),(29,6,'Service History',3,'Transfer',_binary '',3),(30,6,'Service History',4,'Promotion',_binary '',4),(31,6,'Service History',5,'Demotion',_binary '',5),(32,6,'Service History',6,'Salary Revision',_binary '',6),(33,6,'Service History',7,'Designation Change',_binary '',7),(34,6,'Service History',8,'Department Change',_binary '',8),(35,6,'Service History',9,'Branch Change',_binary '',9),(36,6,'Service History',10,'Suspension',_binary '',10),(37,6,'Service History',11,'Resignation',_binary '',11),(38,6,'Service History',12,'Retirement',_binary '',12),(39,7,'Attendance Sources',1,'Biometric machine',_binary '',1),(40,7,'Attendance Sources',2,'Mobile application',_binary '',2),(41,7,'Attendance Sources',3,'Web login',_binary '',3),(42,7,'Attendance Sources',4,'Manual attendance',_binary '',4),(43,8,'Attendance Status',1,'Present',_binary '',1),(44,8,'Attendance Status',2,'Absent',_binary '',2),(45,8,'Attendance Status',3,'Half Day',_binary '',3),(46,8,'Attendance Status',4,'Late',_binary '',4),(47,8,'Attendance Status',5,'Leave',_binary '',5),(48,8,'Attendance Status',6,'Holiday',_binary '',6),(49,8,'Attendance Status',7,'Weekly Off',_binary '',7),(50,8,'Attendance Status',8,'Work From Home',_binary '',8),(51,8,'Attendance Status',9,'Compensatory Office',_binary '',9),(52,9,'Punch Type',1,'In',_binary '',1),(53,9,'Punch Type',2,'Out',_binary '',2),(54,9,'Punch Type',3,'Unknown',_binary '',3);
/*!40000 ALTER TABLE `mst_appl_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_branch`
--

DROP TABLE IF EXISTS `mst_branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_branch` (
  `Branch_Id` smallint NOT NULL,
  `Org_Id` smallint NOT NULL,
  `Branch_Code` varchar(30) NOT NULL,
  `Branch_Name` varchar(150) NOT NULL,
  `Open_Date` date DEFAULT NULL,
  `Address_line1` varchar(250) DEFAULT NULL,
  `Address_line2` varchar(250) DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL,
  `State` varchar(100) DEFAULT NULL,
  `Pincode` varchar(15) DEFAULT NULL,
  `Contact` varchar(30) DEFAULT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `Latitude` decimal(10,7) DEFAULT NULL,
  `Longitude` decimal(10,7) DEFAULT NULL,
  `Status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  PRIMARY KEY (`Branch_Id`),
  UNIQUE KEY `uk_branch` (`Org_Id`,`Branch_Code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_branch`
--

LOCK TABLES `mst_branch` WRITE;
/*!40000 ALTER TABLE `mst_branch` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_department`
--

DROP TABLE IF EXISTS `mst_department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_department` (
  `Dept_Id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `Org_Id` smallint unsigned NOT NULL,
  `Dept_Cd` varchar(30) NOT NULL,
  `Dept_Name` varchar(150) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  PRIMARY KEY (`Dept_Id`),
  UNIQUE KEY `uk_department` (`Org_Id`,`Dept_Cd`),
  CONSTRAINT `fk_department_org` FOREIGN KEY (`Org_Id`) REFERENCES `mst_organization` (`Org_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_department`
--

LOCK TABLES `mst_department` WRITE;
/*!40000 ALTER TABLE `mst_department` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_designation`
--

DROP TABLE IF EXISTS `mst_designation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_designation` (
  `Desig_Id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `Org_Id` smallint unsigned NOT NULL,
  `Desig_Code` varchar(30) NOT NULL,
  `Desig_Name` varchar(150) NOT NULL,
  `Level_No` smallint DEFAULT '0',
  `Status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  PRIMARY KEY (`Desig_Id`),
  UNIQUE KEY `uk_designation` (`Org_Id`,`Desig_Code`),
  CONSTRAINT `fk_designation_org` FOREIGN KEY (`Org_Id`) REFERENCES `mst_organization` (`Org_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_designation`
--

LOCK TABLES `mst_designation` WRITE;
/*!40000 ALTER TABLE `mst_designation` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_designation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_devices`
--

DROP TABLE IF EXISTS `mst_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_devices` (
  `Device_id` smallint NOT NULL AUTO_INCREMENT,
  `Device_name` varchar(100) NOT NULL,
  `Ip_address` varchar(45) NOT NULL,
  `Port` int DEFAULT '4370',
  `Location` varchar(100) DEFAULT NULL,
  `Device_model` varchar(50) DEFAULT NULL,
  `Status` enum('Active','Inactive','Maintenance') DEFAULT 'Active',
  `Last_sync_time` datetime DEFAULT NULL,
  `Created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_devices`
--

LOCK TABLES `mst_devices` WRITE;
/*!40000 ALTER TABLE `mst_devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_employee`
--

DROP TABLE IF EXISTS `mst_employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_employee` (
  `Employee_id` int unsigned NOT NULL AUTO_INCREMENT,
  `Org_id` smallint unsigned NOT NULL,
  `Employee_code` varchar(30) NOT NULL,
  `Title` smallint DEFAULT NULL,
  `First_name` varchar(100) NOT NULL,
  `Middle_name` varchar(100) DEFAULT NULL,
  `Last_name` varchar(100) DEFAULT NULL,
  `Display_name` varchar(250) DEFAULT NULL,
  `Gender` smallint DEFAULT NULL,
  `Date_of_birth` date DEFAULT NULL,
  `Blood_group` smallint DEFAULT NULL,
  `Marital_status` smallint DEFAULT NULL,
  `Father_name` varchar(200) DEFAULT NULL,
  `Mother_name` varchar(200) DEFAULT NULL,
  `Spouse_name` varchar(200) DEFAULT NULL,
  `Mobile` varchar(30) DEFAULT NULL,
  `Alternate_mobile` varchar(30) DEFAULT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `Address_line1` varchar(250) DEFAULT NULL,
  `Address_line2` varchar(250) DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL,
  `State` varchar(100) DEFAULT NULL,
  `Country` varchar(100) DEFAULT 'India',
  `Pincode` varchar(15) DEFAULT NULL,
  `Emergency_contact` varchar(30) DEFAULT NULL,
  `Branch_Id` smallint unsigned DEFAULT NULL,
  `Dept_Id` smallint unsigned DEFAULT NULL,
  `Desig_Id` smallint unsigned DEFAULT NULL,
  `Grade_Id` smallint unsigned DEFAULT NULL,
  `Shift_id` smallint unsigned DEFAULT NULL,
  `Emp_type_id` smallint unsigned DEFAULT NULL,
  `Reporting_manager_id` int unsigned DEFAULT NULL,
  `Date_of_joining` date NOT NULL,
  `Confirmation_date` date DEFAULT NULL,
  `Probation_end_date` date DEFAULT NULL,
  `Employment_status` smallint unsigned DEFAULT NULL,
  `Work_location` varchar(150) DEFAULT NULL,
  `Photo_path` varchar(500) DEFAULT NULL,
  `Created_by` smallint NOT NULL,
  `Created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Employee_id`),
  UNIQUE KEY `uk_employee_code` (`Org_id`,`Employee_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_employee`
--

LOCK TABLES `mst_employee` WRITE;
/*!40000 ALTER TABLE `mst_employee` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_employee_bank`
--

DROP TABLE IF EXISTS `mst_employee_bank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_employee_bank` (
  `Employee_bank_id` int unsigned NOT NULL AUTO_INCREMENT,
  `Employee_id` int unsigned NOT NULL,
  `Bank_name` varchar(150) NOT NULL,
  `Branch_name` varchar(150) DEFAULT NULL,
  `Account_holder_name` varchar(200) DEFAULT NULL,
  `Account_number` varchar(100) NOT NULL,
  `Ifsc_code` varchar(20) DEFAULT NULL,
  `Account_type` varchar(30) DEFAULT NULL,
  `Is_primary` tinyint(1) DEFAULT '1',
  `Created_by` smallint DEFAULT NULL,
  `Created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Employee_bank_id`),
  KEY `fk_employee_bank_employee` (`Employee_id`),
  CONSTRAINT `fk_employee_bank_employee` FOREIGN KEY (`Employee_id`) REFERENCES `mst_employee` (`Employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_employee_bank`
--

LOCK TABLES `mst_employee_bank` WRITE;
/*!40000 ALTER TABLE `mst_employee_bank` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_employee_bank` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_employee_identification`
--

DROP TABLE IF EXISTS `mst_employee_identification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_employee_identification` (
  `Identification_id` int unsigned NOT NULL AUTO_INCREMENT,
  `Employee_id` int unsigned NOT NULL,
  `Id_type` smallint NOT NULL,
  `Id_number` varchar(150) NOT NULL,
  `Issue_date` date DEFAULT NULL,
  `Expiry_date` date DEFAULT NULL,
  `Document_path` varchar(500) DEFAULT NULL,
  `Verified` tinyint(1) DEFAULT '0',
  `Verified_by` smallint unsigned DEFAULT NULL,
  `Verified_at` datetime DEFAULT NULL,
  `Created_by` smallint DEFAULT NULL,
  `Created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Identification_id`),
  KEY `idx_emp_identification` (`Employee_id`),
  CONSTRAINT `fk_emp_identification_employee` FOREIGN KEY (`Employee_id`) REFERENCES `mst_employee` (`Employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_employee_identification`
--

LOCK TABLES `mst_employee_identification` WRITE;
/*!40000 ALTER TABLE `mst_employee_identification` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_employee_identification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_employee_statutory`
--

DROP TABLE IF EXISTS `mst_employee_statutory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_employee_statutory` (
  `Statutory_id` int unsigned NOT NULL AUTO_INCREMENT,
  `Employee_id` int unsigned NOT NULL,
  `Pf_no` varchar(50) DEFAULT NULL,
  `Uan_no` varchar(30) DEFAULT NULL,
  `Esi_no` varchar(50) DEFAULT NULL,
  `PTax_no` varchar(50) DEFAULT NULL,
  `Tds_applicable` tinyint(1) DEFAULT '1',
  `Created_by` smallint DEFAULT NULL,
  `Created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Statutory_id`),
  UNIQUE KEY `uk_employee_statutory` (`Employee_id`),
  CONSTRAINT `fk_employee_statutory_employee` FOREIGN KEY (`Employee_id`) REFERENCES `mst_employee` (`Employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_employee_statutory`
--

LOCK TABLES `mst_employee_statutory` WRITE;
/*!40000 ALTER TABLE `mst_employee_statutory` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_employee_statutory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_employment_status`
--

DROP TABLE IF EXISTS `mst_employment_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_employment_status` (
  `Emp_status_id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `Org_Id` smallint unsigned NOT NULL,
  `Status_code` varchar(30) NOT NULL,
  `Status_name` varchar(100) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  PRIMARY KEY (`Emp_status_id`),
  UNIQUE KEY `uk_status_type` (`Org_Id`,`Status_code`),
  CONSTRAINT `fk_employment_status_org` FOREIGN KEY (`Org_Id`) REFERENCES `mst_organization` (`Org_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_employment_status`
--

LOCK TABLES `mst_employment_status` WRITE;
/*!40000 ALTER TABLE `mst_employment_status` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_employment_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_employment_type`
--

DROP TABLE IF EXISTS `mst_employment_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_employment_type` (
  `Emp_type_id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `Org_Id` smallint unsigned NOT NULL,
  `Type_code` varchar(30) NOT NULL,
  `Type_name` varchar(100) NOT NULL,
  `Is_payroll_applicable` tinyint(1) DEFAULT '1',
  `Status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  PRIMARY KEY (`Emp_type_id`),
  UNIQUE KEY `uk_employment_type` (`Org_Id`,`Type_code`),
  CONSTRAINT `fk_employment_type_org` FOREIGN KEY (`Org_Id`) REFERENCES `mst_organization` (`Org_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_employment_type`
--

LOCK TABLES `mst_employment_type` WRITE;
/*!40000 ALTER TABLE `mst_employment_type` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_employment_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_grade`
--

DROP TABLE IF EXISTS `mst_grade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_grade` (
  `Grade_Id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `Org_Id` smallint unsigned NOT NULL,
  `Grade_Code` varchar(30) NOT NULL,
  `Grade_Name` varchar(100) NOT NULL,
  `Min_salary` decimal(10,2) NOT NULL DEFAULT '0.00',
  `Max_salary` decimal(10,2) NOT NULL DEFAULT '0.00',
  `Pay_Band` varchar(255) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  PRIMARY KEY (`Grade_Id`),
  UNIQUE KEY `uk_grade` (`Org_Id`,`Grade_Code`),
  CONSTRAINT `fk_grade_org` FOREIGN KEY (`Org_Id`) REFERENCES `mst_organization` (`Org_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_grade`
--

LOCK TABLES `mst_grade` WRITE;
/*!40000 ALTER TABLE `mst_grade` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_grade` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_grade_salary`
--

DROP TABLE IF EXISTS `mst_grade_salary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_grade_salary` (
  `Inc_Id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `Grade_Id` smallint unsigned NOT NULL,
  `Scale_Frm` decimal(10,2) NOT NULL,
  `Yr_Inc` decimal(10,2) NOT NULL,
  `Scale_Upto` decimal(10,2) NOT NULL,
  `Status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  PRIMARY KEY (`Inc_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_grade_salary`
--

LOCK TABLES `mst_grade_salary` WRITE;
/*!40000 ALTER TABLE `mst_grade_salary` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_grade_salary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_holiday`
--

DROP TABLE IF EXISTS `mst_holiday`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_holiday` (
  `Holiday_id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `Org_Id` smallint unsigned NOT NULL,
  `Holiday_date` date NOT NULL,
  `Holiday_name` varchar(150) NOT NULL,
  `Holiday_type` enum('NATIONAL','FESTIVAL','REGIONAL','OPTIONAL','OTHER') DEFAULT 'OTHER',
  `Is_optional` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`Holiday_id`),
  UNIQUE KEY `uk_calendar_date` (`Holiday_id`,`Holiday_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_holiday`
--

LOCK TABLES `mst_holiday` WRITE;
/*!40000 ALTER TABLE `mst_holiday` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_holiday` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_organization`
--

DROP TABLE IF EXISTS `mst_organization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_organization` (
  `Org_Id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `Org_Cd` varchar(30) NOT NULL,
  `Org_Name` varchar(250) NOT NULL,
  `Legal_Name` varchar(250) DEFAULT NULL,
  `Regd_No` varchar(100) DEFAULT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `Contact` varchar(30) DEFAULT NULL,
  `Website` varchar(200) DEFAULT NULL,
  `Address_line1` varchar(250) DEFAULT NULL,
  `Address_line2` varchar(250) DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL,
  `State` varchar(100) DEFAULT NULL,
  `Country` varchar(100) DEFAULT 'India',
  `Pincode` varchar(15) DEFAULT NULL,
  `Logo_Path` varchar(500) DEFAULT NULL,
  `Status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `Created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Org_Id`),
  UNIQUE KEY `Org_Cd` (`Org_Cd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_organization`
--

LOCK TABLES `mst_organization` WRITE;
/*!40000 ALTER TABLE `mst_organization` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_organization` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_work_shift`
--

DROP TABLE IF EXISTS `mst_work_shift`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_work_shift` (
  `Shift_id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `Org_Id` smallint unsigned NOT NULL,
  `Shift_code` varchar(30) NOT NULL,
  `Shift_name` varchar(100) NOT NULL,
  `Start_time` time NOT NULL,
  `End_time` time NOT NULL,
  `Overtime_hr` decimal(8,2) DEFAULT NULL,
  `Status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  PRIMARY KEY (`Shift_id`),
  UNIQUE KEY `uk_employment_type` (`Org_Id`,`Shift_code`),
  CONSTRAINT `fk_work_shift_org` FOREIGN KEY (`Org_Id`) REFERENCES `mst_organization` (`Org_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_work_shift`
--

LOCK TABLES `mst_work_shift` WRITE;
/*!40000 ALTER TABLE `mst_work_shift` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_work_shift` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trans_attendance`
--

DROP TABLE IF EXISTS `trans_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trans_attendance` (
  `Attendance_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `Employee_id` int unsigned NOT NULL,
  `Attendance_date` date NOT NULL,
  `Shift_id` smallint unsigned DEFAULT NULL,
  `Check_in` datetime DEFAULT NULL,
  `Check_out` datetime DEFAULT NULL,
  `Working_minutes` int DEFAULT '0',
  `Overtime_minutes` int DEFAULT '0',
  `Attendance_status` smallint DEFAULT '2',
  `Source` smallint DEFAULT '4',
  `Late_minutes` int DEFAULT '0',
  `Early_leave_minutes` int DEFAULT '0',
  `Remarks` varchar(500) DEFAULT NULL,
  `Created_by` smallint DEFAULT NULL,
  `Created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Attendance_id`),
  UNIQUE KEY `uk_employee_attendance` (`Employee_id`,`Attendance_date`),
  KEY `idx_attendance_date` (`Attendance_date`),
  KEY `idx_attendance_status` (`Attendance_status`),
  KEY `fk_attendance_shift` (`Shift_id`),
  CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`Employee_id`) REFERENCES `mst_employee` (`Employee_id`),
  CONSTRAINT `fk_attendance_shift` FOREIGN KEY (`Shift_id`) REFERENCES `mst_work_shift` (`Shift_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trans_attendance`
--

LOCK TABLES `trans_attendance` WRITE;
/*!40000 ALTER TABLE `trans_attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `trans_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trans_attendance_punch`
--

DROP TABLE IF EXISTS `trans_attendance_punch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trans_attendance_punch` (
  `Punch_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `Employee_id` int unsigned NOT NULL,
  `Punch_time` datetime NOT NULL,
  `Punch_type` smallint DEFAULT '3',
  `Source` smallint DEFAULT '1',
  `Device_id` smallint DEFAULT NULL,
  `Latitude` decimal(10,7) DEFAULT NULL,
  `Longitude` decimal(10,7) DEFAULT NULL,
  `Raw_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `Created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Punch_id`),
  KEY `idx_punch_employee` (`Employee_id`),
  KEY `idx_punch_time` (`Punch_time`),
  CONSTRAINT `fk_punch_employee` FOREIGN KEY (`Employee_id`) REFERENCES `mst_employee` (`Employee_id`),
  CONSTRAINT `trans_attendance_punch_chk_1` CHECK (json_valid(`Raw_data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trans_attendance_punch`
--

LOCK TABLES `trans_attendance_punch` WRITE;
/*!40000 ALTER TABLE `trans_attendance_punch` DISABLE KEYS */;
/*!40000 ALTER TABLE `trans_attendance_punch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trans_employee_service_history`
--

DROP TABLE IF EXISTS `trans_employee_service_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trans_employee_service_history` (
  `History_id` int unsigned NOT NULL AUTO_INCREMENT,
  `Employee_id` int unsigned NOT NULL,
  `Event_type` smallint NOT NULL,
  `Effective_date` date NOT NULL,
  `Old_Id` int unsigned DEFAULT NULL,
  `New_Id` int unsigned DEFAULT NULL,
  `Old_Amount` decimal(12,2) DEFAULT NULL,
  `New_Amount` decimal(12,2) DEFAULT NULL,
  `Remarks` text,
  `Created_by` smallint unsigned DEFAULT NULL,
  `Created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`History_id`),
  KEY `idx_service_date` (`Effective_date`),
  KEY `idx_service_employee` (`Employee_id`),
  CONSTRAINT `fk_service_employee` FOREIGN KEY (`Employee_id`) REFERENCES `mst_employee` (`Employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trans_employee_service_history`
--

LOCK TABLES `trans_employee_service_history` WRITE;
/*!40000 ALTER TABLE `trans_employee_service_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `trans_employee_service_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trans_employee_shift`
--

DROP TABLE IF EXISTS `trans_employee_shift`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trans_employee_shift` (
  `Employee_shift_id` int unsigned NOT NULL AUTO_INCREMENT,
  `Employee_id` int unsigned NOT NULL,
  `Shift_id` smallint unsigned NOT NULL,
  `From_date` date NOT NULL,
  `To_date` date DEFAULT NULL,
  `Created_by` smallint unsigned DEFAULT NULL,
  `Created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Employee_shift_id`),
  KEY `idx_employee_shift` (`Employee_id`),
  KEY `idx_shift_date` (`From_date`),
  KEY `fk_employee_shift_master` (`Shift_id`),
  CONSTRAINT `fk_employee_shift_employee` FOREIGN KEY (`Employee_id`) REFERENCES `mst_employee` (`Employee_id`),
  CONSTRAINT `fk_employee_shift_master` FOREIGN KEY (`Shift_id`) REFERENCES `mst_work_shift` (`Shift_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trans_employee_shift`
--

LOCK TABLES `trans_employee_shift` WRITE;
/*!40000 ALTER TABLE `trans_employee_shift` DISABLE KEYS */;
/*!40000 ALTER TABLE `trans_employee_shift` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-28 13:19:02
