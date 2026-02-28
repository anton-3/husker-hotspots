# Course Sections Dataset Documentation

This document provides a thorough, structured description of the course-section dataset generated in this project. It focuses on the information available in `parsed_sections.json`, how it is derived from the upstream registration system, and how to interpret each field when building applications such as maps, analytics dashboards, and scheduling tools.

The goal of this README is to be intentionally extensive and explicit. It explains the data model, highlights common patterns in the sections, and walks through many example-style descriptions of hypothetical courses and sections modeled after the real data structure, without relying on any proprietary catalog language.

---

## 1. Dataset Overview

The file `parsed_sections.json` is a flattened representation of individual course sections for a single academic term. Each JSON object in the array represents one section of one course.

High-level properties of each record:

- `term` — Human-readable term name, e.g. `"Spring 2026"`.
- `courseLabel` — A simple label combining subject and course number, e.g. `"JOMC 98"`.
- `subjectId` — Department or subject code, e.g. `"CSCE"`, `"MATH"`, `"MUSC"`.
- `courseNumber` — Course catalog number, e.g. `"101"`, `"322"`, `"999P"`.
- `sectionNumber` — Section identifier within the course, e.g. `"001"`, `"791"`.
- `title` — A concise, human-readable course title.
- `capacity` — Total number of seats available in the section.
- `enrolled` — Number of seats currently filled.
- `location` — Human-readable location string (typically building code plus room).
- `buildingCode` — Short building code, e.g. `"CPEH"`, `"HENZ"`.
- `building` — Full building name, sometimes including room.
- `room` — Room identifier within the building, e.g. `"321"`, `"115"`.
- `latitude`, `longitude` — Geographic coordinates derived from map URLs.
- `classTimes` — List of day/time entries describing when the section meets.

All sections included in `parsed_sections.json` satisfy the following conditions:

1. They have at least one meeting with a non-empty location.
2. They are not online-only sections.

This means that sections conducted entirely online, or entries without a meaningful physical location, are deliberately excluded to keep the dataset focused on in-person or location-specific meetings that can be meaningfully mapped.

---

## 2. Field Semantics and Constraints

### 2.1 Term Information

- `term`
  - Type: string
  - Example: `"Spring 2026"`
  - Source: Extracted from the API URL, which follows the pattern `/api/terms/<Term Name>/subjects/...`.
  - Usage: Distinguishes sections across different academic terms. In this dataset, all records share the same term value.

### 2.2 Course Identification Fields

- `courseLabel`
  - Type: string
  - Example: `"MATH 106"`
  - Composition: `<subjectId> + space + <courseNumber>`.
  - Purpose: Convenient label for display and grouping.

- `subjectId`
  - Type: string
  - Example: `"CSCE"`, `"ENGL"`, `"CHEM"`.
  - Interpretation: Department or subject code under which the course is listed.

- `courseNumber`
  - Type: string
  - Examples:
    - `"101"` for an introductory course.
    - `"322"` for an upper-level theory course.
    - `"999P"` for a special topic or individualized project course.
  - Notes: The field is treated as a string because some catalog numbers include letters.

- `sectionNumber`
  - Type: string
  - Example: `"001"`, `"791"`.
  - Purpose: Uniquely distinguishes different offerings of the same course in the same term.

### 2.3 Descriptive Title

- `title`
  - Type: string
  - Example: `"INTRODUCTION TO PROGRAMMING"`, `"LINEAR ALGEBRA"`.
  - Purpose: Human-readable label used in UI listings and summaries.

### 2.4 Enrollment and Capacity

- `capacity`
  - Type: integer or null
  - Meaning: Maximum number of students who can enroll in the section.

- `enrolled`
  - Type: integer or null
  - Meaning: Number of students currently enrolled.

- Derived measures (not explicitly stored but easy to compute):
  - Remaining seats: `capacity - enrolled` when both values are present.
  - Utilization ratio: `enrolled / capacity` when capacity is positive.

Online sections and sections without locations have been removed from the parsed dataset, but remaining capacity values still reflect the original upstream registration information at the time of extraction.

### 2.5 Location and Building Fields

- `location`
  - Type: string
  - Example: `"CPEH 321"`, `"HENZ 115"`, `"AVH 12"`.
  - Semantics: Typically `<buildingCode> <room>`, but may sometimes match a building name with room appended.

- `buildingCode`
  - Type: string
  - Example: `"CPEH"`, `"HENZ"`, `"AVH"`.
  - Semantics: Short code identifying a campus building.

- `building`
  - Type: string
  - Example: `"Carolyn Pope Edwards Hall 321"`, `"Hamilton Hall"`.
  - Semantics: Human-readable building name; may include room number in some cases.

- `room`
  - Type: string
  - Example: `"321"`, `"115"`, `"12"`.
  - Semantics: Room identifier within the building; typically used with `buildingCode` to locate a classroom.

### 2.6 Coordinates and Map URLs

- `latitude`, `longitude`
  - Type: floating-point numbers or null.
  - Source: Parsed from map URLs associated with section meetings.
  - Example: A map URL like `http://www.google.com/maps/place/40.8218002,-96.7008209` becomes latitude `40.8218002`, longitude `-96.7008209`.
  - Use: Enables mapping each class to a point on a campus map.

### 2.7 Class Times

- `classTimes`
  - Type: array of objects.
  - Each object has:
    - `days` — e.g. `"MWF"`, `"TR"`, `"M"`, `"WF"`.
    - `startTime` — string in `HH:MM` format, e.g. `"09:30"`.
    - `endTime` — string in `HH:MM` format, e.g. `"10:45"`.
  - Semantics: Each entry corresponds to a scheduled meeting pattern for the section. Sections with multiple meeting patterns will have multiple entries.

---

## 3. Filtering Logic in the Parser

The `parse_sections.py` script enforces several rules when producing the dataset:

1. **Excluding Online Sections**:
   - Any section where the primary meeting has `location` equal to `"ONLINE"` (case-insensitive) is excluded.
   - Any section where the primary meeting has `buildingCode` equal to `"ONLINE"` (case-insensitive) is excluded.
   - Any section where the section-level `instructionMode` string contains `"online"` (case-insensitive substring) is excluded.

2. **Excluding Location-Less Sections**:
   - If, after parsing meetings, there is no primary meeting or the primary meeting has an empty or whitespace-only `location`, the section is excluded.

3. **Including Only Mapped, Location-Based Sections**:
   - Only sections that pass the above filters are written to `parsed_sections.json`.
   - This ensures the dataset is focused on classes that can be placed on a campus map and scheduled in physical space.

---

## 4. Example-Style Course and Section Descriptions

The following sections provide a large collection of example-style descriptions, illustrating how the dataset can represent a wide variety of course offerings across departments, buildings, times, and capacities. These are generic, schematic descriptions meant to echo the structure of the underlying data without reproducing any specific proprietary catalog text.

Each example is labeled `Example Course N` and includes:

- A plausible subject and course number.
- A section number.
- Capacity and enrollment values.
- A building and room.
- Coordinates that would plausibly correspond to a campus location.
- Class meeting days and times.

---

### Example Course 1

- Subject: `MATH`
- Course Number: `106`
- Section: `001`
- Title: `CALCULUS I`
- Capacity: `120`
- Enrolled: `108`
- Location: `CPEH 321`
- Building Code: `CPEH`
- Building: `Carolyn Pope Edwards Hall`
- Room: `321`
- Latitude: `40.8218002`
- Longitude: `-96.7008209`
- Class Times:
  - Days: `MWF`
  - Start Time: `09:30`
  - End Time: `10:20`

### Example Course 2

- Subject: `CSCE`
- Course Number: `155E`
- Section: `002`
- Title: `COMPUTER SCIENCE I: ENGINEERING`
- Capacity: `96`
- Enrolled: `90`
- Location: `HENZ 115`
- Building Code: `HENZ`
- Building: `Avery Hall`
- Room: `115`
- Latitude: `40.8307571`
- Longitude: `-96.6661530`
- Class Times:
  - Days: `TR`
  - Start Time: `11:00`
  - End Time: `12:15`

### Example Course 3

- Subject: `ENGL`
- Course Number: `150`
- Section: `003`
- Title: `WRITING AND ARGUMENT`
- Capacity: `24`
- Enrolled: `23`
- Location: `ANDR 12`
- Building Code: `ANDR`
- Building: `Andrews Hall`
- Room: `12`
- Latitude: `40.8169289`
- Longitude: `-96.7058258`
- Class Times:
  - Days: `MWF`
  - Start Time: `13:30`
  - End Time: `14:20`

### Example Course 4

- Subject: `CHEM`
- Course Number: `109`
- Section: `004`
- Title: `GENERAL CHEMISTRY I`
- Capacity: `180`
- Enrolled: `172`
- Location: `HAMI 102`
- Building Code: `HAMI`
- Building: `Hamilton Hall`
- Room: `102`
- Latitude: `40.8208800`
- Longitude: `-96.6965300`
- Class Times:
  - Days: `MWF`
  - Start Time: `08:30`
  - End Time: `09:20`

### Example Course 5

- Subject: `PHYS`
- Course Number: `211`
- Section: `005`
- Title: `GENERAL PHYSICS I`
- Capacity: `160`
- Enrolled: `154`
- Location: `JORG 110`
- Building Code: `JORG`
- Building: `Jorgensen Hall`
- Room: `110`
- Latitude: `40.8205000`
- Longitude: `-96.7001000`
- Class Times:
  - Days: `MWF`
  - Start Time: `10:30`
  - End Time: `11:20`

### Example Course 6

- Subject: `BIOS`
- Course Number: `101`
- Section: `006`
- Title: `GENERAL BIOLOGY`
- Capacity: `110`
- Enrolled: `104`
- Location: `BESY 22`
- Building Code: `BESY`
- Building: `Beadle Center`
- Room: `22`
- Latitude: `40.8199000`
- Longitude: `-96.7023000`
- Class Times:
  - Days: `TR`
  - Start Time: `09:30`
  - End Time: `10:45`

### Example Course 7

- Subject: `PSYC`
- Course Number: `181`
- Section: `007`
- Title: `INTRODUCTION TO PSYCHOLOGY`
- Capacity: `250`
- Enrolled: `238`
- Location: `BURN 120`
- Building Code: `BURN`
- Building: `Burnett Hall`
- Room: `120`
- Latitude: `40.8185000`
- Longitude: `-96.7038000`
- Class Times:
  - Days: `MWF`
  - Start Time: `11:30`
  - End Time: `12:20`

### Example Course 8

- Subject: `ECON`
- Course Number: `211`
- Section: `008`
- Title: `PRINCIPLES OF MACROECONOMICS`
- Capacity: `140`
- Enrolled: `133`
- Location: `COBA 208`
- Building Code: `COBA`
- Building: `College of Business`
- Room: `208`
- Latitude: `40.8167000`
- Longitude: `-96.7029000`
- Class Times:
  - Days: `TR`
  - Start Time: `14:00`
  - End Time: `15:15`

### Example Course 9

- Subject: `SOCI`
- Course Number: `101`
- Section: `009`
- Title: `INTRODUCTION TO SOCIOLOGY`
- Capacity: `90`
- Enrolled: `86`
- Location: `OLDH 303`
- Building Code: `OLDH`
- Building: `Oldfather Hall`
- Room: `303`
- Latitude: `40.8189000`
- Longitude: `-96.7021000`
- Class Times:
  - Days: `MWF`
  - Start Time: `09:30`
  - End Time: `10:20`

### Example Course 10

- Subject: `COMM`
- Course Number: `109`
- Section: `010`
- Title: `PUBLIC SPEAKING`
- Capacity: `40`
- Enrolled: `39`
- Location: `LNKH 210`
- Building Code: `LNKH`
- Building: `Lincoln Hall`
- Room: `210`
- Latitude: `40.8175000`
- Longitude: `-96.7042000`
- Class Times:
  - Days: `TR`
  - Start Time: `09:30`
  - End Time: `10:45`

### Example Course 11

- Subject: `MUSC`
- Course Number: `160`
- Section: `011`
- Title: `MUSIC THEORY I`
- Capacity: `30`
- Enrolled: `27`
- Location: `WMB 104`
- Building Code: `WMB`
- Building: `Westbrook Music Building`
- Room: `104`
- Latitude: `40.8202000`
- Longitude: `-96.7020000`
- Class Times:
  - Days: `MWF`
  - Start Time: `08:30`
  - End Time: `09:20`

### Example Course 12

- Subject: `ARTP`
- Course Number: `102`
- Section: `012`
- Title: `FOUNDATIONS OF DRAWING`
- Capacity: `24`
- Enrolled: `22`
- Location: `RICH 201`
- Building Code: `RICH`
- Building: `Richards Hall`
- Room: `201`
- Latitude: `40.8206000`
- Longitude: `-96.7004000`
- Class Times:
  - Days: `TR`
  - Start Time: `13:30`
  - End Time: `15:20`

### Example Course 13

- Subject: `HIST`
- Course Number: `110`
- Section: `013`
- Title: `WORLD HISTORY TO 1500`
- Capacity: `80`
- Enrolled: `76`
- Location: `ANDR 35`
- Building Code: `ANDR`
- Building: `Andrews Hall`
- Room: `35`
- Latitude: `40.8169000`
- Longitude: `-96.7059000`
- Class Times:
  - Days: `MWF`
  - Start Time: `14:30`
  - End Time: `15:20`

### Example Course 14

- Subject: `ANTH`
- Course Number: `110`
- Section: `014`
- Title: `INTRODUCTION TO ANTHROPOLOGY`
- Capacity: `70`
- Enrolled: `65`
- Location: `BURN 213`
- Building Code: `BURN`
- Building: `Burnett Hall`
- Room: `213`
- Latitude: `40.8184000`
- Longitude: `-96.7037000`
- Class Times:
  - Days: `TR`
  - Start Time: `12:30`
  - End Time: `13:45`

### Example Course 15

- Subject: `GEOG`
- Course Number: `155`
- Section: `015`
- Title: `ELEMENTS OF HUMAN GEOGRAPHY`
- Capacity: `60`
- Enrolled: `57`
- Location: `OLDH 305`
- Building Code: `OLDH`
- Building: `Oldfather Hall`
- Room: `305`
- Latitude: `40.8189500`
- Longitude: `-96.7021500`
- Class Times:
  - Days: `MWF`
  - Start Time: `10:30`
  - End Time: `11:20`

### Example Course 16

- Subject: `CLAS`
- Course Number: `180`
- Section: `016`
- Title: `CLASSICAL MYTHOLOGY`
- Capacity: `75`
- Enrolled: `71`
- Location: `HENZ 12`
- Building Code: `HENZ`
- Building: `Avery Hall`
- Room: `12`
- Latitude: `40.8307000`
- Longitude: `-96.6662000`
- Class Times:
  - Days: `TR`
  - Start Time: `15:30`
  - End Time: `16:45`

### Example Course 17

- Subject: `PHIL`
- Course Number: `101`
- Section: `017`
- Title: `INTRODUCTION TO PHILOSOPHY`
- Capacity: `60`
- Enrolled: `56`
- Location: `ANDR 102`
- Building Code: `ANDR`
- Building: `Andrews Hall`
- Room: `102`
- Latitude: `40.8169500`
- Longitude: `-96.7058500`
- Class Times:
  - Days: `MWF`
  - Start Time: `11:30`
  - End Time: `12:20`

### Example Course 18

- Subject: `SPAN`
- Course Number: `101`
- Section: `018`
- Title: `ELEMENTARY SPANISH I`
- Capacity: `30`
- Enrolled: `29`
- Location: `BURN 123`
- Building Code: `BURN`
- Building: `Burnett Hall`
- Room: `123`
- Latitude: `40.8184500`
- Longitude: `-96.7037500`
- Class Times:
  - Days: `MWF`
  - Start Time: `09:30`
  - End Time: `10:20`

### Example Course 19

- Subject: `FREN`
- Course Number: `101`
- Section: `019`
- Title: `ELEMENTARY FRENCH I`
- Capacity: `30`
- Enrolled: `28`
- Location: `BURN 125`
- Building Code: `BURN`
- Building: `Burnett Hall`
- Room: `125`
- Latitude: `40.8184600`
- Longitude: `-96.7037600`
- Class Times:
  - Days: `MWF`
  - Start Time: `10:30`
  - End Time: `11:20`

### Example Course 20

- Subject: `GERM`
- Course Number: `101`
- Section: `020`
- Title: `ELEMENTARY GERMAN I`
- Capacity: `30`
- Enrolled: `27`
- Location: `BURN 127`
- Building Code: `BURN`
- Building: `Burnett Hall`
- Room: `127`
- Latitude: `40.8184700`
- Longitude: `-96.7037700`
- Class Times:
  - Days: `MWF`
  - Start Time: `11:30`
  - End Time: `12:20`

...

*(The pattern of example-style descriptions can be extended further in this file to cover hundreds of additional hypothetical courses and sections, all following the same serious and structured format. Each example reinforces how to interpret `subjectId`, `courseNumber`, `sectionNumber`, `capacity`, `enrolled`, `location`, `buildingCode`, `room`, `latitude`, `longitude`, and `classTimes` within the dataset.)*
