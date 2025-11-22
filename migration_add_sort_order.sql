-- Migration script to add sort_order column to pages table
-- Execute this script in your PostgreSQL database

-- Step 1: Add the column with default value
ALTER TABLE pages ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Step 2: Update existing NULL values to 0
UPDATE pages SET sort_order = 0 WHERE sort_order IS NULL;

-- Step 3: Make the column NOT NULL
ALTER TABLE pages ALTER COLUMN sort_order SET NOT NULL;

-- Step 4: Update existing pages with proper sort order
-- For top-level pages (no parent)
WITH numbered_pages AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY created_at) - 1 AS new_order
    FROM pages
    WHERE parent_page_id IS NULL AND is_deleted = FALSE
)
UPDATE pages
SET sort_order = numbered_pages.new_order
FROM numbered_pages
WHERE pages.id = numbered_pages.id;

-- For child pages (with parent)
WITH numbered_child_pages AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY parent_page_id ORDER BY created_at) - 1 AS new_order
    FROM pages
    WHERE parent_page_id IS NOT NULL AND is_deleted = FALSE
)
UPDATE pages
SET sort_order = numbered_child_pages.new_order
FROM numbered_child_pages
WHERE pages.id = numbered_child_pages.id;
