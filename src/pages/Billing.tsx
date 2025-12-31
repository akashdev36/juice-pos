import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useBills } from "@/hooks/useBills";
import { OrderItem, PaymentMethod, MENU_CATEGORIES } from "@/types/pos";
import { Plus, Minus, Trash2, Search, Banknote, Smartphone, Package } from "lucide-react";
import { toast } from "sonner";

const PARCEL_CHARGE = 5;

export default function Billing() {
  const { activeMenuItems, isLoading: menuLoading } = useMenuItems();
  const { createBill } = useBills();
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

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">
        {/* Menu Panel */}
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">Menu</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                variant={categoryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("all")}
                className="whitespace-nowrap"
              >
                All
              </Button>
              {MENU_CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                  className="whitespace-nowrap"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {menuLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading menu...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-380px)] overflow-y-auto">
              {filteredItems.map((item) => {
                const itemColor = item.color || "#22c55e";
                return (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="h-auto py-4 px-3 flex flex-col items-center gap-1 touch-action-manipulation border-2 transition-all hover:scale-[1.02]"
                    style={{ 
                      borderColor: itemColor,
                      backgroundColor: `${itemColor}15`,
                    }}
                    onClick={() => addToOrder(item)}
                  >
                    {item.image_url && (
                      isEmoji(item.image_url) ? (
                        <span className="text-2xl">{item.image_url}</span>
                      ) : (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )
                    )}
                    <span className="font-medium text-sm text-center">{item.name}</span>
                    <span 
                      className="font-bold"
                      style={{ color: itemColor }}
                    >
                      {formatCurrency(Number(item.price))}
                    </span>
                  </Button>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {search || categoryFilter !== "all" ? "No items match your filters" : "No active menu items"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Order Summary</CardTitle>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <Label htmlFor="parcel-all" className="text-sm">
                  All Parcel
                </Label>
                <Switch
                  id="parcel-all"
                  checked={applyParcelToAll}
                  onCheckedChange={setApplyParcelToAll}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Items */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {order.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tap items to add to order
                </div>
              ) : (
                order.map((item) => {
                  const lineSubtotal = item.quantity * item.menuItem.price;
                  const parcelQty = applyParcelToAll ? item.quantity : item.parcelQuantity;
                  const lineParcel = parcelQty * PARCEL_CHARGE;
                  const lineTotal = lineSubtotal + lineParcel;

                  return (
                    <div key={item.menuItem.id} className="p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{item.menuItem.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeFromOrder(item.menuItem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 touch-action-manipulation"
                            onClick={() => updateQuantity(item.menuItem.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 touch-action-manipulation"
                            onClick={() => updateQuantity(item.menuItem.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <span className="text-muted-foreground">
                          × {formatCurrency(Number(item.menuItem.price))}
                        </span>
                        <span className="ml-auto font-medium">{formatCurrency(lineSubtotal)}</span>
                      </div>

                      {/* Parcel controls */}
                      {!applyParcelToAll && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.isParcel}
                              onCheckedChange={() => toggleItemParcel(item.menuItem.id)}
                              className="scale-75"
                            />
                            <span className="text-muted-foreground">Parcel</span>
                          </div>
                          {item.isParcel && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Qty:</span>
                              <Input
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={item.parcelQuantity}
                                onChange={(e) =>
                                  updateParcelQuantity(item.menuItem.id, parseInt(e.target.value) || 0)
                                }
                                className="w-16 h-8 text-center"
                              />
                            </div>
                          )}
                          {parcelQty > 0 && (
                            <span className="ml-auto text-primary">
                              +{formatCurrency(lineParcel)}
                            </span>
                          )}
                        </div>
                      )}
                      {applyParcelToAll && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Parcel ({item.quantity} × ₹{PARCEL_CHARGE})
                          </span>
                          <span className="text-primary">+{formatCurrency(lineParcel)}</span>
                        </div>
                      )}

                      <div className="flex justify-end mt-2 pt-2 border-t border-border">
                        <span className="font-bold">{formatCurrency(lineTotal)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Parcel Charges</span>
                <span>{formatCurrency(parcelCharges)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <Separator />

            {/* Payment Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                variant="outline"
                className="h-16 text-lg touch-action-manipulation"
                onClick={() => handlePayment("Cash")}
                disabled={order.length === 0 || createBill.isPending}
              >
                <Banknote className="h-6 w-6 mr-2" />
                Cash
              </Button>
              <Button
                size="lg"
                className="h-16 text-lg touch-action-manipulation"
                onClick={() => handlePayment("UPI")}
                disabled={order.length === 0 || createBill.isPending}
              >
                <Smartphone className="h-6 w-6 mr-2" />
                UPI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}