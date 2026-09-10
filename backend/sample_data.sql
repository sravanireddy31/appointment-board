-- Run this after FastAPI has started once and created the appointments table.
-- These records demonstrate scheduled, completed, and cancelled appointments.

INSERT INTO appointments (title, description, date, start_time, end_time, status)
VALUES
    (
        'Sprint Planning',
        'Plan the work for the next development sprint.',
        '2026-09-15',
        '09:00:00',
        '10:00:00',
        'scheduled'
    ),
    (
        'Client Project Review',
        'Review the latest project progress with the client.',
        '2026-09-15',
        '11:00:00',
        '12:00:00',
        'completed'
    ),
    (
        'Design Discussion',
        'Discuss interface updates with the design team.',
        '2026-09-16',
        '14:00:00',
        '15:00:00',
        'cancelled'
    );
