# Firestore Security Specification - fooddash

## Data Invariants
1. A user can only access their own profile.
2. Orders must be linked to a valid user and restaurant.
3. Only the involved user and assigned driver can see order details and chat.
4. Only admins can manage restaurants, menu items, and promotions.
5. Drivers can only access orders assigned to them or pending/preparing orders.

## The "Dirty Dozen" Payloads (Security Test Cases)
1. **Self-Elevate Admin**: Trying to set `isAdmin: true` on user registration.
2. **Ghost Field Update**: Updating a restaurant with `isVerified: true` maliciously.
3. **Identity Spoofing**: Creating an order with someone else's `userId`.
4. **PII Leak**: A signed-in user trying to read another user's profile.
5. **Orphaned Order**: Creating an order with a non-existent `restaurantId`.
6. **Price Poisoning**: Submitting an order with a zero or negative price.
7. **Status Shortcut**: A user trying to set order status to `completed` manually.
8. **Resource Exhaustion**: Sending 10MB string as a message text.
9. **Chat Sniffing**: Reading messages for an order the user didn't place and isn't driving.
10. **Immutable Tamper**: Changing the `createdAt` timestamp on an update.
11. **Review Spam**: Creating a review for an order that doesn't exist or isn't completed.
12. **Driver Hijack**: A driver trying to assign themselves to an order already assigned to another driver.

## Test Runner (Draft Rules)
The rules will be written to `firestore.rules` after validation.
