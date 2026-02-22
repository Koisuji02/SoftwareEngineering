# Project Estimation Part 2

The goal of this document is to compare the actual effort and size of the project with the estimates made in Task 1.

## Size computation

To compute the lines of code, use cloc:
- To install cloc: `npm install -g cloc`
- On Windows, you also need a Perl interpreter: https://strawberryperl.com/
- To run cloc: `cloc <directory containing ts files> --include-lang=TypeScript`
- Collect the *code* value (rightmost column of the result table)

Compute two separate size values:
- LOC of production code: `cloc <GeoControl\src> --include-lang=TypeScript`
- LOC of test code: `cloc <GeoControl\test> --include-lang=TypeScript`

**Actual values (as of June 4, 2025):**
- LOC of production code: **2899**
- LOC of test code: **8834**
- Total LOC: **11733**

## Effort computation

The total effort is the sum of all activities (Task 1, Task 2, Task 3) at the end of the project (June 7), excluding Task 4. The values are taken from TimeSheet.md.

**Effort summary:**
- Requirement engineering: 27 hours
- Design: 11 hours
- Coding: 31 hours
- Unit testing: 50 hours
- Integration testing: 52 hours
- Acceptance testing: 15 hours

**Total effort:** 27 + 11 + 31 + 50 + 52 + 15 = **186 hours**

## Productivity computation

Productivity = (LOC of production code + LOC of test code) / effort

Productivity = (2899 + 8834) / 186 = **63.1 loc/hour**

## Comparison

|                                    | Estimated (Task 1) | Actual (June 7, end of Task 3) |
| ---------------------------------- | ------------------ | ------------------------------- |
| Production code size (LOC)         | 1440               | 2899                           |
| Test code size (LOC)               | not available      | 8834                           |
| Total size (LOC)                   | 1440               | 11733                          |
| Effort (person-hours)              | 185 (activity decomp.) | 186                       |
| Productivity (loc/hour)            | 10                 | 63.1                           |

- The estimated effort from activity decomposition in Task 1 was **185 person-hours**.
- The actual effort was **186 person-hours**.
- The estimated productivity was **10 loc/hour** (as per instructions in Task 1), while the actual productivity was **63.1 loc/hour**.

**Effort estimated by activity decomposition (Task 1):**
185 person-hours


