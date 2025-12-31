import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bill, BillItem } from "@/types/pos";
import { Calendar, Receipt, Banknote, Smartphone, Package, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";

type FilterType = "day" | "month" | "all";

export default function History() {
  const [filterType, setFilterType] = useState<FilterType>("day");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Fetch all bills based on filter
  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["history-bills", filterType, selectedDate, selectedMonth.toISOString()],
    queryFn: async () => {
      let query = supabase.from("bills").select("*").order("date_time", { ascending: false });

      if (filterType === "day") {
        query = query.eq("business_date", selectedDate);
      } else if (filterType === "month") {
        const start = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
        const end = format(endOfMonth(selectedMonth), "yyyy-MM-dd");
        query = query.gte("business_date", start).lte("business_date", end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Bill[];
    },
  });

  // Fetch bill items for selected bill
  const { data: billItems = [] } = useQuery({
    queryKey: ["bill-items-detail", selectedBill?.id],
    enabled: !!selectedBill,
    queryFn: async () => {
      if (!selectedBill) return [];
      const { data, error } = await supabase
        .from("bill_items")
        .select("*, menu_items(name)")
        .eq("bill_id", selectedBill.id);
      
      if (error) throw error;
      return data as (BillItem & { menu_items: { name: string } })[];
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);

  const formatDateTime = (dateStr: string) =>
    format(new Date(dateStr), "dd MMM yyyy, hh:mm a");

  const formatDate = (dateStr: string) =>
    format(new Date(dateStr), "dd MMM yyyy");

  // Calculate totals for current filter
  const totalSales = bills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
  const totalOrders = bills.length;
  const totalParcel = bills.reduce((sum, bill) => sum + Number(bill.total_parcel_collected), 0);
  const cashTotal = bills.filter(b => b.payment_method === "Cash").reduce((sum, b) => sum + Number(b.total_amount), 0);
  const upiTotal = bills.filter(b => b.payment_method === "UPI").reduce((sum, b) => sum + Number(b.total_amount), 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header with fruit pattern background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 p-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 left-4 text-6xl">🍊</div>
            <div className="absolute top-8 right-12 text-5xl">🍇</div>
            <div className="absolute bottom-2 left-1/4 text-4xl">🍓</div>
            <div className="absolute bottom-4 right-4 text-6xl">🥭</div>
            <div className="absolute top-1/2 left-1/2 text-5xl">🍉</div>
          </div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-7 w-7 text-primary" />
              Bill History
            </h1>
            <p className="text-muted-foreground mt-1">View and filter all your past transactions</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Filter By</Label>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filterType === "day" && (
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-44"
                  />
                </div>
              )}

              {filterType === "month" && (
                <div className="space-y-2">
                  <Label>Select Month</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-32 text-center font-medium">
                      {format(selectedMonth, "MMM yyyy")}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Total Sales</div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalSales)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Orders</div>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Package className="h-4 w-4" /> Parcel
              </div>
              <div className="text-2xl font-bold">{formatCurrency(totalParcel)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Banknote className="h-4 w-4" /> Cash
              </div>
              <div className="text-2xl font-bold">{formatCurrency(cashTotal)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Smartphone className="h-4 w-4" /> UPI
              </div>
              <div className="text-2xl font-bold">{formatCurrency(upiTotal)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bills List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {filterType === "day" && `Bills for ${formatDate(selectedDate)}`}
              {filterType === "month" && `Bills for ${format(selectedMonth, "MMMM yyyy")}`}
              {filterType === "all" && "All Bills"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading bills...</div>
            ) : bills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No bills found for this period</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-lg">Bill #{bill.bill_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(bill.date_time)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-lg text-primary">
                          {formatCurrency(Number(bill.total_amount))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {bill.payment_method === "Cash" ? (
                            <Banknote className="h-4 w-4" />
                          ) : (
                            <Smartphone className="h-4 w-4" />
                          )}
                          {bill.payment_method}
                          {Number(bill.total_parcel_collected) > 0 && (
                            <span className="ml-2 flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              +{formatCurrency(Number(bill.total_parcel_collected))}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedBill(bill)}
                        className="touch-action-manipulation"
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bill Detail Dialog */}
        <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Bill #{selectedBill?.bill_number}
              </DialogTitle>
            </DialogHeader>
            {selectedBill && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(selectedBill.date_time)}
                </div>

                {/* Items */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {billItems.map((item) => (
                    <div key={item.id} className="flex justify-between p-2 bg-secondary/30 rounded">
                      <div>
                        <div className="font-medium">{item.menu_items?.name || "Unknown Item"}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} × {formatCurrency(Number(item.price_per_unit))}
                          {item.parcel_quantity > 0 && (
                            <span className="ml-2">
                              (Parcel: {item.parcel_quantity})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(Number(item.line_total))}</div>
                        {item.parcel_total > 0 && (
                          <div className="text-xs text-muted-foreground">
                            incl. {formatCurrency(Number(item.parcel_total))} parcel
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(Number(selectedBill.subtotal))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Parcel Charges</span>
                    <span>{formatCurrency(Number(selectedBill.total_parcel_collected))}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(Number(selectedBill.total_amount))}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                    {selectedBill.payment_method === "Cash" ? (
                      <Banknote className="h-4 w-4" />
                    ) : (
                      <Smartphone className="h-4 w-4" />
                    )}
                    Paid via {selectedBill.payment_method}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}