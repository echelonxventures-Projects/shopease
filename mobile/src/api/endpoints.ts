import { apiClient } from "./client";

// ==================== PRODUCTS ====================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  image: string;
  rating: number;
  reviewCount: number;
  stock: number;
  variants: { id: string; name: string; price?: number }[];
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}): Promise<ProductListResponse | { error: string }> {
  const res = await apiClient.get<ProductListResponse>("/api/products", params as any);
  return res.data || { error: res.error || "Failed to load products" };
}

export async function getProduct(id: string): Promise<Product | { error: string }> {
  const res = await apiClient.get<Product>(`/api/products/${id}`);
  return res.data || { error: res.error || "Failed to load product" };
}

// ==================== CATEGORIES ====================

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

export async function getCategories(): Promise<Category[] | { error: string }> {
  const res = await apiClient.get<Category[]>("/api/categories");
  return res.data || { error: res.error || "Failed to load categories" };
}

// ==================== CART ====================

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export async function getCart(): Promise<CartResponse | { error: string }> {
  const res = await apiClient.get<CartResponse>("/api/cart");
  return res.data || { error: res.error || "Failed to load cart" };
}

export async function addToCart(data: {
  productId: string;
  variantId?: string;
  quantity: number;
}): Promise<CartResponse | { error: string }> {
  const res = await apiClient.post<CartResponse>("/api/cart/add", data);
  return res.data || { error: res.error || "Failed to add to cart" };
}

// ==================== ORDERS ====================

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  address: string;
  estimatedDelivery?: string;
  items: { name: string; quantity: number; price: number }[];
  agent?: { name: string; phone: string };
  createdAt: string;
}

export interface CreateOrderPayload {
  items: { productId: string; variantId?: string; quantity: number; price: number }[];
  addressId: string;
  paymentMethod: string;
  promoCode?: string;
}

export async function createOrder(payload: CreateOrderPayload): Promise<{ orderId: string } | { error: string }> {
  const res = await apiClient.post<{ orderId: string }>("/api/orders", payload);
  return res.data || { error: res.error || "Failed to create order" };
}

export async function getOrders(): Promise<Order[] | { error: string }> {
  const res = await apiClient.get<Order[]>("/api/orders");
  return res.data || { error: res.error || "Failed to load orders" };
}

export async function getOrder(id: string): Promise<Order | { error: string }> {
  const res = await apiClient.get<Order>(`/api/orders/${id}`);
  return res.data || { error: res.error || "Failed to load order" };
}

// ==================== AUTH ====================

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export async function login(email: string, password: string): Promise<AuthResponse | { error: string }> {
  const res = await apiClient.post<AuthResponse>("/api/auth/login", { email, password });
  if (res.data && !(res as any).error) {
    await apiClient.setToken(res.data.token, res.data.refreshToken);
  }
  return res.data || { error: res.error || "Login failed" };
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthResponse | { error: string }> {
  const res = await apiClient.post<AuthResponse>("/api/auth/register", data);
  if (res.data && !(res as any).error) {
    await apiClient.setToken(res.data.token, res.data.refreshToken);
  }
  return res.data || { error: res.error || "Registration failed" };
}

// ==================== PROFILE ====================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  addresses: { id: string; label: string; line1: string; city: string; state: string; pincode: string }[];
}

export async function getProfile(): Promise<UserProfile | { error: string }> {
  const res = await apiClient.get<UserProfile>("/api/profile");
  return res.data || { error: res.error || "Failed to load profile" };
}
