# Project Estimation

Date: 16/04/2025

Version: 1.1

# Estimation approach

Consider the GeoControl project as described in the swagger, assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch.

# Estimate by size

|                                                                                                         | Estimate |
| ------------------------------------------------------------------------------------------------------- | -------- |
| NC = Estimated number of classes to be developed                                                        | 12       |
| A = Estimated average size per class, in LOC                                                            | 120       |
| S = Estimated size of project, in LOC (= NC \* A)                                                       | 1440      |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)                    | 144       |
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro)                                     | 4320    |
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) | 6     |

# Estimate by product decomposition

| Component Name       | Estimated Effort (Person Hours) |
| -------------------- | ------------------------------- |
| Requirement Document | 20                              |
| Design Document      | 30                              |
| Code                 | 70                              |
| Unit Tests           | 20                              |
| API Tests            | 20                              |
| Integration Tests    | 10                              |
| Management Documents | 10                              |

**Total Effort**: **180 person-hours**

# Estimate by activity decomposition

| Activity Name        | Estimated Effort (Person Hours) |
| -------------------- | ------------------------------- |
| Requirement Analysis | 20                              |
| System Design        | 30                              |
| Implementation       | 60                              |
| Testing              | 50                              |
| Documentation        | 10                              |
| Deployment           | 5                               |
| Project Management   | 10                              |

**Total Effort**: **185 person-hours**

### Gantt Chart

| Week | Activity              | Effort (Hours) |
| ---- | --------------------- | -------------- |
| 1    | Requirement Analysis  | 20             |
| 2    | System Design         | 30             |
| 3-4  | Implementation        | 60             |
| 5    | Testing               | 50             |
| 6    | Documentation         | 10             |
| 6    | Deployment            | 5              |
| 1-6  | Project Management    | 10             |

# Summary

|                                    | Estimated Effort (Person Hours) | Estimated Duration (Weeks) |
| ---------------------------------- | ------------------------------- | -------------------------- |
| Estimate by Size                   | 144                              | 6                       |
| Estimate by Product Decomposition  | 180                             | 8                       |
| Estimate by Activity Decomposition | 185                             | 8                       |

**Notes**:
- The size-based estimate focuses only on the code and is therefore lower.
- The product and activity decomposition estimates are more comprehensive and include all aspects of the project.
- The slight difference between product and activity decomposition is due to the inclusion of additional tasks like deployment and integration testing in the activity-based estimate.