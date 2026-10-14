-- ============================================================================
--  LOOPSOOP — billing: quotations + invoices (Phase 8)
--  Run ONCE in Hostinger -> phpMyAdmin (select the database, SQL tab, Go).
--
--  Quotations and invoices share one table, discriminated by `kind`. Line items
--  are stored as a JSON array in a LONGTEXT column (portable across MySQL and
--  MariaDB). Totals are computed in the app and stored for fast listing. Until
--  this runs, the Quotations / Invoices admin pages simply show an empty list.
-- ============================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS billing_documents (
  id             CHAR(36)      NOT NULL PRIMARY KEY,
  kind           ENUM('quotation','invoice') NOT NULL,
  number         VARCHAR(40)   NOT NULL,            -- QUO-0001 / INV-0001
  status         VARCHAR(20)   NOT NULL DEFAULT 'draft',
  client_name    VARCHAR(200)  NOT NULL,
  client_email   VARCHAR(200),
  client_phone   VARCHAR(40),
  client_company VARCHAR(200),
  client_address TEXT,
  title          VARCHAR(200),                      -- project / subject line
  currency       VARCHAR(8)    NOT NULL DEFAULT 'INR',
  items          LONGTEXT      NOT NULL,            -- JSON: [{description, qty, rate}]
  tax_rate       DECIMAL(6,3)  NOT NULL DEFAULT 0,  -- percent
  discount       DECIMAL(12,2) NOT NULL DEFAULT 0,  -- flat amount in `currency`
  subtotal       DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
  total          DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid    DECIMAL(12,2) NOT NULL DEFAULT 0,  -- invoices
  doc_date       DATE          NOT NULL,            -- issue date / quote date
  due_date       DATE,                              -- due date / valid-until
  notes          TEXT,                              -- terms / bank details
  source_id      CHAR(36),                          -- quotation -> invoice link
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_kind_number (kind, number),
  INDEX idx_kind_status (kind, status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
