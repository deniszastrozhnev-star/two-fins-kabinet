-- Индексы для запросов, агрегирующих по всем детям/спортсменам/тренерам сразу
-- (без фильтра по конкретному childId/athleteId/trainerId) — растут нелинейно
-- с числом строк без индекса по date, и для ILIKE-логина по фамилии+имени
-- без индекса по birthDate (единственное точное совпадение в этих запросах).

-- CreateIndex
CREATE INDEX "Child_birthDate_idx" ON "Child"("birthDate");

-- CreateIndex
CREATE INDEX "AttendanceRecord_date_idx" ON "AttendanceRecord"("date");

-- CreateIndex
CREATE INDEX "PersonalTraining_date_idx" ON "PersonalTraining"("date");

-- CreateIndex
CREATE INDEX "Athlete_birthDate_idx" ON "Athlete"("birthDate");

-- CreateIndex
CREATE INDEX "PoolWorkout_date_idx" ON "PoolWorkout"("date");

-- CreateIndex
CREATE INDEX "GymWorkout_date_idx" ON "GymWorkout"("date");

-- CreateIndex
CREATE INDEX "FlexibilityWorkout_date_idx" ON "FlexibilityWorkout"("date");
