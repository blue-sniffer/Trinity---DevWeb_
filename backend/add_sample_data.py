import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Product, Customer, Invoice
from decimal import Decimal
from django.utils import timezone

# Create Products
products_data = [
    {'name': 'Coca Cola 330ml', 'price': Decimal('2.99'), 'brand': 'Coca-Cola', 'category': 'Beverages', 'quantity': 100, 'picture': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200'},
    {'name': 'Whole Milk 1L', 'price': Decimal('3.49'), 'brand': 'Dairy Farm', 'category': 'Dairy', 'quantity': 75, 'picture': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200'},
    {'name': 'Organic Bananas', 'price': Decimal('1.99'), 'brand': 'Fresh Farms', 'category': 'Fruits', 'quantity': 150, 'picture': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200'},
    {'name': 'Sourdough Bread', 'price': Decimal('4.99'), 'brand': 'Artisan Bakery', 'category': 'Bakery', 'quantity': 40, 'picture': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200'},
    {'name': 'Greek Yogurt 500g', 'price': Decimal('5.49'), 'brand': 'Chobani', 'category': 'Dairy', 'quantity': 60, 'picture': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200'},
    {'name': 'Organic Eggs 12pk', 'price': Decimal('6.99'), 'brand': 'Happy Hens', 'category': 'Dairy & Eggs', 'quantity': 80, 'picture': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200'}
]

# Create Customers (no email field, use phone as unique identifier)
customers_data = [
    {'first_name': 'John', 'last_name': 'Doe', 'phone': '+1234567890', 'address': '123 Main St', 'city': 'New York', 'zip_code': '10001', 'country': 'USA'},
    {'first_name': 'Jane', 'last_name': 'Smith', 'phone': '+1234567891', 'address': '456 Oak Ave', 'city': 'Los Angeles', 'zip_code': '90001', 'country': 'USA'},
    {'first_name': 'Michael', 'last_name': 'Johnson', 'phone': '+1234567892', 'address': '789 Pine Rd', 'city': 'Chicago', 'zip_code': '60601', 'country': 'USA'},
    {'first_name': 'Emily', 'last_name': 'Brown', 'phone': '+1234567893', 'address': '321 Elm St', 'city': 'Houston', 'zip_code': '77001', 'country': 'USA'}
]

print("Creating products...")
for data in products_data:
    product, created = Product.objects.get_or_create(name=data['name'], defaults=data)
    print(f"{'✓ Created' if created else '- Exists'}: {product.name}")

print("\nCreating customers...")
for data in customers_data:
    customer, created = Customer.objects.get_or_create(phone=data['phone'], defaults=data)
    print(f"{'✓ Created' if created else '- Exists'}: {customer.first_name} {customer.last_name}")

print("\nCreating sample invoices...")
customers = list(Customer.objects.all())
if len(customers) >= 2:
    Invoice.objects.get_or_create(customer=customers[0], total=Decimal('15.47'))
    Invoice.objects.get_or_create(customer=customers[1], total=Decimal('24.95'))
    print(f"✓ Created 2 invoices")

print(f"\n✅ Complete! Products: {Product.objects.count()}, Customers: {Customer.objects.count()}, Invoices: {Invoice.objects.count()}")
