from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator
import uuid


class Category(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    icon = models.CharField(max_length=100, blank=True, help_text="Bootstrap icon class e.g. bi-house")
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='subcategories')
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['sort_order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class County(models.Model):
    """Kenyan counties with delivery fee estimates"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    base_delivery_fee = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Base delivery fee in KSh for home delivery"
    )
    is_active = models.BooleanField(default=True)
    region = models.CharField(max_length=100, blank=True, help_text="e.g. Nairobi, Central, Coast, Rift Valley")

    class Meta:
        verbose_name_plural = 'Counties'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class PickupStation(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    address = models.TextField()
    county = models.ForeignKey(County, on_delete=models.CASCADE, related_name='pickup_stations')
    phone = models.CharField(max_length=20, blank=True)
    whatsapp = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    pickup_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                     help_text="Fee for picking up from this station (0 = free)")
    is_active = models.BooleanField(default=True)
    opening_hours = models.CharField(max_length=200, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Material(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Color(models.Model):
    name = models.CharField(max_length=100)
    hex_code = models.CharField(max_length=7, blank=True, help_text="#RRGGBB")

    def __str__(self):
        return self.name


class Product(models.Model):
    PAYMENT_TYPE_CHOICES = [
        ('full', 'Full Payment Only'),
        ('half', 'Half Payment Accepted (50% upfront, 50% on delivery)'),
        ('installment', 'Installment Plan'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=300)
    slug = models.SlugField(unique=True, blank=True, max_length=350)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)

    # Pricing
    price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                      validators=[MinValueValidator(0)])
    base_delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=400,
                                             help_text="Base delivery fee for this item (KSh)")

    # Payment options
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='full')
    # If half payment is accepted: customer pays 50% upfront
    # If they fail to pay the remaining 50% on delivery, only 25% (1/4) of the total is refunded
    refund_percentage_on_default = models.PositiveIntegerField(
        default=25,
        help_text="% of total price refunded if customer defaults on balance payment (typically 25%)"
    )

    # Physical attributes
    materials = models.ManyToManyField(Material, blank=True)
    colors = models.ManyToManyField(Color, blank=True)
    weight_kg = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    dimensions = models.CharField(max_length=200, blank=True, help_text="L x W x H in cm")

    # Inventory
    stock_quantity = models.PositiveIntegerField(default=0)
    is_in_stock = models.BooleanField(default=True)
    sku = models.CharField(max_length=100, blank=True, unique=True, null=True)

    # Flags
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_new_arrival = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)

    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.CharField(max_length=500, blank=True)
    meta_keywords = models.CharField(max_length=500, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Ratings (computed)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            n = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{n}"
                n += 1
            self.slug = slug
        if not self.meta_title:
            self.meta_title = f"{self.name} - Morara Modern Furniture Kenya"
        if not self.meta_description:
            self.meta_description = self.short_description or self.description[:150]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def effective_price(self):
        return self.sale_price if self.sale_price else self.price

    @property
    def discount_percentage(self):
        if self.sale_price and self.price > 0:
            return int(((self.price - self.sale_price) / self.price) * 100)
        return 0

    @property
    def upfront_payment_amount(self):
        """For half-payment products: 50% of effective price"""
        if self.payment_type == 'half':
            return self.effective_price * 0.5
        return self.effective_price

    def get_delivery_fee_for_county(self, county_slug):
        """
        Calculate delivery fee based on county.
        Business logic: base delivery fee is per-product, scaled by county.
        """
        try:
            county = County.objects.get(slug=county_slug)
            # Delivery fee = product base delivery fee + county surcharge
            county_surcharge = county.base_delivery_fee
            return self.base_delivery_fee + county_surcharge
        except County.DoesNotExist:
            return self.base_delivery_fee


class ProductVariant(models.Model):
    """For products that come in sizes (e.g., 4x6, 5x6, 6x6 beds)"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=200, help_text="e.g. '4x6 By 3.5x6', '5x6 Standard'")
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                            help_text="Added to base price (can be negative)")
    stock_quantity = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)
    sku = models.CharField(max_length=100, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f"{self.product.name} - {self.name}"

    @property
    def final_price(self):
        return self.product.effective_price + self.price_adjustment


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order']

    def __str__(self):
        return f"Image for {self.product.name}"


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'user')

    def __str__(self):
        return f"Review by {self.user} on {self.product}"


class Banner(models.Model):
    POSITION_CHOICES = [
        ('hero', 'Hero Banner'),
        ('promo', 'Promotional Banner'),
        ('category', 'Category Banner'),
    ]
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True)
    image = models.ImageField(upload_to='banners/')
    link_url = models.CharField(max_length=500, blank=True)
    position = models.CharField(max_length=20, choices=POSITION_CHOICES, default='hero')
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order']

    def __str__(self):
        return self.title


class Wishlist(models.Model):
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='wishlist')
    products = models.ManyToManyField(Product, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wishlist of {self.user}"