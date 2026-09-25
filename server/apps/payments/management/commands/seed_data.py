import random
import urllib.error
import urllib.request
from decimal import Decimal

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from apps.cart.models import Cart, CartItem
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment
from apps.products.models import Category, Product, ProductImage
from apps.users.models import User

IMAGE_URL = "https://picsum.photos/seed/{seed}/800/600"
IMAGES_PER_PRODUCT = 3

CATALOG = {
    "Electronics": [
        ("Wireless Headphones", "Over-ear headphones with noise cancellation.", "89.99", 25),
        ("Mechanical Keyboard", "Tactile switches, RGB backlight.", "119.00", 15),
        ("4K Monitor", "27-inch display with HDR support.", "329.99", 8),
        ("Portable SSD 1TB", "USB-C external drive.", "94.50", 40),
        ("Bluetooth Speaker", "Waterproof, 12-hour battery.", "54.00", 33),
        ("Webcam 1080p", "Autofocus, built-in mic.", "39.99", 28),
    ],
    "Books": [
        ("The Pragmatic Programmer", "Classic guide to software craftsmanship.", "34.99", 30),
        ("Atomic Habits", "Practical guide to building good habits.", "18.50", 50),
        ("A Brief History of Time", "Stephen Hawking's classic on cosmology.", "15.00", 20),
        ("Clean Code", "A handbook of agile software craftsmanship.", "39.99", 12),
        ("Dune", "Frank Herbert's sci-fi epic.", "12.99", 45),
        ("The Hobbit", "Bilbo Baggins' unexpected journey.", "11.50", 60),
    ],
    "Clothing": [
        ("Cotton T-Shirt", "Basic crew neck, various colors.", "14.99", 100),
        ("Denim Jacket", "Classic fit, mid-wash denim.", "59.99", 22),
        ("Running Shoes", "Lightweight breathable mesh.", "74.00", 35),
        ("Wool Beanie", "Warm knit hat for winter.", "12.50", 60),
        ("Rain Jacket", "Packable, waterproof shell.", "68.00", 18),
        ("Leather Belt", "Full-grain leather, brass buckle.", "29.99", 40),
    ],
    "Home & Kitchen": [
        ("French Press", "12-cup borosilicate glass carafe.", "27.99", 18),
        ("Chef's Knife", "8-inch stainless steel blade.", "42.00", 25),
        ("Non-stick Frying Pan", "10-inch, PFOA-free coating.", "24.99", 30),
        ("Ceramic Mug Set", "Set of 4, dishwasher safe.", "19.99", 45),
        ("Cutting Board", "Bamboo, reversible.", "17.50", 38),
        ("Electric Kettle", "1.7L, auto shut-off.", "32.99", 22),
    ],
    "Sports & Outdoors": [
        ("Yoga Mat", "Non-slip, 6mm thick.", "22.00", 40),
        ("Camping Tent (2-person)", "Waterproof, easy setup.", "89.00", 10),
        ("Adjustable Dumbbells", "5-25 lbs per hand.", "149.99", 6),
        ("Insulated Water Bottle", "Keeps drinks cold 24h.", "18.99", 70),
        ("Hiking Backpack 30L", "Padded straps, rain cover included.", "64.00", 16),
        ("Resistance Bands Set", "5 levels, includes carry bag.", "16.99", 55),
    ],
    "Toys & Games": [
        ("Wooden Building Blocks", "100-piece set, ages 3+.", "24.99", 30),
        ("Board Game: Strategy Classic", "2-4 players, 45 min.", "34.00", 20),
        ("Remote Control Car", "1:16 scale, rechargeable.", "39.99", 15),
        ("Jigsaw Puzzle 1000pc", "Landscape design.", "14.50", 25),
    ],
    "Beauty & Personal Care": [
        ("Electric Toothbrush", "Rechargeable, 3 modes.", "44.99", 20),
        ("Shampoo & Conditioner Set", "Sulfate-free, 2x300ml.", "22.00", 40),
        ("Facial Moisturizer", "SPF 30, all skin types.", "18.99", 35),
        ("Beard Trimmer", "Cordless, 20 length settings.", "36.00", 18),
    ],
}

DEMO_USERNAMES = ["alice", "bob", "charlie", "dave", "eve", "frank"]


def fetch_image(seed):
    url = IMAGE_URL.format(seed=seed)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read()
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"    (skipped image, could not fetch: {exc})")
        return None


class Command(BaseCommand):
    help = "Populate the database with demo users, categories, products, images, carts, orders, and payments."

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data (safe to run more than once)...")
        users = self.create_users()
        categories = self.create_categories()
        products = self.create_products(categories, users["admin"])
        self.create_images(products)
        self.create_carts(users, products)
        self.create_orders(users, products)
        self.stdout.write(self.style.SUCCESS("Done."))
        self.stdout.write("\nLogin credentials:")
        self.stdout.write("  Superuser:  superuser@example.com / SuperPass123!")
        self.stdout.write("  Admin:      admin@example.com / AdminPass123!")
        self.stdout.write(
            "  Users:      " + ", ".join(f"{n}@example.com" for n in DEMO_USERNAMES) + ", all UserPass123!"
        )

    def create_users(self):
        self.stdout.write("Creating users...")

        superuser, _ = User.objects.get_or_create(
            email="superuser@example.com",
            defaults={"full_name": "Site Superuser", "is_staff": True, "is_superuser": True},
        )
        superuser.set_password("SuperPass123!")
        superuser.save()

        admin, _ = User.objects.get_or_create(
            email="admin@example.com",
            defaults={"full_name": "Store Admin", "is_staff": True},
        )
        admin.set_password("AdminPass123!")
        admin.save()
        self.grant_admin_panel_permissions(admin)

        demo_users = {}
        for name in DEMO_USERNAMES:
            user, _ = User.objects.get_or_create(
                email=f"{name}@example.com",
                defaults={"full_name": name.capitalize()},
            )
            user.set_password("UserPass123!")
            user.save()
            demo_users[name] = user

        return {"superuser": superuser, "admin": admin, **demo_users}

    def grant_admin_panel_permissions(self, admin):
        """is_staff alone gives no Django-admin-site model permissions; grant the
        ones needed to manage the catalogue and orders there. Deliberately
        excludes User/Group/Permission models, so the 'admin cannot promote
        users' rule holds in the Django admin site too, not just the API."""
        managed_models = [Category, Product, ProductImage, Order, OrderItem, Payment]
        content_types = [ContentType.objects.get_for_model(m) for m in managed_models]
        permissions = Permission.objects.filter(content_type__in=content_types)
        admin.user_permissions.set(permissions)

    def create_categories(self):
        self.stdout.write("Creating categories...")
        descriptions = {
            "Electronics": "Gadgets, computers, and accessories.",
            "Books": "Fiction, non-fiction, and reference.",
            "Clothing": "Everyday wear for everyone.",
            "Home & Kitchen": "Essentials for the home.",
            "Sports & Outdoors": "Gear for staying active.",
            "Toys & Games": "For kids and adults alike.",
            "Beauty & Personal Care": "Daily care essentials.",
        }
        categories = {}
        for name, desc in descriptions.items():
            cat, _ = Category.objects.get_or_create(name=name, defaults={"description": desc})
            categories[name] = cat
        return categories

    def create_products(self, categories, admin):
        self.stdout.write("Creating products...")
        products = {}
        for cat_name, items in CATALOG.items():
            category = categories[cat_name]
            for name, desc, price, qty in items:
                product, _ = Product.objects.get_or_create(
                    name=name,
                    defaults={
                        "category": category,
                        "description": desc,
                        "price": price,
                        "inventory_quantity": qty,
                        "is_active": True,
                        "created_by": admin,
                    },
                )
                products[name] = product

        discontinued, _ = Product.objects.get_or_create(
            name="Discontinued Flip Phone",
            defaults={
                "category": categories["Electronics"],
                "description": "No longer sold.",
                "price": "49.99",
                "inventory_quantity": 0,
                "is_active": False,
                "created_by": admin,
            },
        )
        products[discontinued.name] = discontinued

        return products

    def create_images(self, products):
        self.stdout.write("Fetching product images (needs internet access; skips gracefully if blocked)...")
        for product in products.values():
            if product.images.exists():
                continue
            slug = (
                product.name.lower()
                .replace(" ", "-")
                .replace("'", "")
                .replace("(", "")
                .replace(")", "")
                .replace("&", "and")
            )
            added = 0
            for i in range(IMAGES_PER_PRODUCT):
                data = fetch_image(f"{slug}-{i}")
                if data:
                    image = ProductImage(product=product, alt_text=product.name, display_order=i)
                    image.image.save(f"{slug}-{i}.jpg", ContentFile(data), save=True)
                    added += 1
            if added:
                self.stdout.write(f"  {product.name}: {added} image(s) added")

    def create_carts(self, users, products):
        self.stdout.write("Adding items to carts...")
        product_list = list(products.values())
        for name in ["alice", "dave", "eve"]:
            cart, _ = Cart.objects.get_or_create(user=users[name])
            for product in random.sample(product_list, 2):
                CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity": random.randint(1, 2)})

    def create_orders(self, users, products):
        self.stdout.write("Creating orders...")

        specs = [
            ("bob", [("Wireless Headphones", 1), ("4K Monitor", 1)],
             Order.Status.PROCESSING, Order.PaymentStatus.PAID, Payment.Status.PAID),
            ("charlie", [("Running Shoes", 2)],
             Order.Status.SHIPPED, Order.PaymentStatus.PAID, Payment.Status.PAID),
            ("charlie", [("Chef's Knife", 1)],
             Order.Status.DELIVERED, Order.PaymentStatus.PAID, Payment.Status.PAID),
            ("alice", [("Mechanical Keyboard", 1)],
             Order.Status.PENDING, Order.PaymentStatus.PENDING, None),
            ("bob", [("Yoga Mat", 1)],
             Order.Status.CANCELLED, Order.PaymentStatus.FAILED, Payment.Status.FAILED),
            ("dave", [("Board Game: Strategy Classic", 1), ("Jigsaw Puzzle 1000pc", 2)],
             Order.Status.DELIVERED, Order.PaymentStatus.PAID, Payment.Status.PAID),
            ("eve", [("Electric Toothbrush", 1)],
             Order.Status.SHIPPED, Order.PaymentStatus.PAID, Payment.Status.PAID),
            ("eve", [("Facial Moisturizer", 2), ("Beard Trimmer", 1)],
             Order.Status.PROCESSING, Order.PaymentStatus.PAID, Payment.Status.PAID),
            ("frank", [("Camping Tent (2-person)", 1), ("Hiking Backpack 30L", 1)],
             Order.Status.PENDING, Order.PaymentStatus.PENDING, None),
            ("frank", [("Denim Jacket", 1)],
             Order.Status.DELIVERED, Order.PaymentStatus.PAID, Payment.Status.PAID),
        ]

        created_count = 0
        for username, items, status, payment_status, record_payment_status in specs:
            user = users[username]
            total = sum(Decimal(str(products[name].price)) * qty for name, qty in items)

            exists = Order.objects.filter(
                user=user, status=status, payment_status=payment_status, total_amount=total
            ).exists()
            if exists:
                continue

            order = Order.objects.create(user=user, total_amount=total, status=status, payment_status=payment_status)
            for name, qty in items:
                product = products[name]
                unit_price = Decimal(str(product.price))
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    unit_price=unit_price,
                    quantity=qty,
                    subtotal=unit_price * qty,
                )
            if record_payment_status:
                Payment.objects.create(
                    order=order,
                    stripe_session_id=f"cs_seed_{order.id}",
                    amount=total,
                    status=record_payment_status,
                )
            created_count += 1

        self.stdout.write(f"  {created_count} order(s) created ({len(specs) - created_count} already existed)")