-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 16, 2024 at 03:55 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dormitorymaintenance_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `permission_id` varchar(9) NOT NULL,
  `permission_name` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`permission_id`, `permission_name`) VALUES
('PER000001', '11111111111111111111');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_ID` varchar(9) NOT NULL,
  `role_Name` varchar(30) NOT NULL,
  `role_dateAdd` datetime NOT NULL,
  `role_dateEdit` datetime NOT NULL,
  `role_permissions` varchar(9) NOT NULL,
  `role_User_ID` varchar(9) NOT NULL,
  `role_Status_ID` varchar(9) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_ID`, `role_Name`, `role_dateAdd`, `role_dateEdit`, `role_permissions`, `role_User_ID`, `role_Status_ID`) VALUES
('ROL000001', 'ผู้พักอาศัย', '2024-07-30 16:20:04', '2024-07-30 16:20:04', '', 'USE000001', 'STA000006'),
('ROL000002', 'ผู้ดูแลระบบ', '2024-07-30 16:21:39', '2024-07-30 16:21:39', 'PER000001', 'USE000001', 'STA000006');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` varchar(9) NOT NULL,
  `permission_id` varchar(9) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room`
--

CREATE TABLE `room` (
  `room_ID` varchar(3) NOT NULL,
  `room_User_ID` varchar(9) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `room`
--

INSERT INTO `room` (`room_ID`, `room_User_ID`) VALUES
('101', 'USE000001');

-- --------------------------------------------------------

--
-- Table structure for table `status`
--

CREATE TABLE `status` (
  `stat_ID` varchar(9) NOT NULL,
  `stat_Name` varchar(30) NOT NULL,
  `stat_StatTypID` varchar(9) NOT NULL,
  `stat_DateAdd` datetime NOT NULL,
  `stat_dateEdit` datetime NOT NULL,
  `stat_stat_ID` varchar(9) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `status`
--

INSERT INTO `status` (`stat_ID`, `stat_Name`, `stat_StatTypID`, `stat_DateAdd`, `stat_dateEdit`, `stat_stat_ID`) VALUES
('STA000001', 'ืืิืืพัก', 'STT000001', '2024-07-30 15:57:47', '2024-07-30 15:57:47', 'STA000006'),
('STA000002', 'สิ้นสุดการพัก', 'STT000001', '2024-07-30 16:00:08', '2024-07-30 16:00:08', 'STA000006'),
('STA000003', 'ปฎิบัติหน้าที่', 'STT000001', '2024-07-30 16:10:29', '2024-07-30 16:10:29', 'STA000006'),
('STA000004', 'สิ้นสุดการปฎิบัติหน้าที่', 'STT000001', '2024-07-30 16:10:29', '2024-07-30 16:10:29', 'STA000006'),
('STA000005', 'ยกเลิกการใช้งาน', 'STT000002', '2024-07-30 16:12:31', '2024-07-30 16:12:31', ''),
('STA000006', 'ใช้งาน', 'STT000002', '2024-07-30 16:13:37', '2024-07-30 16:13:37', '');

-- --------------------------------------------------------

--
-- Table structure for table `statustype`
--

CREATE TABLE `statustype` (
  `statTyp_ID` varchar(9) NOT NULL,
  `stat_Name` varchar(20) NOT NULL,
  `stat_stat_ID` varchar(9) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `statustype`
--

INSERT INTO `statustype` (`statTyp_ID`, `stat_Name`, `stat_stat_ID`) VALUES
('STT000001', 'สถานะผู้ใช้งาน', 'STA000006'),
('STT000002', 'สถานะการใช้งานสถานะ', 'STA000006');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_ID` varchar(9) NOT NULL,
  `user_Fname` varchar(50) NOT NULL,
  `user_Lname` varchar(50) NOT NULL,
  `user_Email` varchar(30) NOT NULL,
  `user_Phone` varchar(10) NOT NULL,
  `user_Name` varchar(50) DEFAULT NULL,
  `user_Password` text NOT NULL,
  `user_Bdate` date NOT NULL,
  `user_DateAdd` datetime NOT NULL,
  `user_DateEdit` datetime NOT NULL,
  `user_Role_ID` varchar(9) NOT NULL,
  `user_Status_ID` varchar(9) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_ID`, `user_Fname`, `user_Lname`, `user_Email`, `user_Phone`, `user_Name`, `user_Password`, `user_Bdate`, `user_DateAdd`, `user_DateEdit`, `user_Role_ID`, `user_Status_ID`) VALUES
('USE000001', 'หัสนัย', 'หม้อยา', '้hatsanai022com@gmail.com', '0980300822', 'hatsanai', '$2b$10$BsyVew0t11C9jcfQCT1ygu4OJyC3do/p1RUsWP6tq3oGtjOtM1SBm', '2017-04-04', '2024-07-30 16:22:15', '2024-07-30 16:22:15', 'ROL000002', 'STA000003');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`permission_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_ID`);

--
-- Indexes for table `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`room_ID`);

--
-- Indexes for table `status`
--
ALTER TABLE `status`
  ADD PRIMARY KEY (`stat_ID`);

--
-- Indexes for table `statustype`
--
ALTER TABLE `statustype`
  ADD PRIMARY KEY (`statTyp_ID`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
