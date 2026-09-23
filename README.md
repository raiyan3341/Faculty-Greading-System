# Class Companion

# Academic Class & Assessment Management System




## 1. Project Overview




Build a professional, modern and fully responsive web application inspired by Google Classroom, but designed mainly for **university faculty to manage classes, students, attendance, assessments, marks, grading, notices and academic reports**.




The system should have a clean professional academic dashboard and should be easy for both faculty and students to use.




The main focus of this project is not only class communication. The main purpose is to make the complete academic management process easier for faculty.




The system should support this complete workflow:




**Login → Create/Join Class → Add Students → Manage Attendance → Create Assessments → Enter Marks → Automatic Grading → Student Result → Generate Official PDF/Excel Report**




Do not make unnecessary complex features. Prioritize the core academic functionality, data security and class-wise data separation.




---




# 2. Authentication & User System




Users should be able to log in using Google/Gmail authentication.




There should NOT be a permanent Faculty or Student role during registration.




Every user starts as a normal user.




The user's role is determined by their action inside the system:




* If a user creates a class, they become the Faculty/Instructor of that class.

* If a user joins another class using its class code, they become a Student of that class.




The same user can be:




* Faculty in multiple classes.

* Student in multiple classes.

* Faculty in some classes and Student in other classes.




The system must support logout, protected routes and authenticated access.




---




# 3. Landing/Home Page




Create a professional landing page before login.




The Home page should contain:




### Hero Section




* Project name

* Short description

* Professional academic visual

* Login / Get Started button




### Main Features




Briefly show:




* Class Management

* Student Management

* Attendance Tracking

* CT / Quiz / Presentation

* Mid & Final Marks

* Automatic Grading

* OCR Student Scanner

* Notes & Resources

* PDF/Excel Reports




### How It Works




Show a simple process:




1. Login

2. Create or Join Class

3. Manage Students and Academic Activities

4. Generate Final Report




### Footer




Include:




* Project name/logo

* Short description

* Quick navigation links

* Contact/GitHub links if needed

* Copyright information




---




# 4. Navbar




After login, use a professional responsive navbar.




The navbar should contain:




* Project Logo/Name

* Home

* Dashboard

* My Classes

* Create Class

* Join Class

* Notifications

* Profile

* Logout




On mobile devices, use a responsive hamburger/sidebar menu.




The navbar should clearly show the current page/class context.




---




# 5. User Dashboard




After login, users should see a personalized dashboard.




The dashboard should show:




* Number of classes created

* Number of classes joined

* Total students in created classes

* Recent classes

* Recent notices/activities

* Recent marks or attendance updates




Provide quick action buttons:




* Create Class

* Join Class

* Open My Classes




Add search/filter where useful so users can quickly find a class.




---




# 6. Create Class




A user should be able to create multiple classes.




The Create Class form should contain:




### Required




* Department

* Subject

* Section

* Semester

* Academic Year




### Optional




* Class description

* Room

* Class schedule




After successful creation:




* Generate a unique class code.

* Show the code clearly to the faculty.

* Provide a copy button.

* Faculty can share the code with students.




Example:




**Department:** CSE

**Subject:** Database Management System

**Section:** A

**Semester:** Spring 2026

**Class Code:** DBMS-A7X92




The user who creates the class becomes the Faculty/Instructor of that specific class.




A faculty can create unlimited classes.




Faculty must also be able to:




* Edit class information.

* Delete a class.




Deleting a class should affect only that class and its associated data.




---




# 7. Join Class




Students should be able to join classes using the unique class code.




The Join Class page should contain a simple class-code input.




After entering a valid code:




* Verify the class.

* Show basic class information.

* Allow the user to confirm joining.




A student can join multiple classes.




The same student may belong to many different classes at the same time.




Students should also have the option to leave/reroll from a class.




Leaving one class must not affect the student's membership or academic data in other classes.




---




# 8. Class Dashboard




Every class should have its own independent dashboard.




For example:




**CSE → Database Management System → Section A → Spring 2026**




Inside the class, provide navigation such as:




* Overview

* Notices

* Students

* Attendance

* Assessments & Marks

* Results

* Resources

* Discussion

* Reports




The class dashboard should display:




* Subject

* Department

* Section

* Semester

* Academic Year

* Faculty name

* Class code

* Total students

* Recent activities




---




# 9. Class Data Isolation




This is one of the most important requirements.




Every class must have completely independent data.




For example:




Faculty creates:




**Class A → Database Management System**




and




**Class B → Computer Networks**




The students, marks, attendance, assessments, resources and notices of Class A must NEVER appear in Class B.




All academic data must be connected to the correct class.




A faculty should only be able to manage classes they created.




A student should only be able to access classes they joined.




Never use global student/marks/attendance data that can accidentally mix different classes.




---




# 10. Student Management




Inside a faculty's class, provide a Students section.




Each student should have:




* Name

* Student ID/Roll

* Email

* Attendance percentage

* Total/current marks

* Final grade




Faculty should be able to:




* Add students manually.

* Edit student information.

* Remove students from the class.

* Search students by name or ID.

* Filter students when necessary.




Students should not be able to modify their own academic information.




---




# 11. Student List Scanner / OCR System




This is one of the main unique features of the project.




Faculty may have a physical student list containing information such as:




* Student Name

* Student ID/Roll




Instead of manually entering every student, faculty can upload:




* Image/photo of the list

* Scanned document

* PDF




The system should use OCR/document scanning to automatically extract student information.




Example extracted result:




| Student Name | Student ID |

| ------------ | ---------- |

| Rahim Ahmed  | 101        |

| Karim Hasan  | 102        |

| Sakib Khan   | 103        |




Before importing, show a **verification screen**.




Faculty should be able to:




* Correct wrong OCR data.

* Delete incorrect rows.

* Add missing rows.

* Confirm the final list.




After clicking **Import Students**, all verified students are added only to the current class.




This scanned data must never automatically appear in another class.




---




# 12. Notices / Announcements




Each class should have a Notices section.




Faculty can create notices such as:




* Exam announcements

* Class cancellations

* Assignment information

* Important academic instructions




A notice should support:




* Title

* Description

* Date/time

* Optional attachment




Faculty can:




* Create notice

* Edit notice

* Delete notice




Students can only read notices.




---




# 13. Resources / Study Materials




Each class should have a Resources section.




Faculty can upload:




* PDF

* Notes

* Documents

* Images

* Study materials




Each resource should have:




* Title

* Description

* Upload date

* File




Students can view and download available resources.




Keep the resource system simple and reliable.




---




# 14. Comments / Discussion




Provide a simple discussion/comment area inside the class or under resources/notices.




Students can ask questions or post comments.




Faculty can reply to comments.




Faculty should be able to remove inappropriate comments.




This should remain a simple academic discussion system, not a full social-media system.




---




# 15. Attendance Management




Every class should have an Attendance section.




Faculty can create attendance sessions based on date.




For each student, faculty can select:




* Present

* Absent

* Late




Faculty should be able to:




* Create attendance session.

* Edit attendance.

* Delete an attendance session.

* View previous attendance records.




Example:




**Attendance — 15 September 2026**




| Student | Status  |

| ------- | ------- |

| Rahim   | Present |

| Karim   | Late    |

| Hasan   | Absent  |




---




# 16. Attendance Analysis




The system should automatically calculate attendance statistics for every student.




For each student show:




* Total classes

* Present count

* Absent count

* Late count

* Attendance percentage




Example:




**Rahim Ahmed**




Total Classes: 30

Present: 25

Late: 2

Absent: 3

Attendance: 83.33%




Students can see their own attendance and percentage.




Faculty can see the complete class attendance analysis.




Use a clear table and/or progress indicator.




---




# 17. Attendance Report




Faculty should be able to export attendance data separately.




Support:




* CSV

* PDF




The report should contain:




* Student name

* Student ID

* Total classes

* Present

* Late

* Absent

* Attendance percentage




---




# 18. Assessment Management




The faculty should be able to create flexible assessment sections.




Default assessment types should include:




* CT

* Quiz

* Presentation

* Midterm

* Final




For CT, the faculty can create:




* CT 1

* CT 2

* CT 3

* CT 4

* etc.




The same concept should work for Quiz and other assessment types.




Faculty should also be able to create completely custom assessments.




Examples:




* Assignment

* Lab

* Viva

* Project

* Participation




Every assessment should contain:




* Assessment name

* Maximum marks

* Date

* Optional description




Faculty can:




* Create assessment

* Edit assessment

* Delete assessment




Deleting an assessment should not delete unrelated assessments or attendance data.




---




# 19. Marks Entry




Marks should be managed using a spreadsheet-style table because faculty may have many students.




Example:




| Student | CT 1 | CT 2 | Quiz 1 | Presentation | Mid | Final |

| ------- | ---: | ---: | -----: | -----------: | --: | ----: |

| Rahim   |    8 |    9 |      8 |            9 |  38 |    75 |

| Karim   |    7 |    8 |      7 |            8 |  35 |    70 |




Faculty should be able to:




* Enter marks quickly.

* Edit marks.

* Save marks.

* Search students.

* Filter students.

* See maximum marks.

* See totals.




Validation is required.




For example:




If an assessment has maximum marks of 10, the system must not allow a mark of 11.




Students can only view their own marks.




---




# 20. Flexible Final Grading




The system should automatically calculate the final result from all required academic sections.




Faculty should be able to define assessment weights.




Example:




* Attendance = 10%

* CT = 20%

* Quiz = 10%

* Presentation = 10%

* Midterm = 20%

* Final = 30%




The system calculates:




**Weighted Marks → Total Marks → Percentage → Letter Grade**




Support grades such as:




* A+

* A

* A-

* B+

* B

* B-

* C+

* C

* D

* F




The grading scale should be configurable instead of hard-coded if practical.




The final grade should automatically update when marks are changed.




---




# 21. Complete Class Marksheet




Inside every class, provide a complete spreadsheet-style marksheet.




The faculty should be able to see all students and all assessment marks in one place.




The table should include:




* Student Name

* Student ID/Roll

* Attendance

* CT marks

* Quiz marks

* Presentation

* Midterm

* Final

* Custom assessment marks

* Total

* Percentage

* Grade




The table should support horizontal scrolling for many assessment columns.




Provide search/filter options.




---




# 22. PDF Official Marksheet




At the end of the semester, faculty should be able to click:




**Generate Final Report**




The system should create a professional, formatted PDF suitable for university submission.




The PDF should contain:




* University/Department

* Subject

* Section

* Semester

* Academic Year

* Faculty name

* Student Name

* Student ID/Roll

* Attendance

* All assessment marks

* Total

* Percentage

* Letter Grade




Provide:




**Preview → Generate → Download PDF**




The PDF should be clean and properly formatted.




---




# 23. Excel Export




In addition to PDF, provide an optional:




**Export Excel (.xlsx)**




The Excel file should contain the complete marksheet in a spreadsheet-friendly format.




This allows faculty to further edit or submit the data when required.




---




# 24. Student View




When a student opens a class, the student should have read-only access.




Students can:




* Read notices.

* Download resources.

* View discussion/comments.

* View their own attendance.

* View attendance percentage.

* View their own CT marks.

* View quiz marks.

* View presentation marks.

* View midterm marks.

* View final marks.

* View custom assessment marks.

* View total marks.

* View percentage.

* View final grade.




Students must NOT be able to:




* Edit marks.

* Edit attendance.

* Delete assessments.

* Modify student records.

* Access another student's private marks.




---




# 25. Notifications




Add a basic notification system.




Students can receive notifications for:




* New notice

* New resource

* New assessment

* New marks

* Attendance update




Show an unread notification count in the navbar.




Keep notifications simple and useful.




---




# 26. Search & Filtering




Provide search/filter functionality where useful.




Faculty should be able to search:




* Student name

* Student ID/Roll

* Assessment

* Attendance records




Dashboard should also provide class search/filter for users with many classes.




---




# 27. UI / UX Requirements




The website must look like a professional real-world university application.




Design requirements:




* Clean modern interface

* Professional academic dashboard

* Responsive cards and tables

* Proper spacing

* Clear buttons

* Clear success/error messages

* Loading states

* Empty states

* Confirmation dialogs before destructive actions

* Mobile, tablet and desktop support




Optional:




* Dark/Light mode

* Small smooth animations




Do not use excessive animations or complicated UI that reduces usability.




---




# 28. Security & Access Control




Implement secure authentication and class-based authorization.




### Faculty




Faculty can manage only classes they created.




### Student




Students can access only classes they joined.




### Students cannot




* Edit academic records.

* See other students' private marks.

* Modify attendance.

* Delete assessments.

* Access another class without membership.




All API/database operations must verify the user's permission and the relevant class ID.




Do not rely only on frontend hiding. Access control must also be enforced on the backend.




---




# 29. Validation & Error Handling




Add validation throughout the application.




Examples:




* Marks cannot exceed maximum marks.

* Required class fields cannot be empty.

* Invalid class codes cannot be used.

* Duplicate class joining should be prevented.

* Invalid student IDs should be handled.

* OCR mistakes must be verified before import.

* Unauthorized users must receive proper access-denied responses.

* Delete actions should require confirmation.




Show clear user-friendly error messages.




---




# 30. Main Application Structure




The overall application should follow this structure:




**Public**




Home

Login




**Authenticated**




Dashboard

My Classes

Create Class

Join Class

Notifications

Profile




**Inside Class**




Overview

Notices

Students

Attendance

Assessments

Marks

Results

Resources

Discussion

Reports




---




# 31. Complete System Workflow




### Faculty Workflow




Login with Gmail




↓




Create Class




↓




Select Department + Subject + Section + Semester




↓




System generates Class Code




↓




Share Class Code with students




↓




Students join the class




↓




Faculty scans student list using OCR




↓




System extracts Name + ID




↓




Faculty verifies/corrects the data




↓




Students are imported into that specific class




↓




Faculty creates Attendance sessions




↓




Faculty creates CT / Quiz / Presentation / Mid / Final / Custom assessments




↓




Faculty enters marks




↓




System calculates attendance, total marks, percentage and grade




↓




Students view their own academic information




↓




Semester ends




↓




Faculty generates official PDF marksheet




↓




Optionally export complete marksheet as Excel




---




# 32. Final Development Priority




The following features are the highest priority and must not be skipped:




1. Google authentication

2. Multiple class creation

3. Class code and joining system

4. Multiple class membership

5. Class deletion and leave/reroll

6. Strict class-wise data isolation

7. Student management

8. OCR student list scanner

9. Attendance with Present/Absent/Late

10. Attendance percentage analysis

11. CT / Quiz / Presentation / Mid / Final

12. Custom assessments

13. Assessment create/edit/delete

14. Spreadsheet-style marks entry

15. Automatic weighted grading

16. Student read-only result

17. Notices and resources

18. PDF final marksheet

19. Excel marksheet export

20. Attendance PDF/CSV export

21. Search/filter

22. Secure backend authorization

23. Responsive professional UI




**Important:** Build the project around these core requirements first. Do not sacrifice functionality for visual effects. Every class must keep its own students, attendance, marks, assessments, notices and resources completely separate from other classes.

MAKE THE WEBSITE USING REACT JS, TAILWINDCSS, FIREBASE, MONGODB...

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://grade-ease-44.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d63ce7c5-64c1-4622-8eed-808d06844000).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
