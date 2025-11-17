# How to Get News API Key

## Overview

The News API key is used by the Indian Health Data ETL service to fetch news articles about disease outbreaks. This helps identify emerging outbreaks from news sources.

## Step-by-Step Guide

### 1. Visit NewsAPI.org

Go to: **https://newsapi.org/**

### 2. Sign Up for Free Account

1. Click **"Get API Key"** or **"Sign Up"** button
2. Fill in your details:
   - Email address
   - Password
   - Name
3. Verify your email address (check your inbox)

### 3. Get Your API Key

1. After logging in, go to your **Dashboard**
2. Your API key will be displayed on the dashboard
3. Copy the API key (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 4. Configure in MedSentinel

Add the API key to your `.env` file:

```bash
# In backend/.env
NEWS_API_KEY=your_actual_api_key_here
ENABLE_INDIAN_HEALTH_ETL=true
```

## Free Tier Limitations

**Free Tier Includes:**
- ✅ 100 requests per day
- ✅ Development use only
- ✅ Basic news search
- ✅ All news sources

**Restrictions:**
- ❌ Not for commercial use
- ❌ Rate limited (100 requests/day)
- ❌ Some sources may be limited

**For Production:**
- Consider upgrading to a paid plan
- Or use alternative news sources
- Or disable news-based detection if not needed

## Alternative: Disable News API

If you don't want to use News API, you can:

1. **Leave it unconfigured:**
   ```bash
   # In backend/.env
   ENABLE_INDIAN_HEALTH_ETL=false
   # Or simply don't set NEWS_API_KEY
   ```

2. **The ETL will skip news extraction** and only use other sources (when available)

## Testing Your API Key

Once configured, test it:

```bash
# Manual trigger
curl -X POST http://localhost:4000/api/etl/indian-health-data
```

Or check the logs when the ETL runs to see if news extraction is working.

## Troubleshooting

### "Invalid API Key" Error

- Verify you copied the entire key correctly
- Check for extra spaces in `.env` file
- Ensure the key is on a single line
- Try regenerating the key from the dashboard

### "Rate Limit Exceeded" Error

- Free tier allows 100 requests per day
- Wait 24 hours or upgrade to paid plan
- Reduce frequency of ETL runs

### "News API Not Working"

- Check your internet connection
- Verify NewsAPI.org is accessible
- Check if your IP is blocked (unlikely)
- Review API status: https://newsapi.org/status

## Important Notes

1. **Free Tier is for Development Only**
   - Not suitable for production/commercial use
   - Consider alternatives for production

2. **API Key Security**
   - Never commit API keys to git
   - Use `.env` file (already in `.gitignore`)
   - Rotate keys if exposed

3. **Optional Feature**
   - News API is optional
   - Indian Health ETL works without it
   - Only used for outbreak detection from news

## Alternative News Sources

If NewsAPI doesn't work for you, consider:

1. **Google News RSS** (free, no API key)
2. **RSS feeds** from health department websites
3. **Web scraping** (with proper permissions)
4. **Social media APIs** (Twitter, etc.)

## Quick Reference

- **Website:** https://newsapi.org/
- **Sign Up:** https://newsapi.org/register
- **Dashboard:** https://newsapi.org/account
- **Documentation:** https://newsapi.org/docs
- **Pricing:** https://newsapi.org/pricing

## Configuration Example

```bash
# backend/.env
# Indian Health Data ETL (optional)
ENABLE_INDIAN_HEALTH_ETL=true
NEWS_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

After adding the key, restart your backend server for changes to take effect.

