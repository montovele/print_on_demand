-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: print_on_demand
-- ------------------------------------------------------
-- Server version	8.0.44

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
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('29ab35cc-8e88-4217-8536-3791dd87dae3','4de2868d21e2ab2125469339aa98b63a6b02571b1ea96289f055b9c9a4054db7','2026-11-14 23:41:58.576','20261114150000_standalone_customer_accounts',NULL,NULL,'2026-11-14 23:41:58.130',1),('4c15d7ec-bd4e-4632-afa9-300bc056403a','5872952fd20591a7d4c26e37bb511a18428ec6f71da0bb520298fb32bf632512','2026-11-09 06:56:16.165','20261109065615_support_tickets',NULL,NULL,'2026-11-09 06:56:15.793',1),('57ef8be9-57ff-4004-b5e1-929d3a16828d','3b526d2d566d61cd2ebbd079bb3ccc7b7b2325fd6b97dff10df264536a60dfa0','2026-11-10 17:29:12.807','20261110173000_support_sla_history',NULL,NULL,'2026-11-10 17:29:12.119',1),('6147bb14-7c41-43bc-9908-48d232a6eb85','7f62145926a86f8f7dacaf9779d6578ddd784045ac5de28ec0dde6ff59d05464','2026-11-11 22:40:00.277','20261111150000_customer_storefront_checkout',NULL,NULL,'2026-11-11 22:39:59.125',1),('7167959a-d532-440f-9382-ea576efcd005','0005676fcfe6908b17df636450cd180ea0d3048619b88d13fb49b4821d4ce12f','2026-11-07 05:26:59.283','20261107052656_in_house_production',NULL,NULL,'2026-11-07 05:26:56.895',1),('868aa786-8aaf-4345-90f8-422199e2c107','81331d8fbb537ca98ef99bcd4a6a469aac0f7a2e57a186d71f9f5065792959a5','2026-11-07 05:10:38.516','20261107051036_init',NULL,NULL,'2026-11-07 05:10:36.207',1),('986d131c-4e6f-42c3-bf77-a2a5141bc66c','7108a5c928d387054b44761336bd7cc4dd245f233ba115c5ec8e89437ea57202','2026-11-19 01:46:12.139','20261118170000_ups_shipping_lifecycle',NULL,NULL,'2026-11-19 01:46:11.695',1),('bbdc3cbf-57b1-40cb-91c9-e2001bf41208','dd459ba5bdb56e5929375ac8133f23b63c4648d77f3a3376f5e91bb457a38f07','2026-11-10 17:36:40.176','20261110183000_support_sla_backfill',NULL,NULL,'2026-11-10 17:36:40.108',1),('c6986351-9f15-4dd8-aab7-5e7b2775e26f','fd16462ba56d4f2c36b180dc23e81708a91a638468997bdcca30ea1a7af10d61','2026-11-07 19:54:33.068','20261107194200_product_designer',NULL,NULL,'2026-11-07 19:54:32.427',1),('e3b3ca87-74ac-424c-a1ed-ea72d445f47f','0337c208417fd523d870f4ae45135640f073dc2a020fa14ba046d6410fb5c076',NULL,'20261114150000_standalone_customer_accounts','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20261114150000_standalone_customer_accounts\n\nDatabase error code: 1826\n\nDatabase error:\nDuplicate foreign key constraint name \'AuthSession_tenantId_fkey\'\n\nPlease check the query number 3 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20261114150000_standalone_customer_accounts\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20261114150000_standalone_customer_accounts\"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260','2026-11-14 23:41:53.076','2026-11-14 23:39:53.901',0);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authsession`
--

DROP TABLE IF EXISTS `authsession`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authsession` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenHash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `csrfToken` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `AuthSession_tokenHash_key` (`tokenHash`),
  KEY `AuthSession_userId_expiresAt_idx` (`userId`,`expiresAt`),
  KEY `AuthSession_tenantId_idx` (`tenantId`),
  KEY `AuthSession_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `AuthSession_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AuthSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authsession`
--

LOCK TABLES `authsession` WRITE;
/*!40000 ALTER TABLE `authsession` DISABLE KEYS */;
INSERT INTO `authsession` VALUES ('cmwcm775x0009waoszuor0xl7','65f445edde907536de0adf6145570e066d7bdf1851d68b6e55b9bf4e43ee07cd','UkBqNVs7AaoE1XPeAYd9yEoXfktn_6ww9c06_egIqtY','cmwcm51440000waos3kywmmv5','cmwcm514y0001waos6id64idn','2026-11-25 21:12:06.404','2026-11-11 21:12:06.406'),('cmweg5sfo0004wa7se68zu5kl','7d2276dcd6ef4f76cdbc4bb6fb4017f2fce54166fd93cf3250fec766f6b78084','Dz8DzIaCFHCaCti2J_0EB7XOVGtyoOTlF_MYjjUANAs','cmweg5sd70000wa7sbrbhkgas','cmwcm514y0001waos6id64idn','2026-11-27 03:58:35.308','2026-11-13 03:58:35.316'),('cmwlnx8yn0003wa1weboxf2qg','5d891b2821738443f41e1201317f0cc110fe50682090f2c1c7e4ce42e1246602','yCxG3XatA_rsOEMnEhBy2xSDQqKMa65bsSkIf2Q57gw','cmwcm51440000waos3kywmmv5','cmwcm514y0001waos6id64idn','2026-12-02 05:10:16.990','2026-11-18 05:10:16.991'),('cmwnxqnoi0001wamwtvt1dqfk','c26068f2aa4489a34ede19792c39bbde442083f035221afbb250ea528cddc457','fRGYc8JmzyCNNzm78WALtJwa_H_ZA_2HLTSjgt9vJpM','cmwnxmjs70000waccrlxk41my','cmwnxmjuh0001wacc1iq2bx2h','2026-12-03 19:20:37.984','2026-11-19 19:20:37.986'),('cmwnytnp50001wa78xebld427','581dd9fa3f0b91d3bf4cc6c051e49c6ee69568e6c37382252636f45c8d1242d7','R-YNzq4R5iHTupP-u5oKTxwDL-0QT_LVNLx9Yc0dO58','cmweg5sd70000wa7sbrbhkgas',NULL,'2026-12-03 19:50:57.573','2026-11-19 19:50:57.582'),('cmwnyznez0003wa781edogm0b','c3266e9ad3cd7c295b51d50c8369a9fdee6307a0e204e22560a4e42fe16128df','ZeS5NwYlmKuTp99iPZwy311ctGML1zwo7UNulpCV8Tc','cmwcm51440000waos3kywmmv5','cmwcm514y0001waos6id64idn','2026-12-03 19:55:37.161','2026-11-19 19:55:37.163');
/*!40000 ALTER TABLE `authsession` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customeraccount`
--

DROP TABLE IF EXISTS `customeraccount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customeraccount` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CustomerAccount_userId_key` (`userId`),
  CONSTRAINT `CustomerAccount_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customeraccount`
--

LOCK TABLES `customeraccount` WRITE;
/*!40000 ALTER TABLE `customeraccount` DISABLE KEYS */;
INSERT INTO `customeraccount` VALUES ('customer_b150cc0be08411f19b2f80e8','cmw5y6z5k0000wao034ntez6e','2026-11-14 15:39:53.999'),('customer_b150ed64e08411f19b2f80e8','cmw8ghqc30000waewf9nes5od','2026-11-14 15:39:53.999'),('customer_b1511445e08411f19b2f80e8','cmwd5hb4u000kwasw5g0p2v8h','2026-11-14 15:39:53.999'),('customer_b15118cfe08411f19b2f80e8','cmweg5sd70000wa7sbrbhkgas','2026-11-14 15:39:53.999');
/*!40000 ALTER TABLE `customeraccount` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machine`
--

DROP TABLE IF EXISTS `machine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `technology` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','maintenance','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `location` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hourlyRate` decimal(12,2) NOT NULL DEFAULT '0.00',
  `maintenanceDueAt` datetime(3) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Machine_tenantId_status_idx` (`tenantId`,`status`),
  CONSTRAINT `Machine_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machine`
--

LOCK TABLES `machine` WRITE;
/*!40000 ALTER TABLE `machine` DISABLE KEYS */;
/*!40000 ALTER TABLE `machine` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material`
--

DROP TABLE IF EXISTS `material`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `onHand` decimal(14,3) NOT NULL DEFAULT '0.000',
  `reorderPoint` decimal(14,3) NOT NULL DEFAULT '0.000',
  `unitCost` decimal(12,4) NOT NULL DEFAULT '0.0000',
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MXN',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Material_tenantId_sku_key` (`tenantId`,`sku`),
  KEY `Material_tenantId_isActive_name_idx` (`tenantId`,`isActive`,`name`),
  CONSTRAINT `Material_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material`
--

LOCK TABLES `material` WRITE;
/*!40000 ALTER TABLE `material` DISABLE KEYS */;
/*!40000 ALTER TABLE `material` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order`
--

DROP TABLE IF EXISTS `order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storeName` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Manual',
  `externalOrderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderNumber` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MXN',
  `customerTotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `providerTotal` decimal(12,2) DEFAULT NULL,
  `status` enum('received','validation_pending','awaiting_approval','submitted','accepted','in_production','shipped','delivered','cancel_requested','cancelled','failed','action_required') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `customerUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shippingAddress` json DEFAULT NULL,
  `shippingTotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `paymentStatus` enum('not_required','pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_required',
  `stripeCheckoutSessionId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripePaymentIntentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paidAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Order_tenantId_storeName_externalOrderId_key` (`tenantId`,`storeName`,`externalOrderId`),
  UNIQUE KEY `Order_stripeCheckoutSessionId_key` (`stripeCheckoutSessionId`),
  KEY `Order_tenantId_status_createdAt_idx` (`tenantId`,`status`,`createdAt`),
  KEY `Order_tenantId_customerUserId_createdAt_idx` (`tenantId`,`customerUserId`,`createdAt`),
  KEY `Order_tenantId_paymentStatus_createdAt_idx` (`tenantId`,`paymentStatus`,`createdAt`),
  KEY `Order_customerUserId_fkey` (`customerUserId`),
  CONSTRAINT `Order_customerUserId_fkey` FOREIGN KEY (`customerUserId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
INSERT INTO `order` VALUES ('00da7a41-c6d8-469e-b828-b9b59158ab6b','cmwcm514y0001waos6id64idn','SAM STORE',NULL,'WEB-00DA7A41C6','vgvhgvhgvghv','MXN',29900.00,NULL,'received','2026-11-13 20:28:54.342','2026-11-13 20:28:55.513','cmweg5sd70000wa7sbrbhkgas','ernesto@gmail.com','{\"city\": \"huyhuyhuyh\", \"line1\": \"minhbubghbh\", \"line2\": \"\", \"phone\": \"00000000000\", \"state\": \"hbhbhbh\", \"country\": \"MX\", \"recipient\": \"vgvhgvhgvghv\", \"postalCode\": \"00000000\"}',0.00,'failed',NULL,NULL,NULL);
/*!40000 ALTER TABLE `order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orderitem`
--

DROP TABLE IF EXISTS `orderitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orderitem` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `unitSalePrice` decimal(12,2) NOT NULL,
  `unitProviderCost` decimal(12,2) DEFAULT NULL,
  `variantName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designConfig` json DEFAULT NULL,
  `printInstructions` text COLLATE utf8mb4_unicode_ci,
  `artworkAssetId` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `OrderItem_artworkAssetId_key` (`artworkAssetId`),
  KEY `OrderItem_orderId_idx` (`orderId`),
  KEY `OrderItem_productId_fkey` (`productId`),
  CONSTRAINT `OrderItem_artworkAssetId_fkey` FOREIGN KEY (`artworkAssetId`) REFERENCES `productartworkasset` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderitem`
--

LOCK TABLES `orderitem` WRITE;
/*!40000 ALTER TABLE `orderitem` DISABLE KEYS */;
INSERT INTO `orderitem` VALUES ('cmwffjcg80001wacc3a5dt2lr','00da7a41-c6d8-469e-b828-b9b59158ab6b','cmwcm9d3d000dwaosce0u9qjt','Playera deportiva dry-fit sublimada · Única',100,299.00,125.00,'Única','{\"x\": 50, \"y\": 31, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#511006\", \"garmentLabelText\": \"jujujhyhyhyh\", \"garmentLabelEnabled\": true}','','2a555971-3760-4a1d-a0bf-daa9b4087ab3');
/*!40000 ALTER TABLE `orderitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','processing','ready','published','sync_error','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `providerCode` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `externalProductId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `baseCost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salePrice` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MXN',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `fulfillmentMode` enum('in_house','printful') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_house',
  `manufacturingNotes` text COLLATE utf8mb4_unicode_ci,
  `productionMethod` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productionMinutes` int unsigned DEFAULT NULL,
  `artworkAssetId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designConfig` json DEFAULT NULL,
  `productType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'custom',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Product_tenantId_providerCode_externalProductId_key` (`tenantId`,`providerCode`,`externalProductId`),
  UNIQUE KEY `Product_artworkAssetId_key` (`artworkAssetId`),
  KEY `Product_tenantId_status_updatedAt_idx` (`tenantId`,`status`,`updatedAt`),
  CONSTRAINT `Product_artworkAssetId_fkey` FOREIGN KEY (`artworkAssetId`) REFERENCES `productartworkasset` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Product_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES ('cmw6t5iff0001wapowk6cc1ha','cmw5y6z660001wao0oeikt43n','Camiseta Grafica','Camiseta de algodon.','archived',NULL,NULL,100.00,350.00,'MXN','2026-11-07 19:40:07.937','2026-11-10 19:56:48.301','in_house','Acabado mate','Sublimacion',15,NULL,NULL,'custom'),('cmw8gk0aw0008waewugmeys55','cmw8ghqj40001waewfmqbppvk','Camiseta clásica personalizada',NULL,'draft',NULL,NULL,120.00,299.00,'MXN','2026-11-08 23:23:01.639','2026-11-08 23:23:01.639','in_house',NULL,'DTG',30,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','tshirt'),('cmwcm99ub000bwaossz6v69fq','cmwcm514y0001waos6id64idn','Playera clásica blanca para sublimación','Playera unisex de poliéster blanco, ideal para impresión personalizada de cobertura completa.','archived',NULL,NULL,95.00,229.00,'MXN','2026-11-11 21:13:43.081','2026-11-16 03:38:55.981','in_house','Usar playera de poliéster con recubrimiento sublimable. Transferir a 190 °C durante 45-60 s; verificar presión y enfriamiento antes de empacar.','Sublimación',18,NULL,NULL,'custom'),('cmwcm9d3d000dwaosce0u9qjt','cmwcm514y0001waos6id64idn','Playera deportiva dry-fit sublimada','Playera ligera de secado rápido para uniformes, equipos deportivos y diseños personalizados.','archived',NULL,NULL,125.00,299.00,'MXN','2026-11-11 21:13:47.401','2026-11-16 03:38:58.840','in_house','Imprimir sobre tela dry-fit blanca de poliéster. Proteger la prensa con papel siliconado y revisar alineación del diseño.','Sublimación',20,NULL,NULL,'custom'),('cmwcm9gt8000fwaosz9ft2b9l','cmwcm514y0001waos6id64idn','Playera infantil personalizada','Playera infantil de poliéster blanco para cumpleaños, escuelas y regalos personalizados.','archived',NULL,NULL,78.00,189.00,'MXN','2026-11-11 21:13:52.220','2026-11-16 03:39:02.693','in_house','Confirmar talla y centrado del arte antes de transferir. Usar temperatura adecuada para tela ligera.','Sublimación',18,NULL,NULL,'custom'),('cmwcm9hy0000hwaossm5jwhad','cmwcm514y0001waos6id64idn','Playera manga larga para sublimación','Playera de manga larga de poliéster para diseños integrales y ropa promocional.','archived',NULL,NULL,155.00,369.00,'MXN','2026-11-11 21:13:53.687','2026-11-16 03:39:06.687','in_house','Prensar frente, espalda y mangas por secciones, evitando marcas de costura y doble transferencia.','Sublimación',24,NULL,NULL,'custom'),('cmwcm9iec000jwaosrvrwk2j4','cmwcm514y0001waos6id64idn','Jersey deportivo personalizado','Jersey de poliéster para equipos, torneos y uniformes con nombres y números personalizados.','archived',NULL,NULL,210.00,499.00,'MXN','2026-11-11 21:13:54.276','2026-11-16 03:39:10.390','in_house','Verificar lista de nombres, números y tallas. Alinear paneles y prensar cada sección sin desplazar la tela.','Sublimación',28,NULL,NULL,'custom'),('cmwcm9iv8000lwaosfyxon1k4','cmwcm514y0001waos6id64idn','Taza cerámica blanca 11 oz','Taza blanca de cerámica con recubrimiento para sublimación, capacidad de 11 oz.','archived',NULL,NULL,48.00,149.00,'MXN','2026-11-11 21:13:54.884','2026-11-11 21:14:55.917','in_house','Usar resistencia para taza de 11 oz y cinta térmica. Transferir aproximadamente a 緑','Sublimación',12,NULL,NULL,'custom'),('cmwcm9jc7000nwaoser00qrlc','cmwcm514y0001waos6id64idn','Taza cerámica blanca 15 oz','Taza de cerámica de 15 oz con superficie blanca sublimable para regalos y promociones.','published',NULL,NULL,62.00,179.00,'MXN','2026-11-11 21:13:55.495','2026-11-18 05:34:12.913','in_house','Usar resistencia compatible de 15 oz. Ajustar presión uniforme y retirar el papel con guantes térmicos.','Sublimación',14,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','mug'),('cmwcm9k1y000pwaos0nec2eqr','cmwcm514y0001waos6id64idn','Taza mágica negra 11 oz','Taza termosensible negra que revela el diseño personalizado al llenarse con bebida caliente.','published',NULL,NULL,88.00,249.00,'MXN','2026-11-11 21:13:56.423','2026-11-18 05:35:01.882','in_house','Usar perfil de temperatura recomendado para recubrimiento termosensible; evitar sobrecalentamiento y enfriar gradualmente.','Sublimación',14,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','mug'),('cmwcm9kjr000rwaosj20lg9bx','cmwcm514y0001waos6id64idn','Taza cónica para latte','Taza cónica de cerámica sublimable para café latte, con diseño personalizado envolvente.','published',NULL,NULL,79.00,219.00,'MXN','2026-11-11 21:13:57.063','2026-11-18 05:35:02.835','in_house','Usar resistencia cónica adecuada. Comprobar que el papel cubra el área imprimible sin arrugas.','Sublimación',15,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','mug'),('cmwcm9l6n000twaosi8po734h','cmwcm514y0001waos6id64idn','Termo de acero blanco 20 oz','Termo de acero inoxidable con acabado blanco sublimable y tapa hermética.','published',NULL,NULL,185.00,429.00,'MXN','2026-11-11 21:13:57.887','2026-11-18 05:35:03.973','in_house','Retirar tapa y accesorios antes de prensar. Usar resistencia para termo y verificar el recubrimiento antes de producción.','Sublimación',18,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','tumbler'),('cmwcm9lp3000vwaoslve35g7g','cmwcm514y0001waos6id64idn','Botella de aluminio sublimable 600 ml','Botella ligera de aluminio blanco para agua, personalizable con impresión por sublimación.','published',NULL,NULL,105.00,269.00,'MXN','2026-11-11 21:13:58.551','2026-11-18 05:35:04.790','in_house','Quitar tapa y empaque. Asegurar la transferencia alrededor de la botella y dejar enfriar antes de volver a montar.','Sublimación',16,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','tumbler'),('cmwcm9mfd000xwaosuhi1bf4d','cmwcm514y0001waos6id64idn','Vaso skinny sublimable 20 oz','Vaso alto de acero con recubrimiento sublimable, tapa y popote reutilizable.','published',NULL,NULL,165.00,389.00,'MXN','2026-11-11 21:13:59.496','2026-11-18 05:35:05.610','in_house','Usar horno o resistencia compatible con vaso skinny; fijar el papel con cinta térmica y revisar uniformidad del color.','Sublimación',18,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','tumbler'),('cmwcm9mu9000zwaoss4hbp03e','cmwcm514y0001waos6id64idn','Cojín blanco para sublimación 40 x 40 cm','Funda de cojín de poliéster blanco con cierre, lista para diseños personalizados.','published',NULL,NULL,95.00,249.00,'MXN','2026-11-11 21:14:00.033','2026-11-18 05:35:21.737','in_house','Insertar una hoja protectora dentro de la funda para evitar transferencia al reverso. Prensar por panel.','Sublimación',18,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','pillow'),('cmwcm9nbu0011waos23g39au1','cmwcm514y0001waos6id64idn','Mouse pad sublimable  avanzad 22 x 18 cm','Tapete para mouse con superficie blanca sublimable y base antiderrapante.','archived',NULL,NULL,42.00,129.00,'MXN','2026-11-11 21:14:00.666','2026-11-11 21:14:54.726','in_house','Alinear el diseño al área útil y usar papel protector. Confirmar que la base soporte el perfil térmico aplicado.','Sublimación',12,NULL,NULL,'custom'),('cmwcm9nyf0013waos2ldp0d9x','cmwcm514y0001waos6id64idn','Rompecabezas sublimable de 120 piezas','Rompecabezas de superficie blanca para fotografías, ilustraciones y regalos personalizados.','published',NULL,NULL,58.00,169.00,'MXN','2026-11-11 21:14:01.479','2026-11-18 05:35:22.628','in_house','Colocar las piezas sobre una superficie plana y prensar con presión ligera y uniforme para evitar desplazamientos.','Sublimación',10,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','puzzle'),('cmwcm9ofo0015waossaey68da','cmwcm514y0001waos6id64idn','Llavero MDF sublimable','Llavero de MDF con placa blanca sublimable para recuerdos y artículos promocionales.','published',NULL,NULL,18.00,69.00,'MXN','2026-11-11 21:14:02.101','2026-11-18 05:35:23.466','in_house','Retirar película protectora si aplica. Usar presión moderada y ensamblar el aro después de enfriar.','Sublimación',8,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','keychain'),('cmwcm9p190017waoszrdofiqw','cmwcm514y0001waos6id64idn','Placa fotográfica MDF 20 x 25 cm','Placa decorativa de MDF con acabado blanco para fotografías y mensajes personalizados.','published',NULL,NULL,72.00,199.00,'MXN','2026-11-11 21:14:02.877','2026-11-18 05:35:24.256','in_house','Retirar película del lado imprimible, proteger la prensa con papel y evitar presión excesiva sobre los bordes.','Sublimación',12,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','photo-plaque'),('cmwcm9r7h0019waosd246bqj9','cmwcm514y0001waos6id64idn','Bolsa tote de poliéster sublimable','Bolsa reutilizable de poliéster blanco para diseños personalizados y uso cotidiano.','published',NULL,NULL,68.00,179.00,'MXN','2026-11-11 21:14:05.693','2026-11-18 05:35:25.332','in_house','Colocar cartón protector entre las capas y apartar las asas de la zona de prensado.','DTG',15,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','tote'),('cmwcm9sot001bwaosgrksqsns','cmwcm514y0001waos6id64idn','Mandil de poliéster personalizado','Mandil blanco de poliéster para cocina, cafetería y regalos con diseño personalizado.','published',NULL,NULL,115.00,289.00,'MXN','2026-11-11 21:14:07.613','2026-11-18 05:35:42.785','in_house','Acomodar tiras y bolsillos fuera del área de presión. Confirmar orientación del arte antes de transferir.','Sublimación',20,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','apron'),('cmwcm9u2i001dwaosquxe22tf','cmwcm514y0001waos6id64idn','Gorra blanca de poliéster sublimable','Gorra de poliéster blanco para personalización de panel frontal y artículos promocionales.','published',NULL,NULL,98.00,259.00,'MXN','2026-11-11 21:14:09.402','2026-11-18 05:35:43.597','in_house','Usar prensa curva y soporte interno. Mantener la costura fuera del centro del diseño y prensar el panel frontal.','Sublimación',16,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','cap'),('cmwcmatqz001fwaoshjwyjt2v','cmwcm514y0001waos6id64idn','Mouse pad sublimable 22 x 18 cm','Tapete para mouse con superficie blanca sublimable y base antiderrapante.','published',NULL,NULL,42.00,129.00,'MXN','2026-11-11 21:14:55.643','2026-11-18 05:35:44.436','in_house','Alinear el diseño al área útil y usar papel protector. Confirmar que la base soporte el perfil térmico aplicado.','Sublimación',12,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','mousepad'),('cmwcmauor001hwaosjsdvi5ng','cmwcm514y0001waos6id64idn','Taza cerámica blanca 11 oz','Taza blanca de cerámica con recubrimiento para sublimación, capacidad de 11 oz.','published',NULL,NULL,48.00,149.00,'MXN','2026-11-11 21:14:56.859','2026-11-18 05:35:45.242','in_house','Usar resistencia para taza de 11 oz y cinta térmica. Transferir entre 180 y 200 °C durante 180-240 s según la prensa y el recubrimiento; retirar con guantes térmicos.','Sublimación',12,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','mug'),('cmwco2t3f001jwaos6w5xkt5u','cmwcm514y0001waos6id64idn','Taza personalizada','jghjhgjhg','published',NULL,NULL,120.00,299.00,'MXN','2026-11-11 22:04:40.779','2026-11-18 05:36:48.320','in_house',NULL,'Sublimación',30,'c490293d-7ed3-4168-bf9d-050d59ccbec5','{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#a9abb0\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','mug'),('cmwdzhijf0001wad4n5cye3di','cmwcm514y0001waos6id64idn','Etiquetas adhesivas de papel a medida','Etiquetas impresas personalizadas en papel adhesivo. Selecciona medida y cantidad, y comparte tu arte para producirlas a tu medida.','archived',NULL,NULL,0.00,149.00,'MXN','2026-11-12 20:11:48.882','2026-11-16 03:38:51.637','in_house','BORRADOR: Administraci?n debe confirmar sustrato, dimensiones finales, costo interno y precio de cada variante antes de publicar. Las medidas y cantidades actuales son propuestas iniciales; registrar cualquier medida especial en las indicaciones del pedido.','Impresi?n digital',20,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','label-sheet'),('cmwdzhijk0009wad4fptfaril','cmwcm514y0001waos6id64idn','Etiquetas de vinil blanco a medida','Etiquetas durables impresas en vinil blanco adhesivo. Elige entre medidas y paquetes disponibles; solicita una medida especial en las indicaciones.','archived',NULL,NULL,0.00,179.00,'MXN','2026-11-12 20:11:48.882','2026-11-16 03:38:48.256','in_house','BORRADOR: Administraci?n debe confirmar sustrato, dimensiones finales, costo interno y precio de cada variante antes de publicar. Las medidas y cantidades actuales son propuestas iniciales; registrar cualquier medida especial en las indicaciones del pedido.','Impresi?n digital',20,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','label-sheet'),('cmwdzhijl000hwad4cqzi5txi','cmwcm514y0001waos6id64idn','Etiquetas de vinil transparente a medida','Etiquetas impresas en vinil transparente para una apariencia limpia sobre distintas superficies. Elige medida y cantidad disponibles.','archived',NULL,NULL,0.00,199.00,'MXN','2026-11-12 20:11:48.882','2026-11-16 03:38:44.371','in_house','BORRADOR: Administraci?n debe confirmar sustrato, dimensiones finales, costo interno y precio de cada variante antes de publicar. Las medidas y cantidades actuales son propuestas iniciales; registrar cualquier medida especial en las indicaciones del pedido.','Impresi?n digital',20,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#a9abb0\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','label-sheet'),('cmwdzhijl000pwad4em8eitah','cmwcm514y0001waos6id64idn','Etiquetas adhesivas en rollo a medida','Etiquetas personalizadas en rollo, pr?cticas para empaque y etiquetado de productos. Revisa las medidas y longitudes disponibles.','archived',NULL,NULL,0.00,699.00,'MXN','2026-11-12 20:11:48.882','2026-11-16 03:38:40.784','in_house','BORRADOR: Administraci?n debe confirmar sustrato, dimensiones finales, costo interno y precio de cada variante antes de publicar. Las medidas y cantidades actuales son propuestas iniciales; registrar cualquier medida especial en las indicaciones del pedido.','Impresi?n digital',20,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','label-roll'),('cmwdzhijm000vwad484j57cri','cmwcm514y0001waos6id64idn','Etiquetas troqueladas por pieza a medida','Etiquetas adhesivas cortadas individualmente con dise?o personalizado. Selecciona medida y cantidad del paquete.','archived',NULL,NULL,0.00,199.00,'MXN','2026-11-12 20:11:48.882','2026-11-16 03:38:37.049','in_house','BORRADOR: Administraci?n debe confirmar sustrato, dimensiones finales, costo interno y precio de cada variante antes de publicar. Las medidas y cantidades actuales son propuestas iniciales; registrar cualquier medida especial en las indicaciones del pedido.','Impresi?n digital',20,NULL,'{\"x\": 50, \"y\": 48, \"side\": \"front\", \"text\": \"\", \"color\": \"#f7f7f5\", \"scale\": 72, \"rotation\": 0, \"textColor\": \"#252632\"}','label-sheet'),('cmwim5grv0001wam0ua4fsoqh','cmwcm514y0001waos6id64idn','Nombre y bandera','Planilla personalizable de nombres y banderas en vinil reflejante o transparente.','published','pegapega','stickers-con-nombre-y-bandera',10.00,20.00,'MXN','2026-11-16 01:57:22.588','2026-11-16 03:39:45.263','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-con-nombre-y-bandera\"}','custom'),('cmwim5gvh0007wam092c79jow','cmwcm514y0001waos6id64idn','Con relieve','Sticker impreso con barniz UV localizado para aportar textura al diseño.','published','pegapega','stickers-con-relieve',10.00,20.00,'MXN','2026-11-16 01:57:22.732','2026-11-16 03:39:45.330','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-con-relieve\"}','custom'),('cmwim5gw6000hwam0xfkkn3zf','cmwcm514y0001waos6id64idn','Efecto espejo','Sticker de acabado metálico reflectante con laminado protector.','published','pegapega','stickers-espejo',10.00,20.00,'MXN','2026-11-16 01:57:22.758','2026-11-16 03:39:45.397','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-espejo\"}','custom'),('cmwim5gwn000rwam0zcqfza20','cmwcm514y0001waos6id64idn','Fantasy Glitter','Sticker holográfico con destellos multicolor.','published','pegapega','stickers-fantasy-glitter',10.00,20.00,'MXN','2026-11-16 01:57:22.774','2026-11-16 03:39:45.489','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-fantasy-glitter\"}','custom'),('cmwim5gx20010wam0bntby8u5','cmwcm514y0001waos6id64idn','Fibra de carbono','Sticker en vinil con patrón visual inspirado en fibra de carbono.','published','pegapega','stickers-fibra-de-carbono',10.00,20.00,'MXN','2026-11-16 01:57:22.791','2026-11-16 03:39:45.572','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-fibra-de-carbono\"}','custom'),('cmwim5gyn0016wam0m0zpzi4h','cmwcm514y0001waos6id64idn','Glow in the Dark','Sticker en vinil fotoluminiscente que brilla después de exponerse a la luz.','published','pegapega','stickers-glow-in-the-dark',10.00,20.00,'MXN','2026-11-16 01:57:22.847','2026-11-16 03:39:45.666','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-glow-in-the-dark\"}','custom'),('cmwim5gz4001gwam0qt3kjy1t','cmwcm514y0001waos6id64idn','Holográficos','Sticker con acabado arcoíris que cambia según la luz y el ángulo.','published','pegapega','stickers-holograficos',10.00,20.00,'MXN','2026-11-16 01:57:22.864','2026-11-16 03:39:45.892','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-holograficos\"}','custom'),('cmwim5gzi001qwam0nu1929sf','cmwcm514y0001waos6id64idn','Metálicos','Sticker de apariencia metálica disponible en dorado o plata.','published','pegapega','stickers-metalicos',10.00,20.00,'MXN','2026-11-16 01:57:22.878','2026-11-16 03:39:46.059','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-metalicos\"}','custom'),('cmwim5h0a0020wam02i8hxf5v','cmwcm514y0001waos6id64idn','Para auto · Bumper','Sticker para vehículo impreso a color en vinil con laminado mate.','published','pegapega','stickers-para-auto-bumper-stickers',10.00,20.00,'MXN','2026-11-16 01:57:22.906','2026-11-16 03:39:46.124','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-para-auto-bumper-stickers\"}','custom'),('cmwim5h0s002awam0pwy5ll4u','cmwcm514y0001waos6id64idn','Para piso · Floor Graphics','Gráfico adhesivo de alta adherencia para aplicaciones en piso.','published','pegapega','stickers-para-piso-floor-graphics',10.00,20.00,'MXN','2026-11-16 01:57:22.924','2026-11-16 03:39:46.167','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-para-piso-floor-graphics\"}','custom'),('cmwim5h16002iwam0e8wvf8a1','cmwcm514y0001waos6id64idn','Reflejantes','Sticker en vinil reflejante para señalización y objetos de uso exterior.','published','pegapega','stickers-reflejantes',10.00,20.00,'MXN','2026-11-16 01:57:22.938','2026-11-16 03:39:46.224','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-reflejantes\"}','custom'),('cmwim5h1k002swam0l8nt4yv6','cmwcm514y0001waos6id64idn','Reversibles · Adhesivo frontal','Sticker de impresión invertida para instalar en el interior del vidrio y leer desde afuera.','published','pegapega','stickers-reversibles-adhesivo-frontal',10.00,20.00,'MXN','2026-11-16 01:57:22.953','2026-11-16 03:39:46.264','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-reversibles-adhesivo-frontal\"}','custom'),('cmwim5h210031wam01gm1pzdn','cmwcm514y0001waos6id64idn','Semi troqueladas · Kiss-Cut','Sticker solicitado con corte semi-troquelado; la ficha del proveedor tiene datos que deben confirmarse.','published','pegapega','stickers-semi-troqueladas-kiss-cut',10.00,20.00,'MXN','2026-11-16 01:57:22.969','2026-11-16 03:39:46.310','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-semi-troqueladas-kiss-cut\"}','custom'),('cmwim5h2i003bwam0zx43d25t','cmwcm514y0001waos6id64idn','Transferibles','Diseño de vinil de un solo color que se aplica con película de transferencia.','published','pegapega','stickers-transferibles',10.00,20.00,'MXN','2026-11-16 01:57:22.986','2026-11-16 03:39:46.366','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-transferibles\"}','custom'),('cmwim5h2w003kwam0zdlqr9tx','cmwcm514y0001waos6id64idn','Transparentes','Sticker impreso en material transparente con opciones de tinta blanca y acabado.','published','pegapega','stickers-transparentes',10.00,20.00,'MXN','2026-11-16 01:57:23.000','2026-11-16 03:39:46.425','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stickers-transparentes\"}','custom'),('cmwim5h38003uwam0rniwr40i','cmwcm514y0001waos6id64idn','Troqueladas · Die-Cut','Sticker individual cortado siguiendo el contorno exterior del diseño.','published','pegapega','stikers-troqueladas-die-cut',10.00,20.00,'MXN','2026-11-16 01:57:23.012','2026-11-16 03:39:46.497','in_house','Catálogo de referencia consultado en Pegapega.mx. Revisar ficha original y confirmar especificaciones antes de producción.','Impresión de stickers',NULL,NULL,'{\"catalogProductId\": \"stikers-troqueladas-die-cut\"}','custom');
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productartworkasset`
--

DROP TABLE IF EXISTS `productartworkasset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productartworkasset` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storageKey` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mimeType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileSize` int unsigned NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `uploadedByUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductArtworkAsset_storageKey_key` (`storageKey`),
  KEY `ProductArtworkAsset_tenantId_createdAt_idx` (`tenantId`,`createdAt`),
  KEY `ProductArtworkAsset_uploadedByUserId_idx` (`uploadedByUserId`),
  CONSTRAINT `ProductArtworkAsset_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProductArtworkAsset_uploadedByUserId_fkey` FOREIGN KEY (`uploadedByUserId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productartworkasset`
--

LOCK TABLES `productartworkasset` WRITE;
/*!40000 ALTER TABLE `productartworkasset` DISABLE KEYS */;
INSERT INTO `productartworkasset` VALUES ('11df1af8-efb9-4de5-9f6b-e2e14ad2586c','cmwcm514y0001waos6id64idn','11df1af8-efb9-4de5-9f6b-e2e14ad2586c.jpg','image/jpeg',25804,'2026-11-12 06:22:18.982','cmwd5hb4u000kwasw5g0p2v8h'),('226cbc5e-5580-4168-9a0f-99a08d2ee968','cmwcm514y0001waos6id64idn','226cbc5e-5580-4168-9a0f-99a08d2ee968.png','image/png',2123,'2026-11-12 06:46:54.037','cmwd5hb4u000kwasw5g0p2v8h'),('2a555971-3760-4a1d-a0bf-daa9b4087ab3','cmwcm514y0001waos6id64idn','2a555971-3760-4a1d-a0bf-daa9b4087ab3.jpg','image/jpeg',25804,'2026-11-13 20:26:01.964','cmweg5sd70000wa7sbrbhkgas'),('42e58905-d6d2-4345-a588-94fe2fc1e637','cmwcm514y0001waos6id64idn','42e58905-d6d2-4345-a588-94fe2fc1e637.png','image/png',305546,'2026-11-13 05:33:36.541','cmweg5sd70000wa7sbrbhkgas'),('49b3fddd-15f5-4851-99ce-15638e736e89','cmwcm514y0001waos6id64idn','49b3fddd-15f5-4851-99ce-15638e736e89.jpg','image/jpeg',91051,'2026-11-12 20:34:03.931','cmw5y6z5k0000wao034ntez6e'),('5c727bb4-5447-423d-a8a2-fd4608dc30e1','cmwcm514y0001waos6id64idn','5c727bb4-5447-423d-a8a2-fd4608dc30e1.jpg','image/jpeg',105809,'2026-11-18 05:02:10.313','cmweg5sd70000wa7sbrbhkgas'),('66106efb-f04f-4fe2-abef-2be6f1e89c26','cmwcm514y0001waos6id64idn','66106efb-f04f-4fe2-abef-2be6f1e89c26.jpg','image/jpeg',25804,'2026-11-13 20:51:19.046','cmweg5sd70000wa7sbrbhkgas'),('6db161dc-350f-4d22-b04d-1d163b58bcf9','cmwcm514y0001waos6id64idn','6db161dc-350f-4d22-b04d-1d163b58bcf9.jpg','image/jpeg',25804,'2026-11-13 03:41:36.371','cmw5y6z5k0000wao034ntez6e'),('8d568803-9b7d-4e21-be09-e8bd5d17703f','cmwcm514y0001waos6id64idn','8d568803-9b7d-4e21-be09-e8bd5d17703f.jpg','image/jpeg',91051,'2026-11-13 00:45:48.854','cmw5y6z5k0000wao034ntez6e'),('9fef8e20-1d42-41b4-98db-568f8b483d52','cmwcm514y0001waos6id64idn','9fef8e20-1d42-41b4-98db-568f8b483d52.jpg','image/jpeg',25804,'2026-11-13 02:35:53.564','cmw5y6z5k0000wao034ntez6e'),('b8001283-2b67-4c65-a1a9-ffd7c7dff56e','cmw5y6z660001wao0oeikt43n','b8001283-2b67-4c65-a1a9-ffd7c7dff56e.jpg','image/jpeg',65899,'2026-11-09 00:57:12.390',NULL),('c490293d-7ed3-4168-bf9d-050d59ccbec5','cmwcm514y0001waos6id64idn','c490293d-7ed3-4168-bf9d-050d59ccbec5.png','image/png',305546,'2026-11-11 21:59:23.585',NULL),('d29dbcb8-60e4-4be1-bff9-67af544ed8e9','cmwcm514y0001waos6id64idn','d29dbcb8-60e4-4be1-bff9-67af544ed8e9.webp','image/webp',72874,'2026-11-16 05:03:34.622','cmweg5sd70000wa7sbrbhkgas'),('d74c0ee6-c46c-43de-b9fc-8ab16f546381','cmwcm514y0001waos6id64idn','d74c0ee6-c46c-43de-b9fc-8ab16f546381.jpg','image/jpeg',79590,'2026-11-18 06:21:52.646','cmweg5sd70000wa7sbrbhkgas'),('ea80fc85-c060-4510-a290-a5ff67ff995d','cmwcm514y0001waos6id64idn','ea80fc85-c060-4510-a290-a5ff67ff995d.jpg','image/jpeg',105809,'2026-11-18 06:21:52.593','cmweg5sd70000wa7sbrbhkgas'),('f9ca7b62-0af6-411b-afa4-2aaa9416a525','cmwcm514y0001waos6id64idn','f9ca7b62-0af6-411b-afa4-2aaa9416a525.jpg','image/jpeg',25804,'2026-11-13 20:44:03.051','cmweg5sd70000wa7sbrbhkgas');
/*!40000 ALTER TABLE `productartworkasset` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productionjob`
--

DROP TABLE IF EXISTS `productionjob`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productionjob` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderItemId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `machineId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('queued','prepress','ready','in_production','quality_check','packed','shipped','completed','blocked','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'queued',
  `quantity` int NOT NULL,
  `priority` tinyint unsigned NOT NULL DEFAULT '3',
  `productionMethod` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `blockedReason` text COLLATE utf8mb4_unicode_ci,
  `estimatedMinutes` int unsigned DEFAULT NULL,
  `scheduledAt` datetime(3) DEFAULT NULL,
  `startedAt` datetime(3) DEFAULT NULL,
  `materialsConsumedAt` datetime(3) DEFAULT NULL,
  `completedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductionJob_orderItemId_key` (`orderItemId`),
  UNIQUE KEY `ProductionJob_tenantId_code_key` (`tenantId`,`code`),
  KEY `ProductionJob_tenantId_status_priority_createdAt_idx` (`tenantId`,`status`,`priority`,`createdAt`),
  KEY `ProductionJob_machineId_status_idx` (`machineId`,`status`),
  KEY `ProductionJob_orderId_idx` (`orderId`),
  KEY `ProductionJob_productId_fkey` (`productId`),
  CONSTRAINT `ProductionJob_machineId_fkey` FOREIGN KEY (`machineId`) REFERENCES `machine` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ProductionJob_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProductionJob_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `orderitem` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProductionJob_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProductionJob_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productionjob`
--

LOCK TABLES `productionjob` WRITE;
/*!40000 ALTER TABLE `productionjob` DISABLE KEYS */;
/*!40000 ALTER TABLE `productionjob` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productionjobhistory`
--

DROP TABLE IF EXISTS `productionjobhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productionjobhistory` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jobId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fromStatus` enum('queued','prepress','ready','in_production','quality_check','packed','shipped','completed','blocked','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `toStatus` enum('queued','prepress','ready','in_production','quality_check','packed','shipped','completed','blocked','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `actorUserId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ProductionJobHistory_jobId_createdAt_idx` (`jobId`,`createdAt`),
  CONSTRAINT `ProductionJobHistory_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `productionjob` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productionjobhistory`
--

LOCK TABLES `productionjobhistory` WRITE;
/*!40000 ALTER TABLE `productionjobhistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `productionjobhistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productmaterialrequirement`
--

DROP TABLE IF EXISTS `productmaterialrequirement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productmaterialrequirement` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `materialId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(14,3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductMaterialRequirement_productId_materialId_key` (`productId`,`materialId`),
  KEY `ProductMaterialRequirement_materialId_idx` (`materialId`),
  CONSTRAINT `ProductMaterialRequirement_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `material` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProductMaterialRequirement_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productmaterialrequirement`
--

LOCK TABLES `productmaterialrequirement` WRITE;
/*!40000 ALTER TABLE `productmaterialrequirement` DISABLE KEYS */;
/*!40000 ALTER TABLE `productmaterialrequirement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productvariant`
--

DROP TABLE IF EXISTS `productvariant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productvariant` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `externalVariantId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `providerCost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salePrice` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MXN',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ProductVariant_productId_idx` (`productId`),
  CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productvariant`
--

LOCK TABLES `productvariant` WRITE;
/*!40000 ALTER TABLE `productvariant` DISABLE KEYS */;
INSERT INTO `productvariant` VALUES ('cmw8gk0ay0009waewgkm054r2','cmw8gk0aw0008waewugmeys55',NULL,'TSHIRT-F7F7F5-XS-1','Camiseta clásica · XS · Blanco','XS','Blanco',120.00,299.00,'MXN','2026-11-08 23:23:01.639','2026-11-08 23:23:01.639'),('cmw8gk0ay000awaewm8ie36x6','cmw8gk0aw0008waewugmeys55',NULL,'TSHIRT-F7F7F5-S-2','Camiseta clásica · S · Blanco','S','Blanco',120.00,299.00,'MXN','2026-11-08 23:23:01.639','2026-11-08 23:23:01.639'),('cmw8gk0ay000bwaewkbm3cddd','cmw8gk0aw0008waewugmeys55',NULL,'TSHIRT-F7F7F5-M-3','Camiseta clásica · M · Blanco','M','Blanco',120.00,299.00,'MXN','2026-11-08 23:23:01.639','2026-11-08 23:23:01.639'),('cmw8gk0ay000cwaew3a6e9oko','cmw8gk0aw0008waewugmeys55',NULL,'TSHIRT-F7F7F5-L-4','Camiseta clásica · L · Blanco','L','Blanco',120.00,299.00,'MXN','2026-11-08 23:23:01.639','2026-11-08 23:23:01.639'),('cmw8gk0ay000dwaewkh6rs954','cmw8gk0aw0008waewugmeys55',NULL,'TSHIRT-F7F7F5-XL-5','Camiseta clásica · XL · Blanco','XL','Blanco',120.00,299.00,'MXN','2026-11-08 23:23:01.639','2026-11-08 23:23:01.639'),('cmw8gk0ay000ewaew9pedk244','cmw8gk0aw0008waewugmeys55',NULL,'TSHIRT-F7F7F5-XXL-6','Camiseta clásica · XXL · Blanco','XXL','Blanco',120.00,299.00,'MXN','2026-11-08 23:23:01.639','2026-11-08 23:23:01.639'),('cmwco2t3g001kwaos3dvh56g5','cmwco2t3f001jwaos6w5xkt5u',NULL,'MUG-F7F7F5-15OZ-1','Taza · 15 oz · Blanco','15 oz','Blanco',120.00,299.00,'MXN','2026-11-11 22:04:40.779','2026-11-18 05:36:48.338'),('cmwco2t3g001lwaos52jmkfq4','cmwco2t3f001jwaos6w5xkt5u',NULL,'MUG-263C5A-15OZ-1','Taza · 15 oz · Azul marino','15 oz','Azul marino',120.00,299.00,'MXN','2026-11-11 22:04:40.779','2026-11-18 05:36:48.338'),('cmwco2t3g001mwaoscbjk7k54','cmwco2t3f001jwaos6w5xkt5u',NULL,'MUG-A9ABB0-15OZ-1','Taza · 15 oz · Gris','15 oz','Gris',120.00,299.00,'MXN','2026-11-11 22:04:40.779','2026-11-18 05:36:48.338'),('cmwcr0ou30000wak46skgfyzn','cmwcmauor001hwaosjsdvi5ng',NULL,'MUG-F7F7F5-NICA-1','Única','Única','Blanco',48.00,149.00,'MXN','2026-11-11 23:27:00.788','2026-11-18 05:35:45.253'),('cmwcr0oxk0001wak4f4t5v4wi','cmwcmatqz001fwaoshjwyjt2v',NULL,'MOUSEPAD-F7F7F5-NICA-1','Única','Única','Blanco',42.00,129.00,'MXN','2026-11-11 23:27:00.920','2026-11-18 05:35:44.449'),('cmwcr0pcf0002wak42lpl0oma','cmwcm9u2i001dwaosquxe22tf',NULL,'CAP-F7F7F5-NICA-1','Única','Única','Blanco',98.00,259.00,'MXN','2026-11-11 23:27:01.455','2026-11-18 05:35:43.611'),('cmwcr0pf80003wak4przd2hmi','cmwcm9sot001bwaosgrksqsns',NULL,'APRON-F7F7F5-NICA-1','Única','Única','Blanco',115.00,289.00,'MXN','2026-11-11 23:27:01.557','2026-11-18 05:35:42.791'),('cmwcr0phr0004wak4nrazuy2l','cmwcm9r7h0019waosd246bqj9',NULL,'TOTE-F7F7F5-NICA-1','Única','Única','Blanco',68.00,179.00,'MXN','2026-11-11 23:27:01.648','2026-11-18 05:35:25.346'),('cmwcr0pjz0005wak4yv1hd56z','cmwcm9p190017waoszrdofiqw',NULL,'PHOTO-PLAQUE-F7F7F5-NICA-1','Única','Única','Blanco',72.00,199.00,'MXN','2026-11-11 23:27:01.728','2026-11-18 05:35:24.262'),('cmwcr0pmc0006wak4ttdyrnsf','cmwcm9ofo0015waossaey68da',NULL,'KEYCHAIN-F7F7F5-NICA-1','Única','Única','Blanco',18.00,69.00,'MXN','2026-11-11 23:27:01.812','2026-11-18 05:35:23.475'),('cmwcr0pp60007wak4c5iapie5','cmwcm9nyf0013waos2ldp0d9x',NULL,'PUZZLE-F7F7F5-NICA-1','Única','Única','Blanco',58.00,169.00,'MXN','2026-11-11 23:27:01.915','2026-11-18 05:35:22.641'),('cmwcr0prg0008wak4f1fkydwt','cmwcm9mu9000zwaoss4hbp03e',NULL,'PILLOW-F7F7F5-NICA-1','Única','Única','Blanco',95.00,249.00,'MXN','2026-11-11 23:27:01.996','2026-11-18 05:35:21.745'),('cmwcr0pta0009wak4qguixgzy','cmwcm9mfd000xwaosuhi1bf4d',NULL,'TUMBLER-F7F7F5-NICA-1','Única','Única','Blanco',165.00,389.00,'MXN','2026-11-11 23:27:02.063','2026-11-18 05:35:05.618'),('cmwcr0pvb000awak4cjhdbgy9','cmwcm9lp3000vwaoslve35g7g',NULL,'TUMBLER-F7F7F5-NICA-1','Única','Única','Blanco',105.00,269.00,'MXN','2026-11-11 23:27:02.136','2026-11-18 05:35:04.803'),('cmwcr0pxk000bwak4ehlh7jrc','cmwcm9l6n000twaosi8po734h',NULL,'TUMBLER-F7F7F5-NICA-1','Única','Única','Blanco',185.00,429.00,'MXN','2026-11-11 23:27:02.216','2026-11-18 05:35:03.986'),('cmwcr0pze000cwak4e11lswew','cmwcm9kjr000rwaosj20lg9bx',NULL,'MUG-F7F7F5-NICA-1','Única','Única','Blanco',79.00,219.00,'MXN','2026-11-11 23:27:02.282','2026-11-18 05:35:02.859'),('cmwcr0q1l000dwak47pkmgvtk','cmwcm9k1y000pwaos0nec2eqr',NULL,'MUG-F7F7F5-NICA-1','Única','Única','Blanco',88.00,249.00,'MXN','2026-11-11 23:27:02.362','2026-11-18 05:35:01.894'),('cmwcr0q4l000ewak4y2d7f6kk','cmwcm9jc7000nwaoser00qrlc',NULL,'MUG-F7F7F5-NICA-1','Única','Única','Blanco',62.00,179.00,'MXN','2026-11-11 23:27:02.469','2026-11-18 05:34:12.992'),('cmwcr0q6x000fwak4d8pgnamy','cmwcm9iec000jwaosrvrwk2j4',NULL,NULL,'Única',NULL,NULL,210.00,499.00,'MXN','2026-11-11 23:27:02.553','2026-11-11 23:27:02.553'),('cmwcr0q9j000gwak4gw6joplw','cmwcm9hy0000hwaossm5jwhad',NULL,NULL,'Única',NULL,NULL,155.00,369.00,'MXN','2026-11-11 23:27:02.648','2026-11-11 23:27:02.648'),('cmwcr0qaw000hwak41cx651un','cmwcm9gt8000fwaosz9ft2b9l',NULL,NULL,'Única',NULL,NULL,78.00,189.00,'MXN','2026-11-11 23:27:02.696','2026-11-11 23:27:02.696'),('cmwcr0qca000iwak4hnoye7g3','cmwcm9d3d000dwaosce0u9qjt',NULL,NULL,'Única',NULL,NULL,125.00,299.00,'MXN','2026-11-11 23:27:02.746','2026-11-11 23:27:02.746'),('cmwcr0qds000jwak4mokbx6jn','cmwcm99ub000bwaossz6v69fq',NULL,NULL,'Única',NULL,NULL,95.00,229.00,'MXN','2026-11-11 23:27:02.801','2026-11-11 23:27:02.801'),('cmwdzhijh0002wad48mwh14or','cmwdzhijf0001wad4n5cye3di',NULL,'DRAFT-LABEL-0-0','5 ? 5 cm ? paquete de 100','5 ? 5 cm ? paquete de 100','Blanco',0.00,149.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.870'),('cmwdzhijh0003wad45vqn4mzd','cmwdzhijf0001wad4n5cye3di',NULL,'DRAFT-LABEL-0-1','5 ? 5 cm ? paquete de 500','5 ? 5 cm ? paquete de 500','Blanco',0.00,399.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.885'),('cmwdzhijh0004wad45sl1n8wb','cmwdzhijf0001wad4n5cye3di',NULL,'DRAFT-LABEL-0-2','5 ? 9 cm ? paquete de 100','5 ? 9 cm ? paquete de 100','Blanco',0.00,199.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.887'),('cmwdzhijh0005wad4z6lfkeaj','cmwdzhijf0001wad4n5cye3di',NULL,'DRAFT-LABEL-0-3','5 ? 9 cm ? paquete de 500','5 ? 9 cm ? paquete de 500','Blanco',0.00,549.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.890'),('cmwdzhijh0006wad4xg78jnpm','cmwdzhijf0001wad4n5cye3di',NULL,'DRAFT-LABEL-0-4','10 ? 10 cm ? paquete de 100','10 ? 10 cm ? paquete de 100','Blanco',0.00,299.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.892'),('cmwdzhijh0007wad4zepjk6ef','cmwdzhijf0001wad4n5cye3di',NULL,'DRAFT-LABEL-0-5','10 ? 10 cm ? paquete de 500','10 ? 10 cm ? paquete de 500','Blanco',0.00,899.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.895'),('cmwdzhijk000awad41jlf833n','cmwdzhijk0009wad4fptfaril',NULL,'DRAFT-LABEL-1-0','5 ? 5 cm ? paquete de 100','5 ? 5 cm ? paquete de 100','Blanco',0.00,179.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.921'),('cmwdzhijk000bwad4reofok45','cmwdzhijk0009wad4fptfaril',NULL,'DRAFT-LABEL-1-1','5 ? 5 cm ? paquete de 500','5 ? 5 cm ? paquete de 500','Blanco',0.00,479.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.924'),('cmwdzhijk000cwad4n7jgkzx2','cmwdzhijk0009wad4fptfaril',NULL,'DRAFT-LABEL-1-2','5 ? 9 cm ? paquete de 100','5 ? 9 cm ? paquete de 100','Blanco',0.00,239.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.926'),('cmwdzhijk000dwad422ciqee0','cmwdzhijk0009wad4fptfaril',NULL,'DRAFT-LABEL-1-3','5 ? 9 cm ? paquete de 500','5 ? 9 cm ? paquete de 500','Blanco',0.00,649.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.930'),('cmwdzhijk000ewad4bhzl7ynb','cmwdzhijk0009wad4fptfaril',NULL,'DRAFT-LABEL-1-4','10 ? 10 cm ? paquete de 100','10 ? 10 cm ? paquete de 100','Blanco',0.00,349.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.932'),('cmwdzhijk000fwad4m321pzfb','cmwdzhijk0009wad4fptfaril',NULL,'DRAFT-LABEL-1-5','10 ? 10 cm ? paquete de 500','10 ? 10 cm ? paquete de 500','Blanco',0.00,1049.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.935'),('cmwdzhijl000iwad4dca0o6en','cmwdzhijl000hwad4cqzi5txi',NULL,'DRAFT-LABEL-2-0','5 ? 5 cm ? paquete de 100','5 ? 5 cm ? paquete de 100','Transparente',0.00,199.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.942'),('cmwdzhijl000jwad4tl0jrxh4','cmwdzhijl000hwad4cqzi5txi',NULL,'DRAFT-LABEL-2-1','5 ? 5 cm ? paquete de 500','5 ? 5 cm ? paquete de 500','Transparente',0.00,529.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.944'),('cmwdzhijl000kwad4826mn7at','cmwdzhijl000hwad4cqzi5txi',NULL,'DRAFT-LABEL-2-2','5 ? 9 cm ? paquete de 100','5 ? 9 cm ? paquete de 100','Transparente',0.00,269.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.949'),('cmwdzhijl000lwad4g6kckihd','cmwdzhijl000hwad4cqzi5txi',NULL,'DRAFT-LABEL-2-3','5 ? 9 cm ? paquete de 500','5 ? 9 cm ? paquete de 500','Transparente',0.00,729.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.951'),('cmwdzhijl000mwad4ytj7pe4r','cmwdzhijl000hwad4cqzi5txi',NULL,'DRAFT-LABEL-2-4','10 ? 10 cm ? paquete de 100','10 ? 10 cm ? paquete de 100','Transparente',0.00,399.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.954'),('cmwdzhijl000nwad4bf1002wp','cmwdzhijl000hwad4cqzi5txi',NULL,'DRAFT-LABEL-2-5','10 ? 10 cm ? paquete de 500','10 ? 10 cm ? paquete de 500','Transparente',0.00,1199.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.956'),('cmwdzhijm000qwad4cxhsbjxv','cmwdzhijl000pwad4em8eitah',NULL,'DRAFT-LABEL-3-0','5 cm ? 50 m ? rollo','5 cm ? 50 m ? rollo','Blanco',0.00,699.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.965'),('cmwdzhijm000rwad4sls88bcf','cmwdzhijl000pwad4em8eitah',NULL,'DRAFT-LABEL-3-1','10 cm ? 50 m ? rollo','10 cm ? 50 m ? rollo','Blanco',0.00,1199.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.967'),('cmwdzhijm000swad488t9l77d','cmwdzhijl000pwad4em8eitah',NULL,'DRAFT-LABEL-3-2','5 cm ? 100 m ? rollo','5 cm ? 100 m ? rollo','Blanco',0.00,1199.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.970'),('cmwdzhijm000twad4etkcddum','cmwdzhijl000pwad4em8eitah',NULL,'DRAFT-LABEL-3-3','10 cm ? 100 m ? rollo','10 cm ? 100 m ? rollo','Blanco',0.00,1999.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.972'),('cmwdzhijm000wwad4o2bejvpa','cmwdzhijm000vwad484j57cri',NULL,'DRAFT-LABEL-4-0','5 ? 5 cm ? paquete de 100','5 ? 5 cm ? paquete de 100','Blanco',0.00,199.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.982'),('cmwdzhijm000xwad4lzbgcli3','cmwdzhijm000vwad484j57cri',NULL,'DRAFT-LABEL-4-1','5 ? 5 cm ? paquete de 500','5 ? 5 cm ? paquete de 500','Blanco',0.00,549.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.985'),('cmwdzhijm000ywad4y92b47n3','cmwdzhijm000vwad484j57cri',NULL,'DRAFT-LABEL-4-2','5 ? 9 cm ? paquete de 100','5 ? 9 cm ? paquete de 100','Blanco',0.00,249.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.987'),('cmwdzhijm000zwad4zrley4yp','cmwdzhijm000vwad484j57cri',NULL,'DRAFT-LABEL-4-3','5 ? 9 cm ? paquete de 500','5 ? 9 cm ? paquete de 500','Blanco',0.00,699.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.989'),('cmwdzhijm0010wad41kz8fw3b','cmwdzhijm000vwad484j57cri',NULL,'DRAFT-LABEL-4-4','10 ? 10 cm ? paquete de 100','10 ? 10 cm ? paquete de 100','Blanco',0.00,399.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.992'),('cmwdzhijm0011wad4x61d1ee9','cmwdzhijm000vwad484j57cri',NULL,'DRAFT-LABEL-4-5','10 ? 10 cm ? paquete de 500','10 ? 10 cm ? paquete de 500','Blanco',0.00,1199.00,'MXN','2026-11-12 20:11:48.882','2026-11-12 20:30:06.994'),('cmwim5gry0002wam0ez5s0z3o','cmwim5grv0001wam0ua4fsoqh',NULL,NULL,'S · 8.5 × 1 cm · 24 piezas','S · 8.5 × 1 cm · 24 piezas',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.588','2026-11-16 03:39:45.146'),('cmwim5gry0003wam07evba9hv','cmwim5grv0001wam0ua4fsoqh',NULL,NULL,'M · 12.5 × 1.5 cm · 12 piezas','M · 12.5 × 1.5 cm · 12 piezas',NULL,23.34,46.67,'MXN','2026-11-16 01:57:22.588','2026-11-16 03:39:45.199'),('cmwim5gry0004wam0n5uiun34','cmwim5grv0001wam0ua4fsoqh',NULL,NULL,'L · 16.5 × 2 cm · 4 piezas','L · 16.5 × 2 cm · 4 piezas',NULL,36.67,73.33,'MXN','2026-11-16 01:57:22.588','2026-11-16 03:39:45.249'),('cmwim5gry0005wam0vlbhhi32','cmwim5grv0001wam0ua4fsoqh',NULL,NULL,'XL · 23.5 × 3 cm · 4 piezas','XL · 23.5 × 3 cm · 4 piezas',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.588','2026-11-16 03:39:45.255'),('cmwim5gvh0008wam0cu936ude','cmwim5gvh0007wam092c79jow',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.732','2026-11-16 03:39:45.285'),('cmwim5gvh0009wam0p2w2jm34','cmwim5gvh0007wam092c79jow',NULL,NULL,'50','50',NULL,15.72,31.43,'MXN','2026-11-16 01:57:22.732','2026-11-16 03:39:45.289'),('cmwim5gvh000awam0iiupv0up','cmwim5gvh0007wam092c79jow',NULL,NULL,'100','100',NULL,21.43,42.86,'MXN','2026-11-16 01:57:22.732','2026-11-16 03:39:45.296'),('cmwim5gvh000bwam0sghtjec0','cmwim5gvh0007wam092c79jow',NULL,NULL,'200','200',NULL,27.15,54.29,'MXN','2026-11-16 01:57:22.732','2026-11-16 03:39:45.300'),('cmwim5gvh000cwam0kt0nfzy8','cmwim5gvh0007wam092c79jow',NULL,NULL,'500','500',NULL,32.85,65.71,'MXN','2026-11-16 01:57:22.732','2026-11-16 03:39:45.305'),('cmwim5gvh000dwam0i1jkjl8a','cmwim5gvh0007wam092c79jow',NULL,NULL,'1,000','1,000',NULL,38.57,77.14,'MXN','2026-11-16 01:57:22.732','2026-11-16 03:39:45.313'),('cmwim5gvh000ewam0ktnolrvt','cmwim5gvh0007wam092c79jow',NULL,NULL,'5,000','5,000',NULL,44.29,88.57,'MXN','2026-11-16 01:57:22.732','2026-11-16 03:39:45.318'),('cmwim5gvh000fwam0b5nrvqkm','cmwim5gvh0007wam092c79jow',NULL,NULL,'10,000','10,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.732','2026-11-16 03:39:45.324'),('cmwim5gw6000iwam0w0jspj4e','cmwim5gw6000hwam0xfkkn3zf',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.758','2026-11-16 03:39:45.347'),('cmwim5gw6000jwam0bn1vkb4q','cmwim5gw6000hwam0xfkkn3zf',NULL,NULL,'50','50',NULL,15.72,31.43,'MXN','2026-11-16 01:57:22.758','2026-11-16 03:39:45.354'),('cmwim5gw6000kwam0guhurhjv','cmwim5gw6000hwam0xfkkn3zf',NULL,NULL,'100','100',NULL,21.43,42.86,'MXN','2026-11-16 01:57:22.758','2026-11-16 03:39:45.359'),('cmwim5gw6000lwam0vnqubh7h','cmwim5gw6000hwam0xfkkn3zf',NULL,NULL,'200','200',NULL,27.15,54.29,'MXN','2026-11-16 01:57:22.758','2026-11-16 03:39:45.366'),('cmwim5gw6000mwam07t3bz0v4','cmwim5gw6000hwam0xfkkn3zf',NULL,NULL,'500','500',NULL,32.85,65.71,'MXN','2026-11-16 01:57:22.758','2026-11-16 03:39:45.372'),('cmwim5gw6000nwam0e3zyhore','cmwim5gw6000hwam0xfkkn3zf',NULL,NULL,'1,000','1,000',NULL,38.57,77.14,'MXN','2026-11-16 01:57:22.758','2026-11-16 03:39:45.379'),('cmwim5gw6000owam0y049qrnj','cmwim5gw6000hwam0xfkkn3zf',NULL,NULL,'5,000','5,000',NULL,44.29,88.57,'MXN','2026-11-16 01:57:22.758','2026-11-16 03:39:45.386'),('cmwim5gw6000pwam0qfn3ds3v','cmwim5gw6000hwam0xfkkn3zf',NULL,NULL,'10,000','10,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.758','2026-11-16 03:39:45.391'),('cmwim5gwn000swam0a2pbpv4m','cmwim5gwn000rwam0zcqfza20',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.774','2026-11-16 03:39:45.448'),('cmwim5gwn000twam00k0kyxho','cmwim5gwn000rwam0zcqfza20',NULL,NULL,'50','50',NULL,16.67,33.33,'MXN','2026-11-16 01:57:22.774','2026-11-16 03:39:45.453'),('cmwim5gwn000uwam0bqn7zica','cmwim5gwn000rwam0zcqfza20',NULL,NULL,'100','100',NULL,23.34,46.67,'MXN','2026-11-16 01:57:22.774','2026-11-16 03:39:45.459'),('cmwim5gwn000vwam07z8kouzi','cmwim5gwn000rwam0zcqfza20',NULL,NULL,'200','200',NULL,30.00,60.00,'MXN','2026-11-16 01:57:22.774','2026-11-16 03:39:45.465'),('cmwim5gwn000wwam0kf1fe15d','cmwim5gwn000rwam0zcqfza20',NULL,NULL,'300','300',NULL,36.67,73.33,'MXN','2026-11-16 01:57:22.774','2026-11-16 03:39:45.471'),('cmwim5gwn000xwam0g49i3w72','cmwim5gwn000rwam0zcqfza20',NULL,NULL,'500','500',NULL,43.34,86.67,'MXN','2026-11-16 01:57:22.774','2026-11-16 03:39:45.476'),('cmwim5gwn000ywam0h63ddjs5','cmwim5gwn000rwam0zcqfza20',NULL,NULL,'1,000','1,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.774','2026-11-16 03:39:45.481'),('cmwim5gx20011wam0zytlqre0','cmwim5gx20010wam0bntby8u5',NULL,NULL,'5 × 5 cm','5 × 5 cm',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.791','2026-11-16 03:39:45.512'),('cmwim5gx20012wam080p1aq16','cmwim5gx20010wam0bntby8u5',NULL,NULL,'7.5 × 7.5 cm','7.5 × 7.5 cm',NULL,23.34,46.67,'MXN','2026-11-16 01:57:22.791','2026-11-16 03:39:45.519'),('cmwim5gx30013wam0k1hh4cai','cmwim5gx20010wam0bntby8u5',NULL,NULL,'10 × 10 cm','10 × 10 cm',NULL,36.67,73.33,'MXN','2026-11-16 01:57:22.791','2026-11-16 03:39:45.527'),('cmwim5gx30014wam00s08pyuh','cmwim5gx20010wam0bntby8u5',NULL,NULL,'12.5 × 12.5 cm','12.5 × 12.5 cm',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.791','2026-11-16 03:39:45.532'),('cmwim5gyn0017wam0kkadfcw9','cmwim5gyn0016wam0m0zpzi4h',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.847','2026-11-16 03:39:45.599'),('cmwim5gyn0018wam0pe721go9','cmwim5gyn0016wam0m0zpzi4h',NULL,NULL,'50','50',NULL,15.72,31.43,'MXN','2026-11-16 01:57:22.847','2026-11-16 03:39:45.610'),('cmwim5gyn0019wam0s0fy0etf','cmwim5gyn0016wam0m0zpzi4h',NULL,NULL,'100','100',NULL,21.43,42.86,'MXN','2026-11-16 01:57:22.847','2026-11-16 03:39:45.619'),('cmwim5gyn001awam0dcv8tvle','cmwim5gyn0016wam0m0zpzi4h',NULL,NULL,'200','200',NULL,27.15,54.29,'MXN','2026-11-16 01:57:22.847','2026-11-16 03:39:45.628'),('cmwim5gyn001bwam0rdnx6exv','cmwim5gyn0016wam0m0zpzi4h',NULL,NULL,'500','500',NULL,32.85,65.71,'MXN','2026-11-16 01:57:22.847','2026-11-16 03:39:45.636'),('cmwim5gyn001cwam0zo6jr27h','cmwim5gyn0016wam0m0zpzi4h',NULL,NULL,'1,000','1,000',NULL,38.57,77.14,'MXN','2026-11-16 01:57:22.847','2026-11-16 03:39:45.645'),('cmwim5gyn001dwam06igpqs98','cmwim5gyn0016wam0m0zpzi4h',NULL,NULL,'5,000','5,000',NULL,44.29,88.57,'MXN','2026-11-16 01:57:22.847','2026-11-16 03:39:45.652'),('cmwim5gyn001ewam0d49ymf74','cmwim5gyn0016wam0m0zpzi4h',NULL,NULL,'10,000','10,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.847','2026-11-16 03:39:45.659'),('cmwim5gz4001hwam0gw1ymat3','cmwim5gz4001gwam0qt3kjy1t',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.864','2026-11-16 03:39:45.684'),('cmwim5gz4001iwam0m78uikk6','cmwim5gz4001gwam0qt3kjy1t',NULL,NULL,'50','50',NULL,15.72,31.43,'MXN','2026-11-16 01:57:22.864','2026-11-16 03:39:45.720'),('cmwim5gz5001jwam0hexul7fc','cmwim5gz4001gwam0qt3kjy1t',NULL,NULL,'100','100',NULL,21.43,42.86,'MXN','2026-11-16 01:57:22.864','2026-11-16 03:39:45.734'),('cmwim5gz5001kwam0lo6jreqt','cmwim5gz4001gwam0qt3kjy1t',NULL,NULL,'200','200',NULL,27.15,54.29,'MXN','2026-11-16 01:57:22.864','2026-11-16 03:39:45.775'),('cmwim5gz5001lwam0d42rts2a','cmwim5gz4001gwam0qt3kjy1t',NULL,NULL,'500','500',NULL,32.85,65.71,'MXN','2026-11-16 01:57:22.864','2026-11-16 03:39:45.824'),('cmwim5gz5001mwam0xvnh9z2u','cmwim5gz4001gwam0qt3kjy1t',NULL,NULL,'1,000','1,000',NULL,38.57,77.14,'MXN','2026-11-16 01:57:22.864','2026-11-16 03:39:45.851'),('cmwim5gz5001nwam0cx2wdclc','cmwim5gz4001gwam0qt3kjy1t',NULL,NULL,'5,000','5,000',NULL,44.29,88.57,'MXN','2026-11-16 01:57:22.864','2026-11-16 03:39:45.866'),('cmwim5gz5001owam0e50ecibx','cmwim5gz4001gwam0qt3kjy1t',NULL,NULL,'10,000','10,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.864','2026-11-16 03:39:45.880'),('cmwim5gzi001rwam028px6999','cmwim5gzi001qwam0nu1929sf',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.878','2026-11-16 03:39:45.988'),('cmwim5gzj001swam01x74p045','cmwim5gzi001qwam0nu1929sf',NULL,NULL,'50','50',NULL,15.72,31.43,'MXN','2026-11-16 01:57:22.878','2026-11-16 03:39:46.000'),('cmwim5gzj001twam0pzx97k5p','cmwim5gzi001qwam0nu1929sf',NULL,NULL,'100','100',NULL,21.43,42.86,'MXN','2026-11-16 01:57:22.878','2026-11-16 03:39:46.012'),('cmwim5gzj001uwam0jd0use99','cmwim5gzi001qwam0nu1929sf',NULL,NULL,'200','200',NULL,27.15,54.29,'MXN','2026-11-16 01:57:22.878','2026-11-16 03:39:46.022'),('cmwim5gzj001vwam0w3lt52ug','cmwim5gzi001qwam0nu1929sf',NULL,NULL,'500','500',NULL,32.85,65.71,'MXN','2026-11-16 01:57:22.878','2026-11-16 03:39:46.030'),('cmwim5gzj001wwam0os5zauuf','cmwim5gzi001qwam0nu1929sf',NULL,NULL,'1,000','1,000',NULL,38.57,77.14,'MXN','2026-11-16 01:57:22.878','2026-11-16 03:39:46.037'),('cmwim5gzj001xwam0ne5kl8mh','cmwim5gzi001qwam0nu1929sf',NULL,NULL,'5,000','5,000',NULL,44.29,88.57,'MXN','2026-11-16 01:57:22.878','2026-11-16 03:39:46.044'),('cmwim5gzj001ywam0r25ctx73','cmwim5gzi001qwam0nu1929sf',NULL,NULL,'10,000','10,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.878','2026-11-16 03:39:46.051'),('cmwim5h0a0021wam0hs4ltqnx','cmwim5h0a0020wam02i8hxf5v',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.906','2026-11-16 03:39:46.077'),('cmwim5h0a0022wam0f23pm2sg','cmwim5h0a0020wam02i8hxf5v',NULL,NULL,'50','50',NULL,15.72,31.43,'MXN','2026-11-16 01:57:22.906','2026-11-16 03:39:46.082'),('cmwim5h0a0023wam02o5j7khu','cmwim5h0a0020wam02i8hxf5v',NULL,NULL,'100','100',NULL,21.43,42.86,'MXN','2026-11-16 01:57:22.906','2026-11-16 03:39:46.089'),('cmwim5h0a0024wam0xn4te9vb','cmwim5h0a0020wam02i8hxf5v',NULL,NULL,'200','200',NULL,27.15,54.29,'MXN','2026-11-16 01:57:22.906','2026-11-16 03:39:46.096'),('cmwim5h0a0025wam0d0lq6ols','cmwim5h0a0020wam02i8hxf5v',NULL,NULL,'500','500',NULL,32.85,65.71,'MXN','2026-11-16 01:57:22.906','2026-11-16 03:39:46.102'),('cmwim5h0a0026wam00gm29p57','cmwim5h0a0020wam02i8hxf5v',NULL,NULL,'1,000','1,000',NULL,38.57,77.14,'MXN','2026-11-16 01:57:22.906','2026-11-16 03:39:46.107'),('cmwim5h0a0027wam0224m6rnw','cmwim5h0a0020wam02i8hxf5v',NULL,NULL,'5,000','5,000',NULL,44.29,88.57,'MXN','2026-11-16 01:57:22.906','2026-11-16 03:39:46.113'),('cmwim5h0a0028wam0sozlfzwl','cmwim5h0a0020wam02i8hxf5v',NULL,NULL,'10,000','10,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.906','2026-11-16 03:39:46.118'),('cmwim5h0t002bwam05zvbrlzs','cmwim5h0s002awam0pwy5ll4u',NULL,NULL,'1','1',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.924','2026-11-16 03:39:46.139'),('cmwim5h0t002cwam0pljuqdq6','cmwim5h0s002awam0pwy5ll4u',NULL,NULL,'5','5',NULL,18.00,36.00,'MXN','2026-11-16 01:57:22.924','2026-11-16 03:39:46.143'),('cmwim5h0t002dwam0ajicc2gq','cmwim5h0s002awam0pwy5ll4u',NULL,NULL,'10','10',NULL,26.00,52.00,'MXN','2026-11-16 01:57:22.924','2026-11-16 03:39:46.148'),('cmwim5h0t002ewam01a2yfjhy','cmwim5h0s002awam0pwy5ll4u',NULL,NULL,'25','25',NULL,34.00,68.00,'MXN','2026-11-16 01:57:22.924','2026-11-16 03:39:46.153'),('cmwim5h0t002fwam0arch1ftv','cmwim5h0s002awam0pwy5ll4u',NULL,NULL,'50','50',NULL,42.00,84.00,'MXN','2026-11-16 01:57:22.924','2026-11-16 03:39:46.157'),('cmwim5h0t002gwam0ebmdzpyp','cmwim5h0s002awam0pwy5ll4u',NULL,NULL,'100','100',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.924','2026-11-16 03:39:46.162'),('cmwim5h16002jwam0yc737cgw','cmwim5h16002iwam0e8wvf8a1',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.938','2026-11-16 03:39:46.186'),('cmwim5h16002kwam0vrwb6kx9','cmwim5h16002iwam0e8wvf8a1',NULL,NULL,'50','50',NULL,15.72,31.43,'MXN','2026-11-16 01:57:22.938','2026-11-16 03:39:46.191'),('cmwim5h16002lwam03kkkjher','cmwim5h16002iwam0e8wvf8a1',NULL,NULL,'100','100',NULL,21.43,42.86,'MXN','2026-11-16 01:57:22.938','2026-11-16 03:39:46.196'),('cmwim5h16002mwam0ass8hdmv','cmwim5h16002iwam0e8wvf8a1',NULL,NULL,'200','200',NULL,27.15,54.29,'MXN','2026-11-16 01:57:22.938','2026-11-16 03:39:46.201'),('cmwim5h16002nwam0lgq4rq98','cmwim5h16002iwam0e8wvf8a1',NULL,NULL,'500','500',NULL,32.85,65.71,'MXN','2026-11-16 01:57:22.938','2026-11-16 03:39:46.206'),('cmwim5h16002owam0zedjyrvu','cmwim5h16002iwam0e8wvf8a1',NULL,NULL,'1,000','1,000',NULL,38.57,77.14,'MXN','2026-11-16 01:57:22.938','2026-11-16 03:39:46.211'),('cmwim5h16002pwam0pklhxls4','cmwim5h16002iwam0e8wvf8a1',NULL,NULL,'5,000','5,000',NULL,44.29,88.57,'MXN','2026-11-16 01:57:22.938','2026-11-16 03:39:46.215'),('cmwim5h16002qwam0ue4j1dho','cmwim5h16002iwam0e8wvf8a1',NULL,NULL,'10,000','10,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.938','2026-11-16 03:39:46.219'),('cmwim5h1l002twam0a00o8zzn','cmwim5h1k002swam0l8nt4yv6',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.953','2026-11-16 03:39:46.235'),('cmwim5h1l002uwam09ql8mx7g','cmwim5h1k002swam0l8nt4yv6',NULL,NULL,'50','50',NULL,16.67,33.33,'MXN','2026-11-16 01:57:22.953','2026-11-16 03:39:46.240'),('cmwim5h1l002vwam0mk1lkgbi','cmwim5h1k002swam0l8nt4yv6',NULL,NULL,'100','100',NULL,23.34,46.67,'MXN','2026-11-16 01:57:22.953','2026-11-16 03:39:46.244'),('cmwim5h1l002wwam0cvmpxmju','cmwim5h1k002swam0l8nt4yv6',NULL,NULL,'200','200',NULL,30.00,60.00,'MXN','2026-11-16 01:57:22.953','2026-11-16 03:39:46.248'),('cmwim5h1l002xwam0b2f1s5b0','cmwim5h1k002swam0l8nt4yv6',NULL,NULL,'300','300',NULL,36.67,73.33,'MXN','2026-11-16 01:57:22.953','2026-11-16 03:39:46.252'),('cmwim5h1l002ywam00s0pjaex','cmwim5h1k002swam0l8nt4yv6',NULL,NULL,'500','500',NULL,43.34,86.67,'MXN','2026-11-16 01:57:22.953','2026-11-16 03:39:46.256'),('cmwim5h1l002zwam0d3go9mrs','cmwim5h1k002swam0l8nt4yv6',NULL,NULL,'1,000','1,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.953','2026-11-16 03:39:46.260'),('cmwim5h210032wam0ai38zdrx','cmwim5h210031wam01gm1pzdn',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.969','2026-11-16 03:39:46.276'),('cmwim5h210033wam0nawprq52','cmwim5h210031wam01gm1pzdn',NULL,NULL,'50','50',NULL,15.72,31.43,'MXN','2026-11-16 01:57:22.969','2026-11-16 03:39:46.280'),('cmwim5h210034wam0j5qpvjjq','cmwim5h210031wam01gm1pzdn',NULL,NULL,'100','100',NULL,21.43,42.86,'MXN','2026-11-16 01:57:22.969','2026-11-16 03:39:46.284'),('cmwim5h210035wam09f2d7el1','cmwim5h210031wam01gm1pzdn',NULL,NULL,'200','200',NULL,27.15,54.29,'MXN','2026-11-16 01:57:22.969','2026-11-16 03:39:46.288'),('cmwim5h210036wam0jvebg7pn','cmwim5h210031wam01gm1pzdn',NULL,NULL,'500','500',NULL,32.85,65.71,'MXN','2026-11-16 01:57:22.969','2026-11-16 03:39:46.294'),('cmwim5h210037wam0xgtwhid1','cmwim5h210031wam01gm1pzdn',NULL,NULL,'1,000','1,000',NULL,38.57,77.14,'MXN','2026-11-16 01:57:22.969','2026-11-16 03:39:46.298'),('cmwim5h210038wam0mrpeuqsn','cmwim5h210031wam01gm1pzdn',NULL,NULL,'5,000','5,000',NULL,44.29,88.57,'MXN','2026-11-16 01:57:22.969','2026-11-16 03:39:46.302'),('cmwim5h210039wam04khrhfek','cmwim5h210031wam01gm1pzdn',NULL,NULL,'10,000','10,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.969','2026-11-16 03:39:46.307'),('cmwim5h2i003cwam0wlkisbpk','cmwim5h2i003bwam0zx43d25t',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:22.986','2026-11-16 03:39:46.324'),('cmwim5h2i003dwam0jqjfxihr','cmwim5h2i003bwam0zx43d25t',NULL,NULL,'50','50',NULL,16.67,33.33,'MXN','2026-11-16 01:57:22.986','2026-11-16 03:39:46.329'),('cmwim5h2i003ewam0y6afvs9k','cmwim5h2i003bwam0zx43d25t',NULL,NULL,'100','100',NULL,23.34,46.67,'MXN','2026-11-16 01:57:22.986','2026-11-16 03:39:46.335'),('cmwim5h2i003fwam00jzeqaya','cmwim5h2i003bwam0zx43d25t',NULL,NULL,'200','200',NULL,30.00,60.00,'MXN','2026-11-16 01:57:22.986','2026-11-16 03:39:46.343'),('cmwim5h2i003gwam0yto0v5ga','cmwim5h2i003bwam0zx43d25t',NULL,NULL,'300','300',NULL,36.67,73.33,'MXN','2026-11-16 01:57:22.986','2026-11-16 03:39:46.348'),('cmwim5h2j003hwam0it81mamo','cmwim5h2i003bwam0zx43d25t',NULL,NULL,'500','500',NULL,43.34,86.67,'MXN','2026-11-16 01:57:22.986','2026-11-16 03:39:46.354'),('cmwim5h2j003iwam06ut0y6v2','cmwim5h2i003bwam0zx43d25t',NULL,NULL,'1,000','1,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:22.986','2026-11-16 03:39:46.360'),('cmwim5h2w003lwam0dresx9vk','cmwim5h2w003kwam0zdlqr9tx',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:23.000','2026-11-16 03:39:46.382'),('cmwim5h2w003mwam0p3epbgqd','cmwim5h2w003kwam0zdlqr9tx',NULL,NULL,'50','50',NULL,15.72,31.43,'MXN','2026-11-16 01:57:23.000','2026-11-16 03:39:46.388'),('cmwim5h2w003nwam0x6ck9ht8','cmwim5h2w003kwam0zdlqr9tx',NULL,NULL,'100','100',NULL,21.43,42.86,'MXN','2026-11-16 01:57:23.000','2026-11-16 03:39:46.394'),('cmwim5h2w003owam09dl2nm7l','cmwim5h2w003kwam0zdlqr9tx',NULL,NULL,'200','200',NULL,27.15,54.29,'MXN','2026-11-16 01:57:23.000','2026-11-16 03:39:46.399'),('cmwim5h2w003pwam0gajr06wp','cmwim5h2w003kwam0zdlqr9tx',NULL,NULL,'500','500',NULL,32.85,65.71,'MXN','2026-11-16 01:57:23.000','2026-11-16 03:39:46.405'),('cmwim5h2w003qwam0qkkwcllu','cmwim5h2w003kwam0zdlqr9tx',NULL,NULL,'1,000','1,000',NULL,38.57,77.14,'MXN','2026-11-16 01:57:23.000','2026-11-16 03:39:46.409'),('cmwim5h2w003rwam02ogu32te','cmwim5h2w003kwam0zdlqr9tx',NULL,NULL,'5,000','5,000',NULL,44.29,88.57,'MXN','2026-11-16 01:57:23.000','2026-11-16 03:39:46.415'),('cmwim5h2w003swam0deiz6kef','cmwim5h2w003kwam0zdlqr9tx',NULL,NULL,'10,000','10,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:23.000','2026-11-16 03:39:46.420'),('cmwim5h38003vwam0k6o1qke8','cmwim5h38003uwam0rniwr40i',NULL,NULL,'25','25',NULL,10.00,20.00,'MXN','2026-11-16 01:57:23.012','2026-11-16 03:39:46.439'),('cmwim5h38003wwam0452i8e1m','cmwim5h38003uwam0rniwr40i',NULL,NULL,'50','50',NULL,15.72,31.43,'MXN','2026-11-16 01:57:23.012','2026-11-16 03:39:46.445'),('cmwim5h38003xwam0kvzrs3rd','cmwim5h38003uwam0rniwr40i',NULL,NULL,'100','100',NULL,21.43,42.86,'MXN','2026-11-16 01:57:23.012','2026-11-16 03:39:46.451'),('cmwim5h38003ywam02oj0gork','cmwim5h38003uwam0rniwr40i',NULL,NULL,'200','200',NULL,27.15,54.29,'MXN','2026-11-16 01:57:23.012','2026-11-16 03:39:46.466'),('cmwim5h38003zwam0bf1rxlgn','cmwim5h38003uwam0rniwr40i',NULL,NULL,'500','500',NULL,32.85,65.71,'MXN','2026-11-16 01:57:23.012','2026-11-16 03:39:46.472'),('cmwim5h380040wam03ukru1hj','cmwim5h38003uwam0rniwr40i',NULL,NULL,'1,000','1,000',NULL,38.57,77.14,'MXN','2026-11-16 01:57:23.012','2026-11-16 03:39:46.479'),('cmwim5h380041wam0l1p06ue2','cmwim5h38003uwam0rniwr40i',NULL,NULL,'5,000','5,000',NULL,44.29,88.57,'MXN','2026-11-16 01:57:23.012','2026-11-16 03:39:46.484'),('cmwim5h380042wam0mjmcftne','cmwim5h38003uwam0rniwr40i',NULL,NULL,'10,000','10,000',NULL,50.00,100.00,'MXN','2026-11-16 01:57:23.012','2026-11-16 03:39:46.490');
/*!40000 ALTER TABLE `productvariant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provideraccount`
--

DROP TABLE IF EXISTS `provideraccount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provideraccount` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `providerCode` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `displayName` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `encryptedAccessToken` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `connectionStatus` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'connected',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProviderAccount_tenantId_providerCode_key` (`tenantId`,`providerCode`),
  KEY `ProviderAccount_tenantId_idx` (`tenantId`),
  CONSTRAINT `ProviderAccount_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provideraccount`
--

LOCK TABLES `provideraccount` WRITE;
/*!40000 ALTER TABLE `provideraccount` DISABLE KEYS */;
/*!40000 ALTER TABLE `provideraccount` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipment`
--

DROP TABLE IF EXISTS `shipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productionJobId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `carrier` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trackingNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trackingUrl` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'shipped',
  `shippedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deliveredAt` datetime(3) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `upsShipmentIdentificationNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upsServiceCode` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upsServiceName` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `labelStorageKeys` json DEFAULT NULL,
  `packageTrackingNumbers` json DEFAULT NULL,
  `trackingStatus` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trackingUpdatedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Shipment_productionJobId_key` (`productionJobId`),
  UNIQUE KEY `Shipment_tenantId_carrier_trackingNumber_key` (`tenantId`,`carrier`,`trackingNumber`),
  KEY `Shipment_tenantId_shippedAt_idx` (`tenantId`,`shippedAt`),
  KEY `Shipment_orderId_fkey` (`orderId`),
  CONSTRAINT `Shipment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Shipment_productionJobId_fkey` FOREIGN KEY (`productionJobId`) REFERENCES `productionjob` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Shipment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipment`
--

LOCK TABLES `shipment` WRITE;
/*!40000 ALTER TABLE `shipment` DISABLE KEYS */;
/*!40000 ALTER TABLE `shipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stockmovement`
--

DROP TABLE IF EXISTS `stockmovement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stockmovement` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `materialId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jobId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('receipt','adjustment','consumption','return') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(14,3) NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actorUserId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `StockMovement_tenantId_createdAt_idx` (`tenantId`,`createdAt`),
  KEY `StockMovement_materialId_createdAt_idx` (`materialId`,`createdAt`),
  KEY `StockMovement_jobId_idx` (`jobId`),
  CONSTRAINT `StockMovement_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `productionjob` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `StockMovement_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `material` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `StockMovement_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stockmovement`
--

LOCK TABLES `stockmovement` WRITE;
/*!40000 ALTER TABLE `stockmovement` DISABLE KEYS */;
/*!40000 ALTER TABLE `stockmovement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supportticket`
--

DROP TABLE IF EXISTS `supportticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supportticket` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderNumber` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `status` enum('open','in_progress','waiting_customer','resolved','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `createdByUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `productionJobId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firstResponseAt` datetime(3) DEFAULT NULL,
  `resolvedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `SupportTicket_tenantId_status_priority_createdAt_idx` (`tenantId`,`status`,`priority`,`createdAt`),
  KEY `SupportTicket_orderId_idx` (`orderId`),
  KEY `SupportTicket_productionJobId_idx` (`productionJobId`),
  KEY `SupportTicket_tenantId_firstResponseAt_resolvedAt_idx` (`tenantId`,`firstResponseAt`,`resolvedAt`),
  CONSTRAINT `SupportTicket_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `SupportTicket_productionJobId_fkey` FOREIGN KEY (`productionJobId`) REFERENCES `productionjob` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `SupportTicket_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supportticket`
--

LOCK TABLES `supportticket` WRITE;
/*!40000 ALTER TABLE `supportticket` DISABLE KEYS */;
/*!40000 ALTER TABLE `supportticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supportticketcomment`
--

DROP TABLE IF EXISTS `supportticketcomment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supportticketcomment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticketId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `authorName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `authorUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `authorRole` enum('owner','admin','editor','viewer','customer') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activityType` enum('created','comment','status_changed','priority_changed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'comment',
  `previousStatus` enum('open','in_progress','waiting_customer','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `newStatus` enum('open','in_progress','waiting_customer','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `previousPriority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `newPriority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `SupportTicketComment_ticketId_createdAt_idx` (`ticketId`,`createdAt`),
  KEY `SupportTicketComment_authorUserId_createdAt_idx` (`authorUserId`,`createdAt`),
  CONSTRAINT `SupportTicketComment_authorUserId_fkey` FOREIGN KEY (`authorUserId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `SupportTicketComment_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `supportticket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supportticketcomment`
--

LOCK TABLES `supportticketcomment` WRITE;
/*!40000 ALTER TABLE `supportticketcomment` DISABLE KEYS */;
/*!40000 ALTER TABLE `supportticketcomment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant`
--

DROP TABLE IF EXISTS `tenant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','suspended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `shippingFlatRate` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Tenant_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant`
--

LOCK TABLES `tenant` WRITE;
/*!40000 ALTER TABLE `tenant` DISABLE KEYS */;
INSERT INTO `tenant` VALUES ('cmw5y6z660001wao0oeikt43n','ssaxxon','ssaxxon-883f3a','active','2026-11-07 05:13:28.206','2026-11-07 05:13:28.206',0.00),('cmw8ghqj40001waewfmqbppvk','Tienda Demo','tienda-demo-53c513','active','2026-11-08 23:21:15.664','2026-11-08 23:21:15.664',0.00),('cmwcm514y0001waos6id64idn','SAM STORE','sam-store-446e59','active','2026-11-11 21:10:25.282','2026-11-11 21:10:25.282',0.00),('cmwnxmjuh0001wacc1iq2bx2h','Demo Store','demo-store','active','2026-11-19 19:17:26.392','2026-11-19 19:17:26.392',0.00);
/*!40000 ALTER TABLE `tenant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenantmembership`
--

DROP TABLE IF EXISTS `tenantmembership`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenantmembership` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('owner','admin','editor','viewer','customer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'owner',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `TenantMembership_userId_tenantId_key` (`userId`,`tenantId`),
  KEY `TenantMembership_tenantId_role_idx` (`tenantId`,`role`),
  CONSTRAINT `TenantMembership_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TenantMembership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenantmembership`
--

LOCK TABLES `tenantmembership` WRITE;
/*!40000 ALTER TABLE `tenantmembership` DISABLE KEYS */;
INSERT INTO `tenantmembership` VALUES ('cmw5y6z6c0003wao0wr2lry81','cmw5y6z5k0000wao034ntez6e','cmw5y6z660001wao0oeikt43n','customer','2026-11-07 05:13:28.212'),('cmw8ghqjo0003waew7460o9hw','cmw8ghqc30000waewf9nes5od','cmw8ghqj40001waewfmqbppvk','customer','2026-11-08 23:21:15.678'),('cmwcm515b0003waosogddzyfa','cmwcm51440000waos3kywmmv5','cmwcm514y0001waos6id64idn','owner','2026-11-11 21:10:25.292'),('cmwcxw0dt0001wav012mph75j','cmw5y6z5k0000wao034ntez6e','cmwcm514y0001waos6id64idn','customer','2026-11-12 02:39:19.789'),('cmwcxw0gt0003wav0lws2xqx0','cmw8ghqc30000waewf9nes5od','cmwcm514y0001waos6id64idn','customer','2026-11-12 02:39:19.901'),('cmwd5hb4w000mwaswzriuvfld','cmwd5hb4u000kwasw5g0p2v8h','cmwcm514y0001waos6id64idn','customer','2026-11-12 06:11:50.808'),('cmweg5sdd0002wa7sewlfme7m','cmweg5sd70000wa7sbrbhkgas','cmwcm514y0001waos6id64idn','customer','2026-11-13 03:58:35.220'),('cmwnxmjuw0003wacceu86er2r','cmwnxmjs70000waccrlxk41my','cmwnxmjuh0001wacc1iq2bx2h','owner','2026-11-19 19:17:26.408');
/*!40000 ALTER TABLE `tenantmembership` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('cmw5y6z5k0000wao034ntez6e','vladivoztok666@gmail.com','$2b$12$G1FyeVtlxyarIakvCnL/dOTy60ciu.UpAOCAaei54J7RBGjQTc7Q2','angello avalos','2026-11-07 05:13:28.182','2026-11-07 05:13:28.182'),('cmw8ghqc30000waewf9nes5od','demo@printly.local','$2b$12$a0YAKj9fBzmgg9Wmy2LXr.lFp1.Bbauzs8rRxENC0RFBQ7tPE3X4i','Test Seller','2026-11-08 23:21:15.407','2026-11-08 23:21:15.407'),('cmwcm51440000waos3kywmmv5','cortezamental@gmail.com','$2b$12$S.AsvCoqu9BG5OD9ZU15HOnj6xF7CAI4.y/ZOmnhGmfiknoKjUPW2','Sam Altman','2026-11-11 21:10:25.250','2026-11-11 21:10:25.250'),('cmwd5hb4u000kwasw5g0p2v8h','laempanadadesoya@gmail.com','$2b$12$qtRbozVylLjY2F7BYLVLnuxozvYiiNHyB.qLly6Hnh4/A8iNv0ef2','Ernesto','2026-11-12 06:11:50.808','2026-11-12 06:11:50.808'),('cmweg5sd70000wa7sbrbhkgas','ernesto@gmail.com','$2b$12$FMCoNfHoCyUJzDvtnRjAd.y470BJ9//jK.Rrrjk0f4UyJPHRPac32','Ernesto','2026-11-13 03:58:35.220','2026-11-13 03:58:35.220'),('cmwnxmjs70000waccrlxk41my','admin@lemarquet.com','$2b$12$j3YYj99a/puxj9rxXJJOs.cq899hTF4LLmeRDbBl90.hpa2KQc5H.','Demo Seller','2026-11-19 19:17:26.305','2026-11-19 19:17:26.305');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-19 19:36:16
