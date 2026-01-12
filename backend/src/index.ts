
import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import postgres from 'postgres';

// --- Database Setup ---
const sql = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password',
});

// Initialize Tables
const initDb = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Database initialized: "reviews" table ready.');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};

await initDb();

// --- App Setup ---
const app = new Elysia()
  .use(cors())
  .get('/', () => ({ status: 'healthy', message: 'EDI Insight Backend is running' }))
  
  // GET Reviews
  .get('/reviews', async () => {
    try {
      const reviews = await sql`
        SELECT * FROM reviews ORDER BY created_at DESC
      `;
      return reviews;
    } catch (error) {
      console.error(error);
      return new Response('Error fetching reviews', { status: 500 });
    }
  })

  // POST Review
  .post('/reviews', async ({ body }) => {
    const { content, rating } = body;
    
    try {
      const newReview = await sql`
        INSERT INTO reviews (content, rating)
        VALUES (${content}, ${rating})
        RETURNING *
      `;
      return newReview[0];
    } catch (error) {
      console.error(error);
      return new Response('Error saving review', { status: 500 });
    }
  }, {
    body: t.Object({
      content: t.String(),
      rating: t.Number({ minimum: 1, maximum: 5 })
    })
  })

  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
