# Persist Fitness

Persist Fitness is an AI-assisted workout companion designed to help lifters plan, track, and refine their training over time. It focuses on consistency and progression: logging detailed workouts, exploring exercise tutorials, and generating smart suggestions that adapt to each user’s goals and training history.

What This Project Demonstrates
This project is built to show employers that you can design and implement a practical, production-style app end to end: from database modeling and backend APIs to a modern, responsive frontend and AI-assisted features. It emphasizes clean architecture, real-world workflows, and technologies that are common in industry, all while staying deployable on free tiers.

Core User Experience
At its core, Persist Fitness gives a user three main workflows:

Log workouts with real detail
Users can create workouts, add exercises, and record sets with reps, weight, RIR, tempo, and notes. Over time, they can review history by date, see volume trends, and spot progress in specific lifts or muscle groups.

Explore exercises and tutorials
Users can search and filter a full exercise library by muscle group, equipment, or difficulty, backed by an open exercise dataset such as free-exercise-db. Each exercise includes key info like target muscles, equipment, and “how-to” instructions, effectively acting as a tutorial browser baked into the app.

Get AI-assisted guidance
Users can ask the app for workout suggestions based on their goals (e.g., strength vs hypertrophy), available equipment, time, and recent training history. The AI layer returns structured workout templates and form cues for specific exercises, helping users plan sessions and avoid common mistakes.

Feature Highlights
Workout tracker/logger

Create, edit, and delete workouts.

Add exercises with multiple sets, tracking load, reps, and effort.

View past sessions, PRs, and weekly or monthly training volume.

Exercise selection and “how-to” information

Exercise library seeded from a public, free dataset like free-exercise-db.

Filter by muscle group (e.g., chest, back, legs), equipment (e.g., barbell, dumbbell, machine), and movement type.

Detail pages that describe the exercise, cues, and safety notes so users know how to perform movements correctly.

Workout suggestions and templates (AI-assisted)

Generate personalized workout templates based on user profile (experience level, primary goal, frequency, equipment).

Automatically save AI-generated routines as templates users can reuse, tweak, and log against.

Provide quick “form checkpoints” for selected exercises (e.g., “bench press for an intermediate lifter”) as concise text guidance.

Pre- and post-workout flows

Pre-workout: simple readiness check (sleep, stress, soreness) plus warm-up suggestions tailored to the session.

Post-workout: cool-down ideas and a reflection screen for RPE and notes, feeding back into AI suggestions over time.

Profiles and preferences

User accounts with basic profile info (height, weight, training age, goals).

Equipment and time-availability preferences to keep suggestions realistic.

Saved favorite exercises and templates for fast session building.

Technical Overview
Persist Fitness is implemented as a modern full-stack web application:

Frontend

Built with React and a framework like Next.js to handle routing, data fetching, and server-side rendering where helpful.

Styled with a utility-first CSS framework and component library for a smooth, responsive, and interactive UI that feels like a serious training tool, not a toy.

Backend and data

A relational database models users, profiles, exercises, workouts, sets, and templates, showing real-world schema design.

The exercise catalog is seeded from a free, open database such as free-exercise-db, giving a large, realistic dataset to work with.

API endpoints expose workout logging, exercise browsing, and AI suggestion workflows to the frontend.

AI integration

A dedicated backend layer calls an LLM provider (chosen for a generous free tier) to generate workout templates and textual form cues.

Requests are grounded in the user’s profile and recent logs so suggestions feel personalized and not generic boilerplate.

Deployment and cost awareness

Designed to run entirely on free developer tiers (e.g., frontend on Vercel Hobby, database on a free Postgres host, and AI via a provider’s free or trial quota), making it a realistic personal project that doesn’t require ongoing spend.

Why This Project Exists
Persist Fitness exists as both a real tool and a portfolio piece:

For users, it lowers the friction of sticking to a program: everything from exercise selection to logging and reflection is in one place, assisted by AI instead of static templates.

For employers, it showcases the ability to ship a cohesive product: thoughtful UX, robust backend, database design, integration with external datasets and AI, and cloud deployment on a modern stack.
