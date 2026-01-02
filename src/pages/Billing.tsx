import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useBills } from "@/hooks/useBills";
import { useCategories } from "@/hooks/useCategories";
import { OrderItem, PaymentMethod } from "@/types/pos";
import { Plus, Minus, Trash2, Search, Banknote, Smartphone, Package } from "lucide-react";
import { toast } from "sonner";
import juiceHeroBg from "@/assets/juice-hero-bg.jpg";

const PARCEL_CHARGE = 5;

export default function Billing() {
  const { activeMenuItems, isLoading: menuLoading } = useMenuItems();
  const { createBill } = useBills();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [applyParcelToAll, setApplyParcelToAll] = useState(false);

  const filteredItems = activeMenuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isEmoji = (str: string) => {
    return /\p{Emoji}/u.test(str) && str.length <= 4;
  };

  const addToOrder = (menuItem: typeof activeMenuItems[0]) => {
    setOrder((prev) => {
      const existing = prev.find((o) => o.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((o) =>
          o.menuItem.id === menuItem.id ? { ...o, quantity: o.quantity + 1 } : o
        );
      }
      return [...prev, { menuItem, quantity: 1, isParcel: false, parcelQuantity: 0 }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setOrder((prev) =>
      prev
        .map((o) => {
          if (o.menuItem.id === menuItemId) {
            const newQty = o.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...o,
              quantity: newQty,
              parcelQuantity: Math.min(o.parcelQuantity, newQty),
            };
          }
          return o;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const removeFromOrder = (menuItemId: string) => {
    setOrder((prev) => prev.filter((o) => o.menuItem.id !== menuItemId));
  };

  const toggleItemParcel = (menuItemId: string) => {
    if (applyParcelToAll) return;
    setOrder((prev) =>
      prev.map((o) =>
        o.menuItem.id === menuItemId
          ? {
              ...o,
              isParcel: !o.isParcel,
              parcelQuantity: !o.isParcel ? o.quantity : 0,
            }
          : o
      )
    );
  };

  const updateParcelQuantity = (menuItemId: string, qty: number) => {
    if (applyParcelToAll) return;
    setOrder((prev) =>
      prev.map((o) =>
        o.menuItem.id === menuItemId
          ? {
              ...o,
              parcelQuantity: Math.max(0, Math.min(qty, o.quantity)),
              isParcel: qty > 0,
            }
          : o
      )
    );
  };

  // Calculate totals
  const subtotal = order.reduce((sum, o) => sum + o.quantity * o.menuItem.price, 0);
  const parcelCharges = order.reduce((sum, o) => {
    const parcelQty = applyParcelToAll ? o.quantity : o.parcelQuantity;
    return sum + parcelQty * PARCEL_CHARGE;
  }, 0);
  const total = subtotal + parcelCharges;

  const handlePayment = (method: PaymentMethod) => {
    if (order.length === 0) {
      toast.error("Add items to the order first");
      return;
    }

    createBill.mutate(
      {
        items: order,
        paymentMethod: method,
        applyParcelToAll,
      },
      {
        onSuccess: () => {
          setOrder([]);
          setApplyParcelToAll(false);
        },
      }
    );
  };

  // Memoized handlers
  const handleUpdateQuantity = useCallback((menuItemId: string, delta: number) => {
    updateQuantity(menuItemId, delta);
  }, []);

  const handleRemoveFromOrder = useCallback((menuItemId: string) => {
    removeFromOrder(menuItemId);
  }, []);

  const handleToggleParcel = useCallback((menuItemId: string) => {
    toggleItemParcel(menuItemId);
  }, [applyParcelToAll]);

  const handleParcelQtyChange = useCallback((menuItemId: string, qty: number) => {
    updateParcelQuantity(menuItemId, qty);
  }, [applyParcelToAll]);

  return (
    <AppLayout>
      <div className="relative min-h-[calc(100vh-80px)] -m-4 md:-m-6 flex flex-col">
        {/* Content area with background */}
        <div className="flex-1 relative">
          {/* Background image - positioned at bottom */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[40%] bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{ backgroundImage: `url(${juiceHeroBg})` }}
          />
          
          {/* Main content */}
          <div className="relative z-10 p-4 md:p-6 h-full">
            <div className="grid lg:grid-cols-5 gap-6 h-full animate-fade-in">
              {/* Menu Panel - Left side */}
              <div className="lg:col-span-3 flex flex-col">
                <h2 className="text-lg font-semibold text-foreground mb-3">Menu</h2>
                
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 bg-muted/50 border-border"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 flex-wrap mb-4">
                  <Button
                    variant={categoryFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("all")}
                    className="rounded-full h-8 px-4 text-xs font-medium"
                  >
                    All
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={categoryFilter === cat.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoryFilter(cat.name)}
                      className="rounded-full h-8 px-4 text-xs font-medium"
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>

                {/* Menu Grid */}
                {menuLoading ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Loading menu...
                  </div>
                ) : (
                  <ScrollArea className="flex-1 max-h-[calc(100vh-320px)]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pr-2">
                      {filteredItems.map((item) => {
                        const itemColor = item.color || "#22c55e";
                        const orderItem = order.find(o => o.menuItem.id === item.id);
                        const qtyInOrder = orderItem?.quantity || 0;
                        
                        return (
                          <button
                            key={item.id}
                            className="relative p-3 rounded-lg border-2 bg-card/90 backdrop-blur-sm flex flex-col items-center gap-2 touch-action-manipulation transition-all hover:shadow-lg active:scale-[0.98]"
                            style={{ 
                              borderColor: qtyInOrder > 0 ? itemColor : 'hsl(var(--border))',
                              backgroundColor: qtyInOrder > 0 ? `${itemColor}10` : undefined,
                            }}
                            onClick={() => addToOrder(item)}
                          >
                            {qtyInOrder > 0 && (
                              <span 
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white shadow-md"
                                style={{ backgroundColor: itemColor }}
                              >
                                {qtyInOrder}
                              </span>
                            )}
                            
                            {/* Item image/emoji */}
                            <div className="w-12 h-12 flex items-center justify-center">
                              {item.image_url ? (
                                isEmoji(item.image_url) ? (
                                  <span className="text-3xl">{item.image_url}</span>
                                ) : (
                                  <img 
                                    src={item.image_url} 
                                    alt={item.name} 
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                )
                              ) : (
                                <div 
                                  className="w-10 h-10 rounded-lg opacity-20"
                                  style={{ backgroundColor: itemColor }}
                                />
                              )}
                            </div>
                            
                            <span className="font-medium text-xs text-center text-foreground leading-tight line-clamp-2">
                              {item.name}
                            </span>
                            <span className="font-bold text-sm" style={{ color: itemColor }}>
                              ₹{Number(item.price).toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                      {filteredItems.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                          {search || categoryFilter !== "all" ? "No items match" : "No active items"}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Order Summary - Right side */}
              <div className="lg:col-span-2 bg-card rounded-xl shadow-lg border border-border flex flex-col max-h-[calc(100vh-120px)]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <Label htmlFor="parcel-all" className="text-xs cursor-pointer">
                      All Parcel
                    </Label>
                    <Switch
                      id="parcel-all"
                      checked={applyParcelToAll}
                      onCheckedChange={setApplyParcelToAll}
                    />
                  </div>
                </div>

                {/* Order Items */}
                <ScrollArea className="flex-1 p-4">
                  {order.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      Tap items to add to order
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {order.map((item) => {
                        const lineSubtotal = item.quantity * item.menuItem.price;
                        const parcelQty = applyParcelToAll ? item.quantity : item.parcelQuantity;
                        const lineParcel = parcelQty * PARCEL_CHARGE;

                        return (
                          <div key={item.menuItem.id} className="p-3 bg-secondary/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              {/* Quantity controls */}
                              <div className="flex items-center gap-1 bg-background rounded-md border border-border">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleUpdateQuantity(item.menuItem.id, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleUpdateQuantity(item.menuItem.id, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              {/* Item info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.menuItem.name}</p>
                                <p className="text-xs text-muted-foreground">₹{item.menuItem.price} each</p>
                              </div>
                              
                              {/* Total */}
                              <div className="text-right">
                                <p className="font-semibold text-sm">₹{lineSubtotal.toFixed(2)}</p>
                                {parcelQty > 0 && (
                                  <p className="text-xs text-primary">+₹{lineParcel}</p>
                                )}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveFromOrder(item.menuItem.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Parcel controls */}
                            {!applyParcelToAll && (
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                                <Switch
                                  checked={item.isParcel}
                                  onCheckedChange={() => handleToggleParcel(item.menuItem.id)}
                                  className="scale-75"
                                />
                                <span className="text-xs text-muted-foreground">Parcel</span>
                                {item.isParcel && (
                                  <div className="flex items-center gap-1 ml-auto">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleParcelQtyChange(item.menuItem.id, item.parcelQuantity - 1)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center text-xs">{item.parcelQuantity}</span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleParcelQtyChange(item.menuItem.id, item.parcelQuantity + 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Totals and Payment */}
                <div className="p-4 border-t border-border space-y-3">
                  {/* Totals */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Parcel Charges</span>
                      <span>₹{parcelCharges.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-1">
                      <span>Total</span>
                      <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-12 text-sm font-medium touch-action-manipulation"
                      onClick={() => handlePayment("Cash")}
                      disabled={order.length === 0 || createBill.isPending}
                    >
                      <Banknote className="h-4 w-4 mr-2" />
                      Cash
                    </Button>
                    <Button
                      className="h-12 text-sm font-medium touch-action-manipulation"
                      onClick={() => handlePayment("UPI")}
                      disabled={order.length === 0 || createBill.isPending}
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      UPI
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
