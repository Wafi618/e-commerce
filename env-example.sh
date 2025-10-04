# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"

# Stripe Keys (Test Mode)
STRIPE_PUBLISHABLE_KEY="pk_test_51R8wQ5Qp1gA9BIqH5EJXpFQBxRhpohWcvpwjlm3kQbgIJjq0fBiHvJMPmNA94wI3UzLvEkoKsKMgAlmz9eYWUUy500396leQnv"
STRIPE_SECRET_KEY="sk_test_51R8wQ5Qp1gA9BIqHAJG1DPNbRG9GwyGd5JBTnbsDfXgCSk9SLAQvy38GvNhLlqAd5dlJxL1BM0ShjAIxbcMuBett00A2IWQ00l"

# Stripe Webhook Secret (Get this from Stripe Dashboard or CLI)
# For local testing: stripe listen --forward-to localhost:3000/api/webhooks/stripe
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# JWT Secret (Change this to a random string in production)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-change-in-production"
