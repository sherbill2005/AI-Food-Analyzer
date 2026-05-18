# AI-Food-Analyzer

Simple AI-powered food analyzer with:
- **Frontend:** React Native + Expo Camera (`App.js`)
- **Backend:** FastAPI + Gemini Vision (`main.py`)
- **Config:** `.env` for Gemini API key

## Backend (FastAPI)

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Add your API key in `.env`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```
3. Run API:
   ```bash
   uvicorn main:app --reload
   ```

### Endpoint
- `POST /analyze` with form-data field `image` (file)
- Returns: `dish_name`, `portion_size_grams`, `calories`, `protein_g`, `carbs_g`, `fat_g`

## Frontend (Expo)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run app:
   ```bash
   npm run start
   ```

The app uses camera capture and sends the photo to `http://127.0.0.1:8000/analyze`.
