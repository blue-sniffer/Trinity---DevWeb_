from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Product, Customer, Invoice
from .serializers import ProductSerializer, CustomerSerializer, InvoiceSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
import requests
import time

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Save first
        product = serializer.save()

        # If caller provided openfood_query in the request data, try to enrich immediately
        query = None
        try:
            query = self.request.data.get('openfood_query')
        except Exception:
            query = None

        if query:
            of = self._fetch_openfoodfacts_first(query)
            if of:
                product.nutritional_info = of
                product.save()

        return product

    def _fetch_openfoodfacts_first(self, query):
        """Return a small dict with nutriments and serving_size for the first result, or None."""
        try:
            resp = requests.get('https://world.openfoodfacts.org/cgi/search.pl', params={
                'search_terms': query,
                'search_simple': 1,
                'json': 1,
                'page_size': 1
            }, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            products = data.get('products') or []
            if not products:
                return None
            p = products[0]
            return {'nutriments': p.get('nutriments', {}), 'serving_size': p.get('serving_size'), 'product_name': p.get('product_name')}
        except Exception as e:
            # don't raise - log and return None
            print('OpenFoodFacts fetch error:', e)
            return None

    @action(detail=True, methods=['post'])
    def enrich(self, request, pk=None):
        """Enrich a single product from OpenFoodFacts. POST body: {"query": "nutella"} or barcode."""
        product = self.get_object()
        query = request.data.get('query') or request.data.get('openfood_query')
        if not query:
            return Response({'detail': 'query is required'}, status=400)

        of = self._fetch_openfoodfacts_first(query)
        if not of:
            return Response({'detail': 'no_openfoodfacts_result'}, status=404)

        product.nutritional_info = of
        product.save(update_fields=['nutritional_info'])
        return Response({'detail': 'enriched', 'nutritional_info': of})

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

# Simple token view wrapper (use default from simplejwt in urls)
