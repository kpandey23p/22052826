# Backend Microservices Project

This repository contains two backend microservices developed to solve distinct problems using RESTful APIs. Each microservice is housed in its own folder with independent setup and functionality.

## Folder Structure
- **`average-calculator/`**: A microservice that fetches numbers from a third-party server and computes their average based on specified types.
- **`social-media-analytics/`**: A microservice providing real-time analytics for social media data, including user and post insights.

## Prerequisites
- Node.js (v16 or higher recommended)
- Git
- An API client (e.g., Postman or Insomnia) for testing

## Setup Instructions
1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd <repository-folder>
<repository-name>/
├── average-calculator/
│   ├── index.js          # Main code for the Average Calculator microservice
│   ├── package.json      # Dependencies and scripts for average-calculator
│   ├── .gitignore        # Ignores node_modules/
│   ├── screenshots/      # Screenshots for this microservice
│   │   ├── avg_calc_e.png    # Example: Screenshot of GET /numbers/e
│   │   ├── avg_calc_p.png    # Example: Screenshot of GET /numbers/p
├── social-media-analytics/
│   ├── index.js          # Main code for the Social Media Analytics microservice
│   ├── package.json      # Dependencies and scripts for social-media-analytics
│   ├── .gitignore        # Ignores node_modules/
│   ├── screenshots/      # Screenshots for this microservice
│   │   ├── top_users.png     # Example: Screenshot of GET /users
│   │   ├── latest_posts.png  # Example: Screenshot of GET /posts?type=latest
│   │   ├── popular_posts.png # Example: Screenshot of GET /posts?type=popular
└── README.md             # Main project overview and instructions
