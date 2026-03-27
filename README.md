# DevRev Resolution Working Time (RWT) Engine

## Overview

The RWT Engine is a highly optimized internal utility designed to calculate the exact SLA (Service Level Agreement) working hours a DevRev ticket has been actively assigned to the Global Support Team (GST). It interfaces with the DevRev `timeline-entries.list` API to extract exact state changes and applies a strict mathematical formula to calculate business hours.

## Architecture

- **Backend:** Node.js / Express (Headless REST API)
- **Frontend:** React + Vite
- **Styling:** Tailwind CSS v4 (Swiss Minimalist design)
- **Performance:** Implements `useMemo` for isolated re-calculations and strictly avoids layout-shifting CSS.

---

## The RWT Mathematical Formula

The application calculates time using a **Chronological Time Cursor Algorithm**. Rather than simply subtracting `End Time - Start Time` (which breaks across weekends and nights), the engine steps through the ticket's lifespan chronologically, strictly bounding accumulated time by business logic.

### 1. State Triggers

The algorithm filters all DevRev events for `timeline_state_change`.

- **Timer Starts (Active):** When the ticket enters `Queued` or `Waiting on Assignee`.
- **Timer Pauses (Inactive):** When the ticket transitions to `Awaiting Customer Reply`.

### 2. Business Logic Boundaries

The time cursor evaluates accumulated minutes against three strict constants:

1.  **Business Hours:** 09:00 to 17:00 (Local System Time).
2.  **Work Days:** Monday (1) through Friday (5).
3.  **Weekends:** Saturday (6) and Sunday (0) are completely excluded.

### 3. The Step-by-Step Logic

When the cursor detects an _Active_ period (e.g., `Waiting on Assignee` to `Awaiting Customer Reply`), it processes the duration using this exact logic:

1.  **Weekend Check:** If the cursor lands on a Saturday or Sunday, it adds 0 minutes and jumps instantly to Monday at 09:00.
2.  **Pre-Shift Check:** If the cursor is currently before 09:00, it fast-forwards to 09:00 today.
3.  **Post-Shift Check:** If the cursor is currently after 17:00, it fast-forwards to 09:00 tomorrow.
4.  **Accumulation:** If the cursor is within working hours (09:00 - 17:00, Mon-Fri), it finds the _next boundary_. The boundary is either:
    - 17:00 today.
    - The actual timestamp of the next stage change.
      _(Whichever comes first)._
5.  **Addition:** It subtracts the cursor time from the boundary time, adds those minutes to the total RWT, and moves the cursor to the boundary.

### 4. Ongoing Open Tickets

If the ticket's _final_ logged state is an Active state (e.g., it is currently `Waiting on Assignee`), the algorithm places a virtual endpoint at `new Date().toISOString()` (exactly right now) and calculates the RWT up to the current second.

---

## Example Calculation

**Scenario:**

- Ticket enters `Waiting on Assignee` on **Friday at 16:30**.
- Ticket enters `Awaiting Customer Reply` on **Monday at 10:00**.

**Cursor Execution:**

1.  **Friday 16:30 to Friday 17:00**: Cursor is inside business hours. It hits the 17:00 boundary.
    - _Accumulated:_ 30 minutes.
2.  **Friday 17:00**: Cursor jumps to Monday 09:00 (Skipping the weekend).
3.  **Monday 09:00 to Monday 10:00**: Cursor is inside business hours. It hits the final stage change.
    - _Accumulated:_ 60 minutes.
4.  **Total RWT Output:** 1 Hour, 30 Minutes.
