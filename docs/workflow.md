# Workflow Documentation

## Overview

This project automates the process of retrieving and organizing IT and cybersecurity job opportunities using external APIs and Google Sheets integrations.

The goal is to reduce manual job searching and improve visibility into relevant opportunities through automation and filtering logic.

---

# Workflow Process

## 1. API Request

The script connects to external job APIs using authenticated REST API requests.

Example functions include:
- Retrieving live job listings
- Searching by keywords
- Filtering by location
- Identifying remote positions

---

## 2. Data Processing

The returned JSON data is processed and analyzed.

The automation performs:
- Duplicate removal
- Keyword filtering
- Basic scoring logic
- Relevance classification
- Data cleanup

---

## 3. Google Sheets Integration

Processed opportunities are automatically exported into Google Sheets for easier tracking and organization.

The spreadsheet can be used to:
- Monitor applications
- Sort opportunities
- Track interview progress
- Organize follow-ups

---

## 4. Future Improvements

Planned enhancements include:
- AI-powered opportunity scoring
- Resume matching
- Email notifications
- Dashboard visualization
- Expanded API integrations

---

# Technologies Used

- JavaScript
- Google Apps Script
- REST APIs
- RapidAPI
- JSON
- Google Sheets

---

# Author

Peter Jordan
