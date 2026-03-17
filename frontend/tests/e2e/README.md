# E2E Boutique (Playwright)

## Installation

```bash
npm install
npx playwright install
```

## Exécution

```bash
npm run e2e
```

Test live sans mocks frontend:

```bash
npm run e2e:live
```

Pré-requis du mode live:
- `backend/.env.e2e` doit exister.
- PostgreSQL doit exposer la base indiquée dans `backend/.env.e2e`.
- Le test démarre le backend Nest sur `http://127.0.0.1:3000` et le frontend Angular sur `http://127.0.0.1:4200`.

## Scénarios couverts

- Listing Boutique -> Détail produit -> Ajout panier -> Checkout -> Paiement.
- Retour Stripe (`status=success&session_id=...`) -> vérification paiement -> nettoyage sélection checkout.
- Smoke live: frontend Angular -> API backend locale réelle -> `GET /api/cshop/products`.
