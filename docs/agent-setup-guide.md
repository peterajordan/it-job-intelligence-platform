# Agent Setup Guide

## Overview

This project uses three AI-assisted agents:

1. Job Retrieval Agent
2. Filtering and Classification Agent
3. Opportunity Scoring Agent

## How to Recreate the Agents

### Step 1: Create the agents folder

Create a folder named:

agents

### Step 2: Add each agent file

Create the following files:

agents/job_retrieval_agent.js  
agents/filtering_agent.js  
agents/scoring_agent.js

### Step 3: Add your API key

Replace this placeholder with your own API key:

const API_KEY = "YOUR_API_KEY";

### Step 4: Run the workflow

The main script calls the agents in this order:

1. Retrieve jobs
2. Filter and classify jobs
3. Score opportunities
4. Export results to Google Sheets
