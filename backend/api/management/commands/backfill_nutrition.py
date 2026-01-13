from django.core.management.base import BaseCommand
from api.models import Product
import requests
import time


class Command(BaseCommand):
    help = 'Backfill nutritional_info for products using OpenFoodFacts'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=0, help='Limit number of products to process (0 = all)')
        parser.add_argument('--delay', type=float, default=1.0, help='Delay seconds between requests to avoid rate limits')

    def handle(self, *args, **options):
        limit = options.get('limit', 0) or None
        delay = options.get('delay', 1.0)

        qs = Product.objects.all()
        # We'll filter in Python so we support both null and empty dict
        targets = [p for p in qs if not p.nutritional_info]
        if limit:
            targets = targets[:limit]

        total = len(targets)
        self.stdout.write(self.style.NOTICE(f'Found {total} products to backfill'))

        for idx, product in enumerate(targets, start=1):
            query = None
            # prefer product name else brand
            if product.name and product.name.strip():
                query = product.name
            elif product.brand:
                query = product.brand
            else:
                self.stdout.write(f'[{idx}/{total}] Skipping product id={product.id} (no name)')
                continue

            try:
                resp = requests.get('https://world.openfoodfacts.org/cgi/search.pl', params={
                    'search_terms': query,
                    'search_simple': 1,
                    'json': 1,
                    'page_size': 1
                }, timeout=15)
                resp.raise_for_status()
                data = resp.json()
                products = data.get('products') or []
                if not products:
                    self.stdout.write(f'[{idx}/{total}] No OF result for "{query}"')
                else:
                    p = products[0]
                    nutr = {'nutriments': p.get('nutriments', {}), 'serving_size': p.get('serving_size'), 'product_name': p.get('product_name')}
                    product.nutritional_info = nutr
                    product.save(update_fields=['nutritional_info'])
                    self.stdout.write(self.style.SUCCESS(f'[{idx}/{total}] Backfilled product id={product.id} from "{query}"'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'[{idx}/{total}] Error fetching "{query}": {e}'))

            time.sleep(delay)

        self.stdout.write(self.style.SUCCESS('Backfill complete'))
