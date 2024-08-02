# Dynamic Report Generator

A web application for generating dynamic reports with a React/TypeScript frontend and a Python FastAPI backend.

## Requirements

You will need API Keys for [OpenAI](https://openai.com/), [Groq](https://groq.com/), [Anthropic](https://www.anthropic.com/), and [ConvertAPI](https://www.convertapi.com/).


!IMPORTANT!

DocxTemplater, which is the JS-library for generating docx files, is a freemium library. 
The chart-module used in page 5 is only available in the **paid version**, and has been commented out in this project

## Project Structure

- `/frontend`: React/TypeScript frontend
- `/backend`: Python FastAPI backend

## Features

- Retrieves and generates dynamic content in the backend
- Previews and renders content into document templates in the frontend
- Real-time report generation and preview

## Getting Started

Both the frontend and backend need to be running for the application to work.

### Frontend

1. Navigate to the `/frontend` directory
2. Install dependencies: `npm install`
3. Fill in API-credentials in `sample.env`, and rename it to `.env`
4. Start the react app: `npm start`

### Backend

1. Navigate to the `/backend` directory
2. Create a poetry virtual environment: `poetry install`
3. Fill in API-credentials in `sample.env`, and rename it to `.env`
4. Activate the virtual environment: `poetry shell`
5. Start the FastAPI server: `uvicorn app:app --reload`

The document templates are located in `frontend/public/temp`

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.