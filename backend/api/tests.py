from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from .models import Product

class ProductAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_product_model_and_list(self):
        p = Product.objects.create(name='Test', price='1.00', quantity=5)
        self.assertEqual(Product.objects.count(), 1)
        # list endpoint requires auth; ensure 401 for anonymous
        resp = self.client.get('/api/products/')
        self.assertEqual(resp.status_code, 401)
