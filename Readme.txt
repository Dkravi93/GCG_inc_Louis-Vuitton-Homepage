gcg-test-inv/
│
├── frontend/                 # React (Vite) app
│   ├── public/               # Static assets (videos, fonts, icons)
│   ├── src/
│   │   ├── assets/           # Images, brand assets
│   │   ├── components/       # Shared UI components (Navbar, Hero, Footer)
│   │   ├── pages/            # Page-level components
│   │   │   ├── Home.tsx
│   │   │   ├── Catalog.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── Cart.tsx
│   │   │   └── Checkout.tsx
│   │   ├── routes/           # Route configuration
│   │   │   └── index.tsx
│   │   ├── hooks/            # Custom hooks (e.g. useCart, useAuth)
│   │   ├── context/          # Global context (cart, auth, products)
│   │   ├── services/         # API calls to backend
│   │   │   └── productService.ts
│   │   ├── types/            # TypeScript interfaces for Product, User, etc.
│   │   └── main.tsx
│   └── vite.config.ts
│
├── backend/                  # Node.js / Express API
│   ├── src/
│   │   ├── config/           # DB, env, constants
│   │   ├── models/           # MongoDB schemas (Product, Order, User)
│   │   ├── controllers/      # Business logic
│   │   ├── routes/           # Express routes
│   │   │   ├── productRoutes.ts
│   │   │   ├── orderRoutes.ts
│   │   │   └── userRoutes.ts
│   │   ├── middlewares/      # Auth, error handling
│   │   ├── utils/            # Helpers (file upload, validation)
│   │   ├── server.ts         # Express app entry
│   │   └── app.ts
│   └── package.json
│
├── shared/                   # (Optional) Shared types/interfaces
│   └── types.ts
│
├── .env                      # Environment variables
├── package.json              # Root (scripts for frontend/backend)
├── README.md                 # Project plan + setup guide
└── timeline.md               # Timeline & deliverables
