# How to Start the Application

## Step 1: Start Backend Server

Open Terminal 1 and run:

```bash
cd "/Users/akshav/Desktop/Real Projects/Armuga/backend"
npm run dev
```

You should see:

- "MongoDB Connected: ..."
- "Server running on port 5000"

## Step 2: Start Frontend Server

Open Terminal 2 and run:

```bash
cd "/Users/akshav/Desktop/Real Projects/Armuga/frontend"
npm run dev
```

You should see:

- "Local: http://localhost:3000"

## Step 3: Access the Application

Open your browser and go to: http://localhost:3000

## Troubleshooting

If you see "No data available":

1. Make sure both servers are running
2. Check browser console (F12) for errors
3. Verify backend is accessible at http://localhost:5000/api/health

If backend shows connection errors:

- Check that MongoDB Atlas connection string in `.env` is correct
- Verify your IP is whitelisted in MongoDB Atlas Network Access
