import { useState, useCallback, memo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useBills } from "@/hooks/useBills";
import { useCategories } from "@/hooks/useCategories";
import { OrderItem, PaymentMethod } from "@/types/pos";
import { Plus, Minus, Trash2, Search, Banknote, Smartphone, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);

  // Memoized handlers to prevent re-renders
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
      <div className="grid lg:grid-cols-5 gap-4 h-[calc(100vh-100px)] animate-fade-in">
        {/* Menu Panel - Takes 3 columns */}
        <div className="lg:col-span-3 flex flex-col bg-card rounded-xl p-4 shadow-sm border border-border">
          {/* Search and filters */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 text-base bg-background"
              />
            </div>
            {/* Category Tabs */}
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                <Button
                  variant={categoryFilter === "all" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setCategoryFilter("all")}
                  className="rounded-full px-4"
                >
                  All Items
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={categoryFilter === cat.name ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setCategoryFilter(cat.name)}
                    className="rounded-full px-4"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Menu Grid */}
          {menuLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Loading menu...
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-4">
                {filteredItems.map((item) => {
                  const itemColor = item.color || "hsl(var(--primary))";
                  const orderItem = order.find(o => o.menuItem.id === item.id);
                  const qtyInOrder = orderItem?.quantity || 0;
                  
                  return (
                    <Button
                      key={item.id}
                      variant="outline"
                      className="h-auto py-3 px-2 flex flex-col items-center gap-1 touch-action-manipulation relative transition-all hover:shadow-md active:scale-95"
                      style={{ 
                        borderColor: qtyInOrder > 0 ? itemColor : 'hsl(var(--border))',
                        borderWidth: qtyInOrder > 0 ? '2px' : '1px',
                        backgroundColor: qtyInOrder > 0 ? `${itemColor}15` : undefined,
                      }}
                      onClick={() => addToOrder(item)}
                    >
                      {qtyInOrder > 0 && (
                        <span 
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-primary-foreground"
                          style={{ backgroundColor: itemColor }}
                        >
                          {qtyInOrder}
                        </span>
                      )}
                      {item.image_url && (
                        isEmoji(item.image_url) ? (
                          <span className="text-3xl">{item.image_url}</span>
                        ) : (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )
                      )}
                      <span className="font-medium text-xs text-center leading-tight">{item.name}</span>
                      <span className="font-bold text-primary text-sm">
                        ₹{Number(item.price)}
                      </span>
                    </Button>
                  );
                })}
                {filteredItems.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    {search || categoryFilter !== "all" ? "No items match" : "No active items"}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Order Summary - Takes 2 columns */}
        <Card className="lg:col-span-2 flex flex-col shadow-md">
          <CardHeader className="pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Order</CardTitle>
                {order.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {order.reduce((sum, o) => sum + o.quantity, 0)} items
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1">
                <Package className="h-4 w-4 text-primary" />
                <Label htmlFor="parcel-all" className="text-xs cursor-pointer">
                  All Parcel
                </Label>
                <Switch
                  id="parcel-all"
                  checked={applyParcelToAll}
                  onCheckedChange={setApplyParcelToAll}
                  className="scale-75"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-3 overflow-hidden">
            {/* Order Items */}
            <ScrollArea className="flex-1 -mx-3 px-3">
              {order.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
                  <span className="text-sm">Tap items to add</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {order.map((item) => {
                    const lineSubtotal = item.quantity * item.menuItem.price;
                    const parcelQty = applyParcelToAll ? item.quantity : item.parcelQuantity;
                    const lineParcel = parcelQty * PARCEL_CHARGE;

                    return (
                      <div key={item.menuItem.id} className="p-2 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          {/* Quantity controls */}
                          <div className="flex items-center gap-1 bg-background rounded-lg border border-border">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 touch-action-manipulation"
                              onClick={() => handleUpdateQuantity(item.menuItem.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 touch-action-manipulation"
                              onClick={() => handleUpdateQuantity(item.menuItem.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Item name and price */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.menuItem.name}</p>
                            <p className="text-xs text-muted-foreground">₹{item.menuItem.price} each</p>
                          </div>
                          
                          {/* Line total and delete */}
                          <div className="text-right">
                            <p className="font-bold text-sm">₹{lineSubtotal}</p>
                            {parcelQty > 0 && (
                              <p className="text-xs text-primary">+₹{lineParcel}</p>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveFromOrder(item.menuItem.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Parcel controls - simplified */}
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

            {/* Totals */}
            <div className="border-t border-border pt-3 mt-3 space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {parcelCharges > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Parcel</span>
                  <span>₹{parcelCharges}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-1">
                <span>Total</span>
                <span className="text-primary">₹{total}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Button
                size="lg"
                variant="outline"
                className="h-14 text-base touch-action-manipulation border-2"
                onClick={() => handlePayment("Cash")}
                disabled={order.length === 0 || createBill.isPending}
              >
                <Banknote className="h-5 w-5 mr-2" />
                Cash
              </Button>
              <Button
                size="lg"
                className="h-14 text-base touch-action-manipulation"
                onClick={() => handlePayment("UPI")}
                disabled={order.length === 0 || createBill.isPending}
              >
                <Smartphone className="h-5 w-5 mr-2" />
                UPI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}