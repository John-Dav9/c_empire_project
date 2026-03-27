-- =============================================================================
-- C'EMPIRE — Migration 002 : champ assignedEmployeeId sur todo_orders et event_bookings
-- Date  : 2026-03-26
-- Usage : Coller dans l'éditeur SQL de Supabase et exécuter.
--         Idempotent (IF NOT EXISTS / IF EXISTS).
-- =============================================================================

-- C'Todo : ajout de l'employé assigné
ALTER TABLE todo_orders
  ADD COLUMN IF NOT EXISTS "assignedEmployeeId" VARCHAR;

-- C'Events : ajout de l'employé assigné
ALTER TABLE event_bookings
  ADD COLUMN IF NOT EXISTS "assignedEmployeeId" VARCHAR;

-- Index de performance (optionnel mais utile pour filtrer par employé)
CREATE INDEX IF NOT EXISTS idx_todo_orders_assignedemployeeid
  ON todo_orders("assignedEmployeeId");

CREATE INDEX IF NOT EXISTS idx_event_bookings_assignedemployeeid
  ON event_bookings("assignedEmployeeId");
