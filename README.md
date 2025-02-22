# TaskFlow Backend API

## Overview

The TaskFlow Backend is built using Node.js, Express, and MongoDB. It provides a RESTful API for managing tasks in a Task Management Application. The API supports the following operations:

- **Create tasks** (POST)
- **Retrieve tasks** (GET)
- **Update tasks** (PATCH)
- **Delete tasks** (DELETE)

In addition, real-time updates are provided via Socket.io, which listens to changes in the MongoDB task collection and notifies connected clients instantly.

## Features

- **Task CRUD Operations:**  
  - **POST /addtask:** Create a new task.  
  - **GET /tasks/:email:** Retrieve tasks for a given user (optionally filtered by category).  
  - **GET /task/:id:** Retrieve details for a specific task.  
  - **PATCH /update/task/:id:** Update a task   
  - **DELETE /task/:id:** Delete a task.
- **Real-Time Synchronization:**  
  Uses MongoDB change streams and Socket.io to broadcast task changes to all connected clients.
- **Authentication:**  
  Provides JWT-based authentication for protected routes.
- **CORS Enabled:**  
  Supports Cross-Origin Resource Sharing for seamless integration with the frontend.

## Live Demo

Available for real-time use: [TaskManager Backend Live Demo](https://jobtask-red.vercel.app/)
