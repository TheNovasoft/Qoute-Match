# Stripe pay-in (QuoteMatch)

Stripe is used for **card pay-in only**. Withdrawals stay Bank Transfer (manual). Hire/escrow uses wallet balance, not Stripe.

## Flows

### Buyer
1. Deposit Money → select **Stripe Hosted** → amount → Confirm
2. Site creates a Stripe **PaymentIntent** (secret key)
3. Card form (Elements) loads with publishable key
4. Pay Now → Stripe charges the card
5. `/ipn/stripe` verifies success → **wallet balance** increases
6. Accept quote / hire uses that wallet (escrow), not Stripe again

### Freelancer
1. Lead Credits → package or plan → payment method **Stripe**
2. Same PaymentIntent + Elements checkout
3. Success → **lead credits** or **subscription** fulfilled

Wallet option on Lead Credits skips Stripe and uses existing provider balance.

## Admin setup

**Payment Gateways → Automatic Gateways → Stripe Hosted**

| Field | Purpose |
|--------|---------|
| Publishable key (`pk_test_` / `pk_live_`) | Browser / Stripe.js |
| Secret key (`sk_test_` / `sk_live_`) | Server / PaymentIntent |
| USD currency row | Min/max, charges, rate |
| Status Enable | Gateway appears for users |

Helper script (optional): `php scripts/setup-stripe-payment.php`

## Key code paths

- `app/Http/Controllers/Gateway/Stripe/ProcessController.php` — PaymentIntent + IPN
- `resources/views/templates/basic/buyer/payment/Stripe.blade.php` — card UI
- `resources/js/Pages/Shared/GatewayCheckout.jsx` — Inertia bridge + Stripe.js load
- `app/Http/Controllers/User/MonetisationPaymentController.php` — credits/plans pay-in

## Test

- Test card: `4242 4242 4242 4242` (any future expiry, any CVC)
- Confirm in [Stripe Dashboard → Test → Payments](https://dashboard.stripe.com/test/payments)
