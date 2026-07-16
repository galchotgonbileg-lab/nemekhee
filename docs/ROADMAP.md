# Roadmap

## MVP

- Product catalog with SKU, category, unit, sale price, and reorder level
- Stock movements for incoming, outgoing, and adjustment entries
- Low-stock dashboard
- User roles for admin, warehouse manager, and sales

## Next

- PostgreSQL persistence with Prisma migrations
- Authentication with JWT refresh tokens
- Supplier and customer records
- Purchase orders and sales orders
- Barcode scanning support for web and mobile

## Mobile

- Add an Expo app at `apps/mobile`
- Reuse API endpoints and shared types from `packages/shared`
- Add camera-based barcode scanning
