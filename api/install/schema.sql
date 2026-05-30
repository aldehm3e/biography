CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'owner',
  permissions_json LONGTEXT,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY,
  site_name VARCHAR(255),
  brand_name VARCHAR(255),
  brand_slogan VARCHAR(255),
  brand_logo VARCHAR(500),
  site_icon VARCHAR(500),
  language VARCHAR(10),
  direction VARCHAR(10),
  theme VARCHAR(50),
  phone_number VARCHAR(50),
  email VARCHAR(255),
  shell_topbar_text VARCHAR(255),
  shell_topbar_short_text VARCHAR(255),
  shell_verify_label VARCHAR(100),
  shell_verify_title VARCHAR(255),
  shell_verify_description TEXT,
  shell_security_title VARCHAR(255),
  shell_security_description TEXT,
  shell_notice_text VARCHAR(255),
  interface_texts_json LONGTEXT,
  footer_json LONGTEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS navigation_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(255),
  url VARCHAR(500),
  item_type VARCHAR(50),
  sort_order INT DEFAULT 0,
  visible TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hero_slides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  subtitle VARCHAR(255),
  intro TEXT,
  image_path VARCHAR(500),
  mobile_image_path VARCHAR(500),
  video_path VARCHAR(500),
  mobile_video_path VARCHAR(500),
  alt_text VARCHAR(255),
  sort_order INT DEFAULT 0,
  visible TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS main_page (
  id INT PRIMARY KEY,
  owner_name VARCHAR(255),
  professional_title VARCHAR(255),
  intro TEXT,
  avatar_path VARCHAR(500),
  biography LONGTEXT,
  hero_title VARCHAR(255),
  hero_subtitle VARCHAR(255),
  hero_intro TEXT,
  hero_image VARCHAR(500),
  hero_video VARCHAR(500),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experiences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  meta VARCHAR(255),
  description TEXT,
  sort_order INT DEFAULT 0,
  visible TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  meta VARCHAR(255),
  description TEXT,
  sort_order INT DEFAULT 0,
  visible TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  sort_order INT DEFAULT 0,
  visible TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  description LONGTEXT,
  status VARCHAR(100),
  project_date VARCHAR(100),
  category VARCHAR(100),
  image_path VARCHAR(500),
  url VARCHAR(500),
  sort_order INT DEFAULT 0,
  visible TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  parent_slug VARCHAR(255),
  content_mode ENUM('text','html') DEFAULT 'text',
  content LONGTEXT,
  image_path VARCHAR(500),
  video_path VARCHAR(500),
  sort_order INT DEFAULT 0,
  visible TINYINT(1) DEFAULT 1,
  show_in_navigation TINYINT(1) DEFAULT 1,
  show_in_footer TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(255),
  value VARCHAR(500),
  url VARCHAR(500),
  icon_type VARCHAR(100),
  icon_path VARCHAR(500),
  sort_order INT DEFAULT 0,
  visible TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS footer_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(255),
  url VARCHAR(500),
  sort_order INT DEFAULT 0,
  visible TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS integrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  integration_type VARCHAR(80),
  name VARCHAR(255),
  provider VARCHAR(255),
  environment VARCHAR(50),
  endpoint_url VARCHAR(500),
  webhook_url VARCHAR(500),
  public_key VARCHAR(500),
  secret_env_key VARCHAR(255),
  config_json LONGTEXT,
  sort_order INT DEFAULT 0,
  enabled TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_notifications (
  id VARCHAR(120) PRIMARY KEY,
  notification_key VARCHAR(255) UNIQUE,
  status VARCHAR(50),
  tag VARCHAR(100),
  title VARCHAR(255),
  description TEXT,
  href VARCHAR(500),
  sort_order INT DEFAULT 0,
  created_at VARCHAR(40)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255),
  stored_name VARCHAR(255),
  path VARCHAR(500),
  mime_type VARCHAR(100),
  file_size INT,
  media_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_backups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  backup_name VARCHAR(255),
  content_json LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_settings (id, language, direction, theme, brand_slogan)
VALUES (1, 'ar', 'rtl', 'light', 'موقع شخصي');

INSERT IGNORE INTO main_page (id)
VALUES (1);
