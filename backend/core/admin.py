from django.contrib import admin
from .models import (
    Category, County, PickupStation, Material, Color,
    Product, ProductVariant, ProductImage, Review, Banner, Wishlist
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'is_active', 'sort_order']
    list_editable = ['is_active', 'sort_order']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


@admin.register(County)
class CountyAdmin(admin.ModelAdmin):
    list_display = ['name', 'region', 'base_delivery_fee', 'is_active']
    list_editable = ['base_delivery_fee', 'is_active']
    search_fields = ['name']


@admin.register(PickupStation)
class PickupStationAdmin(admin.ModelAdmin):
    list_display = ['name', 'county', 'pickup_fee', 'is_active']
    list_filter = ['county', 'is_active']


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 2


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'payment_type', 'is_in_stock', 'is_featured', 'is_new_arrival', 'is_best_seller']
    list_editable = ['is_in_stock', 'is_featured', 'is_new_arrival', 'is_best_seller']
    list_filter = ['category', 'is_in_stock', 'payment_type', 'is_featured']
    search_fields = ['name', 'description', 'sku']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, ProductVariantInline]
    fieldsets = (
        ('Basic Info', {'fields': ('name', 'slug', 'category', 'description', 'short_description')}),
        ('Pricing & Payment', {'fields': ('price', 'sale_price', 'payment_type', 'refund_percentage_on_default', 'base_delivery_fee')}),
        ('Physical', {'fields': ('materials', 'colors', 'weight_kg', 'dimensions', 'sku')}),
        ('Inventory', {'fields': ('stock_quantity', 'is_in_stock')}),
        ('Flags', {'fields': ('is_active', 'is_featured', 'is_new_arrival', 'is_best_seller')}),
        ('SEO', {'fields': ('meta_title', 'meta_description', 'meta_keywords'), 'classes': ('collapse',)}),
    )


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'is_approved', 'created_at']
    list_editable = ['is_approved']
    list_filter = ['is_approved', 'rating']


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'position', 'is_active', 'sort_order']
    list_editable = ['is_active', 'sort_order']


admin.site.register(Material)
admin.site.register(Color)